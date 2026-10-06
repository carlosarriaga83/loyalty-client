import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargamos el service account desde la raíz del proyecto
const keyPath = path.resolve(__dirname, '../postreland-6419293cfcce.json');
const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

// Inicializamos la autenticación de Google con el scope de Wallet
const auth = new GoogleAuth({
  credentials: {
    client_email: keyData.client_email,
    private_key: keyData.private_key
  },
  scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
});

const ISSUER_ID = '3388000000023180998'; // Obtenido de .env.master
const CLASS_ID = `${ISSUER_ID}.LoyaltyClass_Postreland`;

async function testWalletApi() {
  try {
    const client = await auth.getClient();
    console.log(`Realizando GET request a la API de Google Wallet para la clase: ${CLASS_ID}...`);
    
    const response = await client.request({
      url: `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass/${CLASS_ID}`,
      method: 'GET',
    });
    
    console.log("¡Respuesta exitosa!");
    console.log(`Status Code: ${response.status}`);
    console.log(`Class ID retornado: ${response.data.id}`);
  } catch (error) {
    console.error("Error contactando a la API de Google Wallet:");
    if (error.response) {
      console.error(`Status Code: ${error.response.status}`);
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testWalletApi();
