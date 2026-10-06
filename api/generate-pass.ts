/// <reference types="node" />
import { generatePassBuffer } from './_passHelper.js';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { userId, storeId } = req.query;

  if (!userId) {
    res.status(400).json({ error: 'Falta el parámetro userId (Missing userId parameter)' });
    return;
  }

  try {
    const host = req.headers.host || 'postreland-client.vercel.app';
    const passBuffer = await generatePassBuffer(userId as string, host, (storeId as string) || undefined);

    if (!passBuffer) {
      res.status(404).json({ error: 'Usuario no encontrado (User not found)' });
      return;
    }

    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Content-Disposition', `attachment; filename="loyalty_card.pkpass"`);
    res.status(200).send(passBuffer);

  } catch (error: any) {
    console.error('Error generating pass:', error);
    res.status(500).json({ error: 'Error interno al generar el pase: ' + error.message, stack: error.stack });
  }
}
