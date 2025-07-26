#!/bin/bash

echo "🔧 Configuration Bonjour Network pour macOS"
echo "========================================"

# Vérifier si nous sommes sur macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Ce script est destiné à macOS uniquement"
    exit 1
fi

echo "📱 Vérification des permissions réseau..."

# Vérifier si l'utilisateur a accès aux réseaux WiFi
if ! networksetup -listallnetworkservices > /dev/null 2>&1; then
    echo "⚠️  Attention: Vous pourriez avoir besoin de permissions supplémentaires"
    echo ""
    echo "Pour autoriser l'accès aux réseaux WiFi:"
    echo "1. Allez dans Préférences Système > Sécurité et confidentialité > Confidentialité"
    echo "2. Sélectionnez 'Accès complet au disque'"
    echo "3. Ajoutez Terminal ou votre éditeur de code"
    echo "4. Autorisez l'accès aux réseaux WiFi"
    echo ""
    read -p "Appuyez sur Entrée quand vous avez configuré les permissions..."
fi

echo "✅ Configuration terminée!"
echo ""
echo "🚀 Pour démarrer l'application:"
echo "   npm run dev"
echo ""
echo "📱 L'application sera accessible sur:"
echo "   - Interface: http://localhost:3000"
echo "   - API: http://localhost:5000" 