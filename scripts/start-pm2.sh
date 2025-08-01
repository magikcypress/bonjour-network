#!/bin/bash

echo "🚀 Démarrage de Bonjour Network avec PM2..."

# Arrêter les processus existants
pm2 delete all 2>/dev/null

# Démarrer les applications
pm2 start ../ecosystem.config.js

# Sauvegarder la configuration
pm2 save

echo "✅ Application démarrée !"
echo "📊 Statut : pm2 status"
echo "📱 Accès : http://$(hostname -I | awk '{print $1}'):3000"
echo "🔧 API : http://$(hostname -I | awk '{print $1}'):5001" 