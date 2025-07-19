#!/bin/bash

echo "🚀 Démarrage de WiFi Tracker"
echo "============================"

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

echo "📦 Installation des dépendances..."
npm run install-all

echo "🔧 Configuration pour macOS..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    ./scripts/setup-macos.sh
fi

echo "🌐 Démarrage de l'application..."
echo ""
echo "📱 L'application sera accessible sur:"
echo "   - Interface: http://localhost:3000"
echo "   - API: http://localhost:5001"
echo ""
echo "⏳ Démarrage en cours..."

# Démarrer l'application
npm run dev 