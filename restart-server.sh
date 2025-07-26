#!/bin/bash

echo "🛑 Arrêt du serveur..."
pkill -f "npm run dev" || true
pkill -f "node.*index.js" || true

echo "⏳ Attente de 2 secondes..."
sleep 2

echo "🚀 Redémarrage du serveur..."
cd /Users/cyp/Documents/work/bonjour-network
npm run dev 