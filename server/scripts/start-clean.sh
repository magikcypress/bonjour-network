#!/bin/bash

# Script de démarrage propre sans avertissements
echo "🚀 Démarrage du serveur WiFi Tracker..."

# Vérifier la version de Node.js
NODE_VERSION=$(node --version)
echo "📦 Node.js version: $NODE_VERSION"

# Démarrer le serveur sans avertissements
NODE_OPTIONS="--no-deprecation" node index.js
