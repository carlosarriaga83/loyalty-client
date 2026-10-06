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

const ISSUER_ID = '3388000000023180998'; // Obtenido de tu .env.master
const CLASS_ID = `${ISSUER_ID}.LoyaltyClass_Postreland`;

async function createLoyaltyClass() {
  const client = await auth.getClient();
  
  // Estructura de la Clase (La plantilla del pase)
  const classResource = {
    id: CLASS_ID,
    issuerName: "Postreland",
    reviewStatus: "UNDER_REVIEW", 
    programName: "Club Postreland",
    programLogo: {
      sourceUri: {
        uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Postre_logo.png/600px-Postre_logo.png" // Reemplaza con tu logo real si es necesario
      }
    },
    hexBackgroundColor: "#1c1916", // Marrón oscuro de la marca
    textModulesData: [
      {
        header: "Beneficios",
        body: "Escanea tu código QR en caja para acumular estrellas. Cada 10 estrellas te llevas una recompensa sorpresa."
      }
    ]
  };

  try {
    console.log(`Intentando crear la Clase de Pase: ${CLASS_ID}...`);
    const response = await client.request({
      url: `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass`,
      method: 'POST',
      data: classResource,
    });
    console.log("¡Clase creada con éxito!");
    console.log(response.data.id);
  } catch (error) {
    if (error.response && error.response.status === 409) {
      console.log(`La clase ${CLASS_ID} ya existe. ¡No necesitas hacer nada más!`);
    } else {
      console.error("Error creando la clase:");
      console.error(error.response ? error.response.data : error.message);
    }
  }
}

createLoyaltyClass();
