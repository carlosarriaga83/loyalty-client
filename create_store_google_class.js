import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargamos el service account desde la raíz del proyecto
const keyPath = path.resolve(__dirname, '../postreland-6419293cfcce.json');
const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

const auth = new GoogleAuth({
  credentials: {
    client_email: keyData.client_email,
    private_key: keyData.private_key
  },
  scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
});

const ISSUER_ID = '3388000000023180998';

export async function registerGoogleClassForStore(storeName, logoUrl, backgroundColor = '#FFFFFF', bannerUrl = null) {
  const client = await auth.getClient();
  const sanitizedName = storeName.replace(/[^a-zA-Z0-9]/g, '') || 'Store';
  const classId = `${ISSUER_ID}.LoyaltyClass_${sanitizedName}`;

  const classResource = {
    id: classId,
    issuerName: storeName,
    reviewStatus: 'UNDER_REVIEW',
    programName: '\u200B',
    programLogo: {
      sourceUri: {
        uri: logoUrl || 'https://fpmpmoltoijhoruxqsdf.supabase.co/storage/v1/object/public/product-images/stores/logo_1786810951161.png'
      }
    },
    wideProgramLogo: {
      sourceUri: {
        uri: logoUrl || 'https://fpmpmoltoijhoruxqsdf.supabase.co/storage/v1/object/public/product-images/stores/logo_1786810951161.png'
      }
    },
    hexBackgroundColor: backgroundColor || '#FFFFFF',
    textModulesData: [
      {
        header: 'Beneficios de Lealtad',
        body: `Acumula visitas en ${storeName} escaneando tu código QR. Disfruta de beneficios exclusivos y recompensas.`
      }
    ]
  };

  if (bannerUrl) {
    classResource.heroImage = {
      sourceUri: {
        uri: bannerUrl
      }
    };
  }

  try {
    console.log(`Actualizando / Creando Clase en Google Wallet para ${storeName} (${classId})...`);
    // Try update (PUT)
    try {
      const putRes = await client.request({
        url: `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass/${classId}`,
        method: 'PUT',
        data: classResource
      });
      console.log(`✅ ¡Clase ${classId} actualizada con éxito en Google Wallet!`);
      return putRes.data;
    } catch (putErr) {
      if (putErr.response && putErr.response.status === 404) {
        const postRes = await client.request({
          url: 'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass',
          method: 'POST',
          data: classResource
        });
        console.log(`✅ ¡Clase ${classId} creada con éxito en Google Wallet!`);
        return postRes.data;
      }
      throw putErr;
    }
  } catch (error) {
    console.error(`❌ Error registrando clase para ${storeName}:`, error.response ? error.response.data : error.message);
    throw error;
  }
}

// Update Lorenza Tulum
registerGoogleClassForStore(
  'Lorenza Tulum',
  'https://fpmpmoltoijhoruxqsdf.supabase.co/storage/v1/object/public/product-images/stores/logo_1786810951161.png',
  '#FFFFFF',
  'https://fpmpmoltoijhoruxqsdf.supabase.co/storage/v1/object/public/product-images/stores/lorenza_strip_1786991978011.png'
);
