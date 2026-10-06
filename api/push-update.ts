/// <reference types="node" />
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import http2 from 'http2';
import { GoogleAuth } from 'google-auth-library';

// Initialize Supabase Client using Service Role Key
function getSupabaseClient() {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || 'https://fpmpmoltoijhoruxqsdf.supabase.co').replace(/["'\s]/g, '');
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_6IPsbChJ8y--xDWHyoulmA_UCY2LgyG').replace(/["'\s]/g, '');
  return createClient(supabaseUrl, supabaseKey);
}

// JWT Generator for APNs using ES256

function parsePem(val: string | undefined): string {
  if (!val) return '';
  let clean = val.trim().replace(/^["']+|["']+$/g, '');
  clean = clean.replace(/^-n\s+/, '').trim();
  const withNewlines = clean.replace(/\\n/g, '\n');
  if (withNewlines.includes('-----BEGIN')) {
    const match = withNewlines.match(/-----BEGIN (?:EC )?PRIVATE KEY-----([\s\S]+?)-----END (?:EC )?PRIVATE KEY-----/);
    if (match) {
      const b64Data = match[1].replace(/[\s\r\n]/g, '');
      const chunks = b64Data.match(/.{1,64}/g) || [];
      return `-----BEGIN PRIVATE KEY-----\n${chunks.join('\n')}\n-----END PRIVATE KEY-----\n`;
    }
    return withNewlines.trim();
  }
  try {
    const rawB64 = clean.replace(/[\s\r\n"']/g, '').replace(/^-n/, '');
    const decoded = Buffer.from(rawB64, 'base64').toString('utf8').replace(/\\n/g, '\n');
    if (decoded.includes('-----BEGIN')) {
      const match = decoded.match(/-----BEGIN (?:EC )?PRIVATE KEY-----([\s\S]+?)-----END (?:EC )?PRIVATE KEY-----/);
      if (match) {
        const b64Data = match[1].replace(/[\s\r\n]/g, '');
        const chunks = b64Data.match(/.{1,64}/g) || [];
        return `-----BEGIN PRIVATE KEY-----\n${chunks.join('\n')}\n-----END PRIVATE KEY-----\n`;
      }
      return decoded.trim();
    }
  } catch {}
  return withNewlines.trim();
}

function generateApnsJwt(privateKeyPem: string, keyId: string, teamId: string): string {
  const header = { alg: 'ES256', kid: keyId };
  const payload = { iss: teamId, iat: Math.floor(Date.now() / 1000) };

  const base64UrlEncode = (obj: any) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const tokenInput = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}`;

  const signer = crypto.createSign('SHA256');
  signer.update(tokenInput);
  
  // Format EC signature to DER format as Node's sign does, then convert to raw format for JWT (IEEE P1363)
  // Or simply sign using crypto.sign with 'dsaEncoding: "ieee-p1363"' to get the standard JWT signature directly!
  const signature = crypto.sign(
    'SHA256',
    Buffer.from(tokenInput),
    {
      key: privateKeyPem,
      dsaEncoding: 'ieee-p1363'
    }
  ).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${tokenInput}.${signature}`;
}

// Send APNs Push Notification
function sendApnsPush(pushToken: string, passTypeId: string, jwtToken: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Connect to Production APNs server
    const client = http2.connect('https://api.push.apple.com');

    client.on('error', (err) => {
      console.error('APNs Connection Error:', err);
      resolve(false);
    });

    const req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${pushToken}`,
      'apns-topic': passTypeId,
      'apns-push-type': 'background',
      'apns-priority': '5',
      'authorization': `bearer ${jwtToken}`,
      'content-length': 2 // empty JSON payload '{}'
    });

    req.on('response', (headers) => {
      const status = headers[':status'];
      console.log(`APNs Response Status for token ${pushToken.slice(0, 8)}...: ${status}`);
      resolve(status === 200);
      client.close();
    });

    req.on('error', (err) => {
      console.error('APNs Request Error:', err);
      resolve(false);
      client.close();
    });

    req.write('{}');
    req.end();
  });
}

export default async function handler(req: any, res: any) {
  const supabase = getSupabaseClient();
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Parse input from query or body (supports Swift HTTP requests & Supabase Database Webhooks)
  const body = req.body || {};
  const record = body.record || {};
  const oldRecord = body.old_record || {};

  const userId = (req.query?.userId || body.userId || record.profile_id || '').toString().trim();
  const explicitStoreId = (req.query?.storeId || body.storeId || record.store_id || '').toString().trim();
  const rawVisits = req.query?.visits ?? body.visits ?? record.visits;
  const rawOldVisits = req.query?.oldVisits ?? body.oldVisits ?? oldRecord.visits;

  if (!userId) {
    res.status(400).json({ error: 'Falta el parámetro userId (Missing userId parameter)' });
    return;
  }

  try {
    // 1. Resolve stores to update
    let targetStores: Array<{ storeId: string; visits: number; oldVisits: number | null }> = [];

    if (explicitStoreId) {
      let vNew: number = rawVisits !== undefined && rawVisits !== null ? parseInt(rawVisits as string, 10) : 0;
      let vOld = rawOldVisits !== undefined && rawOldVisits !== null ? parseInt(rawOldVisits as string, 10) : null;
      if (rawVisits === undefined || rawVisits === null) {
        const { data: sp } = await supabase
          .from('store_profiles')
          .select('visits')
          .eq('profile_id', userId)
          .eq('store_id', explicitStoreId)
          .maybeSingle();
        vNew = sp?.visits || 0;
      }
      targetStores.push({ storeId: explicitStoreId, visits: vNew, oldVisits: vOld });
    } else {
      // No store specified: load all store_profiles for this user!
      const { data: allStoreProfiles } = await supabase
        .from('store_profiles')
        .select('store_id, visits')
        .eq('profile_id', userId);

      if (allStoreProfiles && allStoreProfiles.length > 0) {
        targetStores = allStoreProfiles.map(sp => ({
          storeId: sp.store_id,
          visits: sp.visits || 0,
          oldVisits: null
        }));
      } else {
        const defaultStoreId = process.env.VITE_STORE_ID || 'c3ad358a-6412-412e-87f9-8c50986b3298';
        targetStores.push({ storeId: defaultStoreId, visits: 0, oldVisits: null });
      }
    }

    let lastStoreName = 'Club de Lealtad';
    let primaryStoreId = targetStores[0]?.storeId || process.env.VITE_STORE_ID || 'c3ad358a-6412-412e-87f9-8c50986b3298';

    // Process each target store (WhatsApp + Google Wallet)
    for (const item of targetStores) {
      const { storeId: curStoreId, visits: vNew, oldVisits: vOld } = item;

      const { data: store } = await supabase
        .from('stores')
        .select('id, name, promo_banner_image_url')
        .eq('id', curStoreId)
        .maybeSingle();

      const storeName = store?.name || 'Club de Lealtad';
      lastStoreName = storeName;

      // A. Send WhatsApp notification if visits count increased (new star added!)
      if (vNew !== null && vOld !== null && vNew > vOld) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', userId)
          .single();

        if (!profileError && profile && profile.phone) {
          let cleanedPhone = profile.phone.replace(/\D/g, '');
          if (cleanedPhone.length === 10) {
            cleanedPhone = '521' + cleanedPhone;
          } else if (cleanedPhone.length === 12 && cleanedPhone.startsWith('52')) {
            cleanedPhone = '521' + cleanedPhone.slice(2);
          }

          const messageText = `¡Hola ${profile.full_name || 'Cliente'}! 🌟 Has acumulado una nueva estrella en tu tarjeta de cliente ${storeName}. Ahora tienes un total de *${vNew} visitas* acumuladas. ¡Muchas gracias por tu visita! ✨`;

          try {
            const waResponse = await fetch('https://wasendar-light-backend.onrender.com/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to: cleanedPhone, message: messageText })
            });
            const waData = await waResponse.json();
            console.log(`WhatsApp sent to ${cleanedPhone}:`, waData);
          } catch (e: any) {
            console.error('Failed to send WhatsApp message via bridge:', e.message);
          }
        }
      }

      // B. Fetch Store Credentials (with fallback to env vars)
      const { data: dbWalletCreds } = await supabase
        .from('store_wallet_credentials')
        .select('*')
        .eq('store_id', curStoreId)
        .maybeSingle();

      // C. Update Google Wallet Object Points
      if (vNew !== null) {
        try {
          const issuerId = (dbWalletCreds?.google_issuer_id || process.env.GOOGLE_WALLET_ISSUER_ID || '').trim();
          const clientEmail = (dbWalletCreds?.google_client_email || process.env.GOOGLE_WALLET_CLIENT_EMAIL || '').trim();
          let rawPrivateKey = (dbWalletCreds?.google_private_key || process.env.GOOGLE_WALLET_PRIVATE_KEY || '').trim();
          rawPrivateKey = rawPrivateKey.replace(/\\n/g, '\n').replace(/^["']+|["']+$/g, '');

          if (issuerId && clientEmail && rawPrivateKey) {
            let privateKey = '';
            const match = rawPrivateKey.match(/-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----/);
            if (match) {
              const base64Data = match[1].replace(/[\s\r\n]/g, '');
              const chunks = base64Data.match(/.{1,64}/g) || [];
              privateKey = `-----BEGIN PRIVATE KEY-----\n${chunks.join('\n')}\n-----END PRIVATE KEY-----\n`;
            }

            if (privateKey) {
              const auth = new GoogleAuth({
                credentials: {
                  client_email: clientEmail,
                  private_key: privateKey
                },
                scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
              });

              const client = await auth.getClient();
              const objectId = `${issuerId}.${userId.replace(/-/g, '')}_${curStoreId.replace(/-/g, '').substring(0, 8)}`;

              const { data: userProf } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', userId)
                .maybeSingle();

              const patchPayload: any = {
                accountName: userProf?.full_name || 'Socio Club',
                textModulesData: [
                  {
                    header: 'TITULAR',
                    body: userProf?.full_name || 'Socio Club',
                    id: 'member_name'
                  },
                  {
                    header: 'MEMBRESÍA',
                    body: vNew >= 10 ? '★ SOCIO VIP ★' : 'SOCIO CLUB',
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
                    string: `${vNew} ★`
                  }
                }
              };

              if (store?.promo_banner_image_url) {
                patchPayload.heroImage = {
                  sourceUri: {
                    uri: store.promo_banner_image_url
                  }
                };
              }

              await client.request({
                url: `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${objectId}`,
                method: 'PATCH',
                data: patchPayload,
              });
              console.log('Google Wallet updated for', objectId, 'with stars:', vNew);
            }
          }
        } catch (e: any) {
          console.error('Error updating Google Wallet object:', e.message);
        }
      }
    }

    // D. Fetch registered devices for Apple Wallet push
    const { data: devices, error: dbError } = await supabase
      .from('wallet_registrations')
      .select('push_token')
      .eq('profile_id', userId);

    if (dbError) {
      console.error('Error fetching registrations:', dbError);
      res.status(500).json({ error: 'Error al consultar dispositivos registrados.' });
      return;
    }

    if (!devices || devices.length === 0) {
      res.status(200).json({ message: 'No hay dispositivos registrados para este usuario.', pushSentCount: 0 });
      return;
    }

    // 3. Load APNs credentials for primary store
    const { data: primaryStoreCreds } = await supabase
      .from('store_wallet_credentials')
      .select('*')
      .eq('store_id', primaryStoreId)
      .maybeSingle();

    const apnsKeyBase64 = primaryStoreCreds?.apple_apns_key || process.env.APPLE_APNS_KEY;
    const apnsKeyId = primaryStoreCreds?.apple_apns_key_id || process.env.APPLE_APNS_KEY_ID || 'R62F889JA4';
    const teamId = primaryStoreCreds?.apple_team_identifier || process.env.APPLE_TEAM_IDENTIFIER || 'DSVRALKN65';
    const passTypeId = primaryStoreCreds?.apple_pass_type_identifier || process.env.APPLE_PASS_TYPE_IDENTIFIER || 'pass.com.postreland.loyalty';

    if (!apnsKeyBase64) {
      res.status(500).json({ error: 'Credenciales APNs (APPLE_APNS_KEY) no configuradas en las variables de entorno ni en la base de datos.' });
      return;
    }

    // Decode Private Key Pem safely
    const privateKeyPem = parsePem(apnsKeyBase64);

    // 4. Generate JWT Token
    const jwtToken = generateApnsJwt(privateKeyPem, apnsKeyId, teamId);

    // 5. Send pushes to all registered devices in parallel
    const pushPromises = devices.map(d => sendApnsPush(d.push_token, passTypeId, jwtToken));
    const results = await Promise.all(pushPromises);

    const successCount = results.filter(Boolean).length;

    console.log(`Pushes sent to ${devices.length} devices (Success: ${successCount}) for user ${userId}`);

    res.status(200).json({
      message: `Pushes enviados correctamente a Apple Wallet.`,
      store: lastStoreName,
      devicesFound: devices.length,
      pushSentCount: successCount
    });

  } catch (error: any) {
    console.error('Error in push-update handler:', error);
    res.status(500).json({ error: 'Error interno al enviar push-update: ' + error.message });
  }
}
