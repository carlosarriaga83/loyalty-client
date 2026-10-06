export default function handler(req, res) {
  let raw = process.env.GOOGLE_WALLET_PRIVATE_KEY || '';
  let cleaned = raw;
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  cleaned = cleaned.replace(/\\n/g, '\n');
  
  res.status(200).json({
    rawLength: raw.length,
    cleanedLength: cleaned.length,
    startsWith: cleaned.substring(0, 30),
    endsWith: cleaned.substring(cleaned.length - 30),
    hasRealNewlines: cleaned.includes('\n'),
    hasLiteralSlashN: cleaned.includes('\\n')
  });
}
