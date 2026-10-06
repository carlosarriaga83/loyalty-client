#!/bin/bash
set -e
echo "🚀 Desplegando loyalty-client a Vercel..."
npx vercel --prod --yes
echo "✅ Despliegue completado con éxito."
