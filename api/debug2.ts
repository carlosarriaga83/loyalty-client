export default function handler(req, res) {
  const rawPrivateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY || '';
  let privateKey = '';
  const match = rawPrivateKey.match(/-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----/);
  if (match) {
    const base64Data = match[1].replace(/\s+/g, '');
    const chunks = base64Data.match(/.{1,64}/g) || [];
    privateKey = "-----BEGIN PRIVATE KEY-----\n" + chunks.join('\n') + "\n-----END PRIVATE KEY-----\n";
  }
  
  res.status(200).json({
    rawLength: rawPrivateKey.length,
    matchFound: !!match,
    privateKeyLength: privateKey.length,
    base64DataLength: match ? match[1].replace(/\s+/g, '').length : 0
  });
}
