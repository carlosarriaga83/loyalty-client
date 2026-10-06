/// <reference types="node" />
import { PKPass } from 'passkit-generator';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Define __dirname equivalent for ES modules if needed
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic Supabase Client Initialization with sanitization
function getSupabaseClient() {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || 'https://fpmpmoltoijhoruxqsdf.supabase.co').replace(/["'\s]/g, '');
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_6IPsbChJ8y--xDWHyoulmA_UCY2LgyG').replace(/["'\s]/g, '');
  return createClient(supabaseUrl, supabaseKey);
}

// Helper to convert hex to rgb string format "rgb(r, g, b)"
function hexToRgb(hex: string | null | undefined, defaultRgb: string): string {
  if (!hex) return defaultRgb;
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return `rgb(${r}, ${g}, ${b})`;
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgb(${r}, ${g}, ${b})`;
  }
  return defaultRgb;
}

export async function generatePassBuffer(userId: string, host: string, targetStoreId?: string): Promise<Buffer | null> {
  const supabase = getSupabaseClient();

  // 1. Fetch user profile from Supabase to get name
  const { data: profile, error: dbError } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone')
    .eq('id', userId)
    .single();

  if (dbError || !profile) {
    console.error('Error fetching profile for pass helper:', dbError);
    return null;
  }

  // 2. Resolve store and fetch visits from store_profiles
  const { data: allStores } = await supabase
    .from('stores')
    .select('id, name, logo_url, address, phone, primary_color, secondary_color, promo_banner_image_url, latitude, longitude, broadcast_message');

  const inputId = targetStoreId || process.env.VITE_STORE_ID || 'c3ad358a-6412-412e-87f9-8c50986b3298';
  const matchedStore = (allStores || []).find((s: any) => s.id === inputId || s.id.startsWith(inputId) || s.id.replace(/-/g, '').startsWith(inputId));

  const store = matchedStore || (allStores || [])[0];
  const storeId = store?.id || inputId;
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

  // 3. Fetch Apple Wallet Credentials from Supabase (store_wallet_credentials) with fallback to env vars
  const { data: dbWalletCreds } = await supabase
    .from('store_wallet_credentials')
    .select('*')
    .eq('store_id', storeId)
    .maybeSingle();

  const wwdrBase64 = dbWalletCreds?.apple_wwdr_cert || process.env.APPLE_WWDR_CERT;
  const signerCertBase64 = dbWalletCreds?.apple_signer_cert || process.env.APPLE_SIGNER_CERT;
  const signerKeyBase64 = dbWalletCreds?.apple_signer_key || process.env.APPLE_SIGNER_KEY;
  const teamIdentifier = dbWalletCreds?.apple_team_identifier || process.env.APPLE_TEAM_IDENTIFIER || 'DSVRALKN65';
  const passTypeIdentifier = dbWalletCreds?.apple_pass_type_identifier || process.env.APPLE_PASS_TYPE_IDENTIFIER || 'pass.com.postreland.loyalty';
  const signerPassphrase = dbWalletCreds?.apple_signer_passphrase || process.env.APPLE_SIGNER_PASSPHRASE;

  if (!wwdrBase64 || !signerCertBase64 || !signerKeyBase64) {
    throw new Error('Certificados de Apple Wallet no configurados en las variables de entorno ni en la base de datos.');
  }

  function parsePem(val: string | undefined): string {
    if (!val) return '';
    let clean = val.trim().replace(/^["']+|["']+$/g, '');
    // Strip leading -n from echo -n if captured literally
    clean = clean.replace(/^-n\s+/, '').trim();
    const withNewlines = clean.replace(/\\n/g, '\n');
    if (withNewlines.includes('-----BEGIN')) {
      return withNewlines.trim();
    }
    try {
      const rawB64 = clean.replace(/[\s\r\n"']/g, '').replace(/^-n/, '');
      const decoded = Buffer.from(rawB64, 'base64').toString('utf8').replace(/\\n/g, '\n');
      if (decoded.includes('-----BEGIN')) {
        return decoded.trim();
      }
    } catch {}
    return withNewlines.trim();
  }

  // Decode certificates (handles both base64 and raw PEM with escaped newlines)
  const wwdr = parsePem(wwdrBase64);
  const signerCert = parsePem(signerCertBase64);
  const signerKey = parsePem(signerKeyBase64);

  const certs: any = {
    wwdr,
    signerCert,
    signerKey
  };

  if (signerPassphrase) {
    certs.signerKeyPassphrase = signerPassphrase;
  }

  // Helper to read assets from possible deployment paths
  const readAsset = (filename: string): Buffer => {
    const possiblePaths = [
      path.join(process.cwd(), 'client-app/api/assets', filename),
      path.join(process.cwd(), 'api/assets', filename),
      path.join(__dirname, 'assets', filename),
      path.join(__dirname, '../assets', filename)
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        try {
          return fs.readFileSync(p);
        } catch (e) {
          console.warn(`Error reading asset from ${p}:`, e);
        }
      }
    }
    
    // Fallback transparent 1x1 png if local assets missing
    return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  };

  // 4. Resolve Branding Colors & Text
  const backgroundColor = hexToRgb(store?.secondary_color, 'rgb(255, 255, 255)');
  
  // Check if background is light/white to ensure readable text contrast
  const isLightBg = (() => {
    const match = backgroundColor.match(/\d+/g);
    if (!match || match.length < 3) return false;
    const [r, g, b] = match.map(Number);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 160;
  })();

  const labelColor = isLightBg 
    ? hexToRgb(store?.primary_color, 'rgb(54, 159, 161)') 
    : hexToRgb(store?.primary_color, 'rgb(209, 161, 83)');
  const foregroundColor = isLightBg ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';

  const basePassJson = {
    formatVersion: 1,
    passTypeIdentifier: passTypeIdentifier,
    teamIdentifier: teamIdentifier,
    organizationName: storeName,
    description: `Tarjeta de Lealtad - ${storeName}`,
    foregroundColor: foregroundColor,
    backgroundColor: backgroundColor,
    labelColor: labelColor,
    sharingProhibited: true,
    webServiceURL: `https://${host}/api`,
    authenticationToken: 'postreland_secure_token',
    storeCard: {
      headerFields: [
        {
          key: 'stars',
          label: 'ESTRELLAS',
          value: `${visits} ★`,
          alignment: 'PKTextAlignmentRight',
          changeMessage: '¡Has acumulado nuevas estrellas! Total: %@'
        }
      ],
      primaryFields: [],
      secondaryFields: [
        {
          key: 'member_name',
          label: 'TITULAR',
          value: profile.full_name || 'Socio Club'
        },
        {
          key: 'tier',
          label: 'MEMBRESÍA',
          value: visits >= 10 ? '★ SOCIO VIP ★' : 'SOCIO CLUB',
          changeMessage: '¡Tu membresía ha cambiado a %@!'
        },
        {
          key: 'store',
          label: 'SUCURSAL',
          value: storeName
        }
      ],
      backFields: [
        {
          key: 'program_info',
          label: 'Programa de Lealtad',
          value: `Bienvenido al Club de Lealtad de ${storeName}. Presenta tu código QR en cada visita para acumular estrellas y canjear recompensas exclusivas.`
        },
        {
          key: 'rewards_policy',
          label: 'Cómo Funciona',
          value: '1. Acumula estrellas en cada consumo.\n2. Desbloquea recompensas exclusivas.\n3. Canjea tus cupones directo en caja.'
        }
      ] as Array<{ key: string; label: string; value: string; changeMessage?: string }>
    }
  };

  if (store?.broadcast_message) {
    basePassJson.storeCard.backFields.unshift({
      key: 'broadcast_msg',
      label: 'Último Aviso / Promoción',
      value: store.broadcast_message,
      changeMessage: '%@'
    });
  }

  if (store?.address) {
    basePassJson.storeCard.backFields.push({
      key: 'location',
      label: 'Ubicación',
      value: store.address
    });
  }

  if (store?.phone) {
    basePassJson.storeCard.backFields.push({
      key: 'phone',
      label: 'Contacto',
      value: store.phone
    });
  }

  // Geofencing: Notificación en pantalla de bloqueo al estar a 50m del negocio
  if (store?.latitude != null && store?.longitude != null) {
    const lat = Number(store.latitude);
    const lng = Number(store.longitude);
    if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
      (basePassJson as any).locations = [
        {
          latitude: lat,
          longitude: lng,
          relevantText: `¡Estás cerca de ${storeName}! Presenta tu tarjeta para acumular estrellas.`,
          maxDistance: 50
        }
      ];
    }
  }

  const buffers: Record<string, Buffer> = {
    'pass.json': Buffer.from(JSON.stringify(basePassJson))
  };

  // Base generic icon
  buffers['icon.png'] = readAsset('icon.png');
  buffers['icon@2x.png'] = readAsset('icon@2x.png');
  buffers['icon@3x.png'] = readAsset('icon@3x.png');
  buffers['logo.png'] = readAsset('logo.png');
  buffers['logo@2x.png'] = readAsset('logo@2x.png');
  buffers['logo@3x.png'] = readAsset('logo@3x.png');

  // Dynamic Store Logo Download & Injection
  if (store?.logo_url) {
    try {
      const resp = await fetch(store.logo_url);
      if (resp.ok) {
        const arrayBuf = await resp.arrayBuffer();
        const logoBuf = Buffer.from(arrayBuf);
        buffers['logo.png'] = logoBuf;
        buffers['logo@2x.png'] = logoBuf;
        buffers['logo@3x.png'] = logoBuf;
        buffers['icon.png'] = logoBuf;
        buffers['icon@2x.png'] = logoBuf;
        buffers['icon@3x.png'] = logoBuf;
      }
    } catch (e) {
      console.error('Error cargando logo de tienda para Apple pass:', e);
    }
  }

  // Only inject strip.png if store has a dedicated banner
  if (store?.promo_banner_image_url) {
    try {
      const bannerResp = await fetch(store.promo_banner_image_url);
      if (bannerResp.ok) {
        const arrayBuf = await bannerResp.arrayBuffer();
        const bannerBuf = Buffer.from(arrayBuf);
        buffers['strip.png'] = bannerBuf;
        buffers['strip@2x.png'] = bannerBuf;
        buffers['strip@3x.png'] = bannerBuf;
      }
    } catch (e) {
      console.error('Error cargando banner strip para Apple pass:', e);
    }
  }

  // 5. Initialize PKPass with per-user and per-store serial number
  const pass = new PKPass(buffers, certs, {
    serialNumber: `client_${profile.id}_${storeId.substring(0, 8)}`
  });

  // Set barcodes
  pass.setBarcodes({
    format: 'PKBarcodeFormatQR',
    message: profile.id,
    messageEncoding: 'iso-8859-1'
  });

  return await pass.getAsBuffer();
}
