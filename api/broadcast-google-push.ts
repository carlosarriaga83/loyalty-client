/// <reference types="node" />
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const DEFAULT_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uaHd0d3Nib2J3amt5bWl1b3JhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI0MjIyMCwiZXhwIjoyMDk4ODE4MjIwfQ.Dpry3R6FBcP0637VQBp_qOxbzjyc6xKsvqt-88SaAp0';

function getSupabaseClient() {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://fpmpmoltoijhoruxqsdf.supabase.co').replace(/["'\s]/g, '');
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SERVICE_ROLE_KEY).replace(/["'\s]/g, '');
  return createClient(supabaseUrl, supabaseKey);
}

function generateGoogleOAuthJwt(clientEmail: string, privateKeyPem: string): string {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/wallet_object.issuer'
  };

  const base64Url = (obj: any) =>
    Buffer.from(typeof obj === 'string' ? obj : JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const tokenInput = `${base64Url(header)}.${base64Url(payload)}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(tokenInput);
  const signature = sign.sign(privateKeyPem, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${tokenInput}.${signature}`;
}

async function getGoogleAccessToken(clientEmail: string, privateKeyPem: string): Promise<string> {
  const jwtAssertion = generateGoogleOAuthJwt(clientEmail, privateKeyPem);
  const postData = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwtAssertion
  }).toString();

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: postData
  });

  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) {
    throw new Error(`Error obteniendo token de Google: ${JSON.stringify(tokenJson)}`);
  }

  return tokenJson.access_token;
}

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  const supabase = getSupabaseClient();

  try {
    const { storeId, title, message } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'El parámetro "message" es obligatorio.' });
    }

    const effectiveStoreId = storeId || '6b77a1f0-38e2-49b9-9d86-7b39c6570a04';

    // 1. Fetch store info
    const { data: store, error: storeErr } = await supabase
      .from('stores')
      .select('id, name')
      .eq('id', effectiveStoreId)
      .maybeSingle();

    if (storeErr || !store) {
      return res.status(404).json({ error: 'Tienda no encontrada.' });
    }

    const storeName = store.name || 'Lorenza Tulum';
    const finalTitle = title?.trim() || storeName;

    // 2. Fetch Google Wallet credentials
    const { data: creds, error: credsErr } = await supabase
      .from('store_wallet_credentials')
      .select('*')
      .eq('store_id', effectiveStoreId)
      .maybeSingle();

    if (credsErr || !creds || !creds.google_issuer_id || !creds.google_client_email || !creds.google_private_key) {
      return res.status(400).json({
        error: 'Credenciales de Google Wallet no encontradas o incompletas para esta tienda.'
      });
    }

    const issuerId = creds.google_issuer_id.trim();
    const clientEmail = creds.google_client_email.trim();
    let rawPrivateKey = creds.google_private_key.trim();
    const privateKeyPem = rawPrivateKey.replace(/^["'\s]+|["'\s]+$/g, '').split(/\\\\n|\\n/).join('\n').trim();

    // 3. Authenticate with Google
    const accessToken = await getGoogleAccessToken(clientEmail, privateKeyPem);

    // 4. Resolve classId
    const sanitizedStoreName = storeName.replace(/[^a-zA-Z0-9]/g, '') || 'General';
    const classId = `${issuerId}.LoyaltyClass_${sanitizedStoreName}`;

    // 5. Broadcast message to Google Wallet Class
    const nowIso = new Date().toISOString();
    const msgPayload = {
      message: {
        header: finalTitle,
        body: message.trim(),
        displayInterval: {
          start: { date: nowIso }
        }
      }
    };

    const googleApiUrl = `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass/${encodeURIComponent(classId)}/addMessage`;
    const googleRes = await fetch(googleApiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(msgPayload)
    });

    const googleJson = await googleRes.json();

    if (!googleRes.ok) {
      console.error('Google Wallet API Error:', googleJson);
      return res.status(googleRes.status).json({
        error: googleJson?.error?.message || 'Error al comunicarse con Google Wallet API',
        details: googleJson
      });
    }

    // 6. Update broadcast_message on store table
    await supabase
      .from('stores')
      .update({
        broadcast_message: message.trim(),
        updated_at: nowIso
      })
      .eq('id', effectiveStoreId);

    // 7. Log broadcast in wallet_broadcasts
    const { data: bcastRecord } = await supabase
      .from('wallet_broadcasts')
      .insert({
        store_id: effectiveStoreId,
        title: `🤖 Google: ${finalTitle}`,
        message: message.trim(),
        recipients_count: 1,
        success_count: 1
      })
      .select()
      .maybeSingle();

    return res.status(200).json({
      success: true,
      platform: 'google_wallet',
      message: `Notificación transmitida exitosamente a Google Wallet (${storeName}).`,
      classId,
      broadcastId: bcastRecord?.id,
      googleResponse: googleJson
    });
  } catch (err: any) {
    console.error('Unexpected Google Push Broadcast error:', err);
    return res.status(500).json({
      error: err.message || 'Error interno al procesar el push de Google Wallet.'
    });
  }
}
