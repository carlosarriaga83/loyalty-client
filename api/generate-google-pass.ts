import { generateGooglePassJWT } from './_googlePassHelper.js';

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


    const jwtToken = await generateGooglePassJWT(userId as string, (storeId as string) || undefined);

    if (!jwtToken) {
      res.status(404).json({ error: 'Usuario no encontrado (User not found) o error generando JWT' });
      return;
    }

    // Google Wallet Save URL
    const saveUrl = `https://pay.google.com/gp/v/save/${jwtToken}`;

    // Redirect the user to the Google Wallet save link
    res.redirect(302, saveUrl);

  } catch (error: any) {
    console.error('Error generating Google pass:', error);
    res.status(500).json({ error: 'Error interno al generar el pase: ' + error.message });
  }
}
