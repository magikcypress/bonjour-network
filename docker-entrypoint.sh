#!/bin/bash

# Script d'entrée pour Bonjour Network Docker

set -e

echo "🚀 Démarrage de Bonjour Network..."

# Vérifier les variables d'environnement
echo "📋 Configuration :"
echo "  - NODE_ENV: ${NODE_ENV:-production}"
echo "  - PORT: ${PORT:-5001}"
echo "  - CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost:3001}"

# Créer le fichier .env si nécessaire
if [ ! -f /app/server/.env ]; then
    echo "📝 Création du fichier .env..."
    cat > /app/server/.env << EOF
NODE_ENV=${NODE_ENV:-production}
PORT=${PORT:-5001}
CORS_ORIGIN=${CORS_ORIGIN:-http://localhost:3001}
REQUEST_TIMEOUT=${REQUEST_TIMEOUT:-30000}
SCAN_TIMEOUT=${SCAN_TIMEOUT:-10000}
WIFI_SCAN_INTERVAL=${WIFI_SCAN_INTERVAL:-30000}
DEVICE_SCAN_INTERVAL=${DEVICE_SCAN_INTERVAL:-60000}
LOG_LEVEL=${LOG_LEVEL:-info}
MISTRAL_AI_URL=${MISTRAL_AI_URL:-https://api.mistral.ai}
MISTRAL_AI_KEY=${MISTRAL_AI_KEY:-}
JWT_SECRET=${JWT_SECRET:-}
EOF
fi

# Vérifier les permissions
echo "🔒 Vérification des permissions..."
ls -la /app/server/

# Démarrer le serveur
echo "🌐 Démarrage du serveur sur le port ${PORT:-5001}..."
cd /app/server
exec node index.js 