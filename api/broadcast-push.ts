/// <reference types="node" />
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import http2 from 'http2';

// Initialize Supabase Client using Service Role Key
function getSupabaseClient() {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || 'https://fpmpmoltoijhoruxqsdf.supabase.co').replace(/["'\s]/g, '');
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_6IPsbChJ8y--xDWHyoulmA_UCY2LgyG').replace(/["'\s]/g, '');
  return createClient(supabaseUrl, supabaseKey);
}

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
      'content-length': 2
    });

    req.on('response', (headers) => {
      const status = headers[':status'];
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

  const body = req.body || {};
  const storeId = (req.query?.storeId || body.storeId || process.env.VITE_STORE_ID || 'c3ad358a-6412-412e-87f9-8c50986b3298').toString().trim();
  const message = (req.query?.message || body.message || '').toString().trim();
  const title = (req.query?.title || body.title || 'Aviso de la Tienda').toString().trim();

  if (!message) {
    res.status(400).json({ error: 'Falta el parámetro message (Missing message parameter)' });
    return;
  }

  try {
    // 1. Fetch Store Details
    const { data: store, error: storeErr } = await supabase
      .from('stores')
      .select('id, name')
      .eq('id', storeId)
      .maybeSingle();

    if (storeErr || !store) {
      res.status(404).json({ error: 'Tienda no encontrada (Store not found)' });
      return;
    }

    const storeName = store.name || 'Club de Lealtad';

    // 2. Update store's current broadcast message in database
    await supabase
      .from('stores')
      .update({ broadcast_message: message })
      .eq('id', storeId);

    // 3. Fetch all wallet registrations for this store
    // Match either by serial_number suffix with storeId prefix or registrations of profiles belonging to this store
    const storePrefix = storeId.replace(/-/g, '').substring(0, 8);
    const { data: allRegistrations, error: regErr } = await supabase
      .from('wallet_registrations')
      .select('id, push_token, serial_number, profile_id');

    if (regErr) {
      console.error('Error fetching registrations:', regErr);
      res.status(500).json({ error: 'Error consultando registros de wallet.' });
      return;
    }

    // Filter matching registrations for this store
    const targetRegistrations = (allRegistrations || []).filter((reg: any) => {
      if (!reg.serial_number) return true;
      return reg.serial_number.includes(storePrefix) || !reg.serial_number.includes('_');
    });

    // 4. Fetch Store Apple Credentials
    const { data: dbWalletCreds } = await supabase
      .from('store_wallet_credentials')
      .select('*')
      .eq('store_id', storeId)
      .maybeSingle();

    const apnsKeyBase64 = dbWalletCreds?.apple_apns_key || process.env.APPLE_APNS_KEY;
    const apnsKeyId = dbWalletCreds?.apple_apns_key_id || process.env.APPLE_APNS_KEY_ID || 'R62F889JA4';
    const teamId = dbWalletCreds?.apple_team_identifier || process.env.APPLE_TEAM_IDENTIFIER || 'DSVRALKN65';
    const passTypeId = dbWalletCreds?.apple_pass_type_identifier || process.env.APPLE_PASS_TYPE_IDENTIFIER || 'pass.com.postreland.loyalty';

    let successCount = 0;

    if (apnsKeyBase64 && targetRegistrations.length > 0) {
      const privateKeyPem = parsePem(apnsKeyBase64);
      const jwtToken = generateApnsJwt(privateKeyPem, apnsKeyId, teamId);

      // Deduplicate push tokens
      const uniqueTokens = Array.from(new Set(targetRegistrations.map((r: any) => r.push_token).filter(Boolean)));

      const pushPromises = uniqueTokens.map((token: string) => sendApnsPush(token, passTypeId, jwtToken));
      const results = await Promise.all(pushPromises);
      successCount = results.filter(Boolean).length;
    }

    // 5. Record broadcast in history table
    const { data: broadcastRecord } = await supabase
      .from('wallet_broadcasts')
      .insert({
        store_id: storeId,
        title: title || `Aviso de ${storeName}`,
        message: message,
        recipients_count: targetRegistrations.length,
        success_count: successCount
      })
      .select()
      .maybeSingle();

    res.status(200).json({
      success: true,
      message: `Notificación enviada a ${successCount} dispositivos de Apple Wallet.`,
      store: storeName,
      recipientsCount: targetRegistrations.length,
      successCount: successCount,
      broadcastId: broadcastRecord?.id
    });

  } catch (error: any) {
    console.error('Error in broadcast-push handler:', error);
    res.status(500).json({ error: 'Error interno al enviar broadcast push: ' + error.message });
  }
}
