import { generateGooglePassJWT } from './_googlePassHelper.js';
export default async function handler(req, res) {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const clientEmail = process.env.GOOGLE_WALLET_CLIENT_EMAIL;
  
  try {
    const token = await generateGooglePassJWT('c6367072-fa44-480d-a5ce-37fe4b1c3fbf');
    res.status(200).json({ success: true, tokenPrefix: token.substring(0, 10) });
  } catch(e) {
    res.status(500).json({ 
      error: e.message,
      issuerId: !!issuerId,
      clientEmail: !!clientEmail,
    });
  }
}
