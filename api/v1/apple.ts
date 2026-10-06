/// <reference types="node" />
import { createClient } from '@supabase/supabase-js';
import { generatePassBuffer } from '../_passHelper.js';

// Initialize Supabase Client using Service Role Key
function getSupabaseClient() {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || 'https://fpmpmoltoijhoruxqsdf.supabase.co').replace(/["'\s]/g, '');
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_6IPsbChJ8y--xDWHyoulmA_UCY2LgyG').replace(/["'\s]/g, '');
  return createClient(supabaseUrl, supabaseKey);
}

export default async function handler(req: any, res: any) {
  const supabase = getSupabaseClient();

  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Parse path segments from req.url
  const urlObj = new URL(req.url || '', `https://${req.headers.host || 'postreland-client.vercel.app'}`);
  const segments = urlObj.pathname.split('/').filter(Boolean);
  // Expected path format: /api/v1/devices/... or /api/v1/passes/...
  // We slice off the first two segments ('api', 'v1') to get the apple-specific parameters
  const apple = segments.slice(2);

  if (apple.length === 0) {
    res.status(404).json({ error: 'Endpoint no encontrado (Endpoint not found)' });
    return;
  }

  const segment0 = apple[0]; // 'devices' or 'passes'

  try {
    // ----------------------------------------------------
    // CASE 1: Passes Endpoint (/api/v1/passes/:passTypeId/:serialNumber)
    // ----------------------------------------------------
    if (segment0 === 'passes') {
      if (req.method !== 'GET') {
        res.status(405).json({ error: 'Método no permitido (Method not allowed)' });
        return;
      }

      const passTypeId = apple[1];
      const serialNumber = apple[2]; // format: client_<profile_id>_<store_prefix>

      if (!passTypeId || !serialNumber) {
        res.status(400).json({ error: 'Parámetros incompletos (Incomplete parameters)' });
        return;
      }

      // Verify Authorization Header (ApplePass <authenticationToken>)
      const authHeader = req.headers.authorization || '';
      if (!authHeader.startsWith('ApplePass ') || authHeader.split(' ')[1] !== 'postreland_secure_token') {
        res.status(401).json({ error: 'No autorizado (Unauthorized)' });
        return;
      }

      // Parse profileId and storePrefix from serialNumber (client_<profileId>_<storePrefix>)
      const raw = serialNumber.replace('client_', '');
      const parts = raw.split('_');
      const profileId = parts[0];
      const storePrefix = parts.length > 1 ? parts[1] : undefined;

      // Generate the fresh .pkpass buffer
      const host = req.headers.host || 'postreland-client.vercel.app';
      const passBuffer = await generatePassBuffer(profileId, host, storePrefix);

      if (!passBuffer) {
        res.status(404).json({ error: 'Pase no encontrado (Pass not found)' });
        return;
      }

      res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
      res.setHeader('Content-Disposition', `attachment; filename="postreland_card.pkpass"`);
      res.status(200).send(passBuffer);
      return;
    }

    // ----------------------------------------------------
    // CASE 2: Devices Endpoints (/api/v1/devices/:deviceId/registrations/...)
    // ----------------------------------------------------
    if (segment0 === 'devices') {
      const deviceId = apple[1];
      const registrationsSegment = apple[2]; // 'registrations'

      if (registrationsSegment !== 'registrations') {
        res.status(404).json({ error: 'Ruta no encontrada (Route not found)' });
        return;
      }

      const passTypeId = apple[3];
      const serialNumber = apple[4]; // Optional depending on GET vs. POST/DELETE

      // 2a. GET Serial Numbers: GET /api/v1/devices/:deviceId/registrations/:passTypeId
      if (req.method === 'GET') {
        if (!deviceId || !passTypeId) {
          res.status(400).json({ error: 'Faltan parámetros (Missing parameters)' });
          return;
        }

        // Fetch serial numbers registered to this device
        const { data: regs, error: fetchErr } = await supabase
          .from('wallet_registrations')
          .select('serial_number')
          .eq('device_id', deviceId);

        if (fetchErr) throw fetchErr;

        if (!regs || regs.length === 0) {
          res.status(204).end(); // No Content
          return;
        }

        res.status(200).json({
          serialNumbers: regs.map(r => r.serial_number),
          lastUpdated: new Date().toISOString()
        });
        return;
      }

      // 2b. Register/Unregister: POST/DELETE /api/v1/devices/:deviceId/registrations/:passTypeId/:serialNumber
      if (req.method === 'POST' || req.method === 'DELETE') {
        if (!deviceId || !passTypeId || !serialNumber) {
          res.status(400).json({ error: 'Faltan parámetros (Missing parameters)' });
          return;
        }

        // Verify Authorization Header
        const authHeader = req.headers.authorization || '';
        if (!authHeader.startsWith('ApplePass ') || authHeader.split(' ')[1] !== 'postreland_secure_token') {
          res.status(401).json({ error: 'No autorizado (Unauthorized)' });
          return;
        }

        // Parse profileId from serialNumber (client_<profileId>_<storePrefix>)
        const raw = serialNumber.replace('client_', '');
        const profileId = raw.includes('_') ? raw.split('_')[0] : raw;

        if (req.method === 'POST') {
          const { pushToken } = req.body || {};
          if (!pushToken) {
            res.status(400).json({ error: 'Falta pushToken (Missing pushToken)' });
            return;
          }

          // Insert or update registration in Supabase
          const { error: upsertErr } = await supabase
            .from('wallet_registrations')
            .upsert(
              {
                device_id: deviceId,
                push_token: pushToken,
                serial_number: serialNumber,
                profile_id: profileId
              },
              { onConflict: 'device_id,serial_number' }
            );

          if (upsertErr) throw upsertErr;

          console.log(`Registered device ${deviceId} for user ${profileId}`);
          res.status(201).end(); // Created
          return;
        }

        if (req.method === 'DELETE') {
          // Remove registration from Supabase
          const { error: deleteErr } = await supabase
            .from('wallet_registrations')
            .delete()
            .eq('device_id', deviceId)
            .eq('serial_number', serialNumber);

          if (deleteErr) throw deleteErr;

          console.log(`Unregistered device ${deviceId} for serial ${serialNumber}`);
          res.status(200).end(); // Success
          return;
        }
      }

      res.status(405).json({ error: 'Método no permitido (Method not allowed)' });
      return;
    }

    res.status(404).json({ error: 'Endpoint no encontrado (Endpoint not found)' });

  } catch (error: any) {
    console.error('Error in Apple Wallet API handler:', error);
    res.status(500).json({ error: 'Error interno en la API de Wallet: ' + error.message });
  }
}
