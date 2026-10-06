import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || 'https://fpmpmoltoijhoruxqsdf.supabase.co').replace(/["'\s]/g, '');
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_6IPsbChJ8y--xDWHyoulmA_UCY2LgyG').replace(/["'\s]/g, '');
  return createClient(supabaseUrl, supabaseKey);
}

export async function generateGooglePassJWT(userId: string, targetStoreId?: string): Promise<string | null> {
  const supabase = getSupabaseClient();

  // 1. Fetch user profile from Supabase to get name
  const { data: profile, error: dbError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', userId)
    .single();

  if (dbError || !profile) {
    console.error('Error fetching profile for google pass helper:', dbError);
    return null;
  }

  // 2. Resolve store and fetch visits from store_profiles
  const storeId = targetStoreId || process.env.VITE_STORE_ID || 'c3ad358a-6412-412e-87f9-8c50986b3298';

  const { data: store } = await supabase
    .from('stores')
    .select('id, name, logo_url, primary_color, secondary_color, promo_banner_image_url, latitude, longitude')
    .eq('id', storeId)
    .maybeSingle();

  const storeName = store?.name || 'Club de Lealtad';

  const { data: storeProf, error: storeProfError } = await supabase
    .from('store_profiles')
    .select('visits')
    .eq('profile_id', userId)
    .eq('store_id', storeId)
    .maybeSingle();

  if (storeProfError) {
    console.error('Error fetching store profile visits:', storeProfError);
  }
  
  const visits = storeProf?.visits || 0;

  // 3. Fetch Google Wallet Credentials from Supabase (store_wallet_credentials) with fallback to env vars
  const { data: dbWalletCreds } = await supabase
    .from('store_wallet_credentials')
    .select('*')
    .eq('store_id', storeId)
    .maybeSingle();

  const issuerId = (dbWalletCreds?.google_issuer_id || process.env.GOOGLE_WALLET_ISSUER_ID || '').trim();
  const clientEmail = (dbWalletCreds?.google_client_email || process.env.GOOGLE_WALLET_CLIENT_EMAIL || '').trim();
  let rawPrivateKey = (dbWalletCreds?.google_private_key || process.env.GOOGLE_WALLET_PRIVATE_KEY || '').trim();
  rawPrivateKey = rawPrivateKey.replace(/\\n/g, '\n').replace(/^["']+|["']+$/g, '');

  let privateKey = '';
  const match = rawPrivateKey.match(/-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----/);
  if (match) {
    const base64Data = match[1].replace(/[\s\r\n]/g, '');
    const chunks = base64Data.match(/.{1,64}/g) || [];
    privateKey = `-----BEGIN PRIVATE KEY-----\n${chunks.join('\n')}\n-----END PRIVATE KEY-----\n`;
  }

  if (!issuerId || !clientEmail || !privateKey) {
    throw new Error(`Credenciales de Google Wallet incompletas. issuer: ${!!issuerId}, email: ${!!clientEmail}, rawKeyLen: ${rawPrivateKey.length}, match: ${!!match}`);
  }

  // Generate unique Object ID (per user and store) and Class ID
  const sanitizedStoreName = storeName.replace(/[^a-zA-Z0-9]/g, '') || 'General';
  const classId = `${issuerId}.LoyaltyClass_${sanitizedStoreName}`; 
  const objectId = `${issuerId}.${userId.replace(/-/g, '')}_${storeId.replace(/-/g, '').substring(0, 8)}`; 

  // 4. Create the JWT payload
  // Referencia: https://developers.google.com/wallet/retail/loyalty-cards/rest/v1/loyaltyobject
  const loyaltyObject: any = {
    id: objectId,
    classId: classId,
    state: 'ACTIVE',
    accountId: userId,
    accountName: profile.full_name || 'Socio Club',
    programName: '\u200B',
    barcode: {
      type: 'QR_CODE',
      value: userId,
      alternateText: ''
    },
    textModulesData: [
      {
        header: 'TITULAR',
        body: profile.full_name || 'Socio Club',
        id: 'member_name'
      },
      {
        header: 'MEMBRESÍA',
        body: visits >= 10 ? '★ SOCIO VIP ★' : 'SOCIO CLUB',
        id: 'tier'
      },
      {
        header: 'SUCURSAL',
        body: storeName,
        id: 'store_name'
      }
    ],
    loyaltyPoints: {
      label: 'ESTRELLAS',
      balance: {
        string: `${visits} ★`
      }
    }
  };

  if (store?.latitude != null && store?.longitude != null) {
    const lat = Number(store.latitude);
    const lng = Number(store.longitude);
    if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
      loyaltyObject.locations = [
        {
          kind: 'walletobjects#latLongPoint',
          latitude: lat,
          longitude: lng
        }
      ];
    }
  }

  if (store?.promo_banner_image_url) {
    loyaltyObject.heroImage = {
      sourceUri: {
        uri: store.promo_banner_image_url
      },
      contentDescription: {
        defaultValue: {
          language: 'es',
          value: `Banner de ${storeName}`
        }
      }
    };
  }

  const claims = {
    iss: clientEmail,
    aud: 'google',
    origins: ['*'],
    typ: 'savetowallet',
    payload: {
      loyaltyObjects: [loyaltyObject]
    }
  };

  // 5. Proactively sync/update existing object in Google Wallet Cloud (PATCH)
  // This guarantees that if the pass is already installed in the user's phone,
  // Google Wallet servers immediately update the points and tier!
  try {
    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey
      },
      scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
    });
    const client = await auth.getClient();
    await client.request({
      url: `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${encodeURIComponent(objectId)}`,
      method: 'PATCH',
      data: {
        textModulesData: loyaltyObject.textModulesData,
        loyaltyPoints: loyaltyObject.loyaltyPoints,
        heroImage: loyaltyObject.heroImage
      }
    });
  } catch {
    // If not found (404), it's a brand new pass and Google will create it when the user saves it via JWT
  }

  // 6. Sign the JWT using the RS256 algorithm
  const token = jwt.sign(claims, privateKey, { algorithm: 'RS256' });
  return token;
}
