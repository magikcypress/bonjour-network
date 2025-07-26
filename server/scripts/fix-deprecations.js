#!/usr/bin/env node

/**
 * Script pour corriger les avertissements de dépréciation
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Correction des avertissements de dépréciation...\n');

// Configuration pour supprimer les avertissements spécifiques
const nodeOptions = {
    // Supprimer l'avertissement util._extend
    '--no-deprecation': true,
    // Ou utiliser un flag personnalisé
    '--no-warnings': process.env.NODE_ENV === 'production'
};

// Fonction pour vérifier les dépendances obsolètes
function checkDeprecatedDependencies() {
    console.log('📋 Vérification des dépendances...');

    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    const deprecatedPackages = [
        'node-wifi',
        'wifi-control',
        'winston'
    ];

    const foundDeprecated = [];

    for (const [name, version] of Object.entries(dependencies)) {
        if (deprecatedPackages.includes(name)) {
            foundDeprecated.push({ name, version });
        }
    }

    if (foundDeprecated.length > 0) {
        console.log('⚠️ Dépendances potentiellement obsolètes trouvées:');
        foundDeprecated.forEach(pkg => {
            console.log(`   - ${pkg.name}@${pkg.version}`);
        });
    } else {
        console.log('✅ Aucune dépendance obsolète trouvée');
    }

    return foundDeprecated;
}

// Fonction pour créer un fichier .nvmrc avec la version Node.js recommandée
function createNvmrc() {
    const nodeVersion = process.version;
    const nvmrcPath = path.join(__dirname, '..', '.nvmrc');

    if (!fs.existsSync(nvmrcPath)) {
        fs.writeFileSync(nvmrcPath, nodeVersion.slice(1)); // Enlever le 'v' du début
        console.log('✅ Fichier .nvmrc créé avec la version Node.js actuelle');
    }
}

// Fonction pour mettre à jour les scripts package.json
function updateScripts() {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Ajouter des scripts avec les options pour supprimer les avertissements
    const updatedScripts = {
        ...packageJson.scripts,
        'start:clean': 'node --no-deprecation index.js',
        'dev:clean': 'nodemon --no-deprecation index.js',
        'test:clean': 'node --no-deprecation test-api-sync.js'
    };

    packageJson.scripts = updatedScripts;

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Scripts mis à jour avec les options --no-deprecation');
}

// Fonction pour créer un fichier .env avec les options Node.js
function createEnvConfig() {
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = `
# Configuration pour supprimer les avertissements de dépréciation
NODE_OPTIONS=--no-deprecation

# Configuration de l'environnement
NODE_ENV=development
PORT=5001
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Configuration des logs
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Configuration des timeouts
SCAN_TIMEOUT=30000
FAST_SCAN_TIMEOUT=10000

# Configuration Mistral AI (optionnel)
MISTRAL_API_KEY=your_api_key_here
MISTRAL_MODEL=mistral-large-latest
`;

    if (!fs.existsSync(envPath)) {
        fs.writeFileSync(envPath, envContent.trim());
        console.log('✅ Fichier .env créé avec la configuration recommandée');
    }
}

// Fonction pour créer un script de démarrage propre
function createCleanStartScript() {
    const scriptPath = path.join(__dirname, 'start-clean.sh');
    const scriptContent = `#!/bin/bash

# Script de démarrage propre sans avertissements
echo "🚀 Démarrage du serveur Bonjour Network..."

# Vérifier la version de Node.js
NODE_VERSION=$(node --version)
echo "📦 Node.js version: $NODE_VERSION"

# Démarrer le serveur sans avertissements
NODE_OPTIONS="--no-deprecation" node index.js
`;

    fs.writeFileSync(scriptPath, scriptContent);
    fs.chmodSync(scriptPath, '755');
    console.log('✅ Script de démarrage propre créé: start-clean.sh');
}

// Fonction principale
function main() {
    try {
        console.log('🔧 Correction des avertissements de dépréciation...\n');

        // Vérifier les dépendances
        const deprecated = checkDeprecatedDependencies();

        // Créer les fichiers de configuration
        createNvmrc();
        createEnvConfig();
        updateScripts();
        createCleanStartScript();

        console.log('\n✅ Correction terminée !');
        console.log('\n📋 Actions recommandées:');
        console.log('1. Utiliser "npm run start:clean" pour démarrer sans avertissements');
        console.log('2. Utiliser "npm run dev:clean" pour le développement');
        console.log('3. Exécuter "./scripts/start-clean.sh" pour un démarrage propre');

        if (deprecated.length > 0) {
            console.log('\n⚠️ Considérer la mise à jour des dépendances obsolètes:');
            deprecated.forEach(pkg => {
                console.log(`   npm update ${pkg.name}`);
            });
        }

    } catch (error) {
        console.error('❌ Erreur lors de la correction:', error.message);
        process.exit(1);
    }
}

// Exécuter le script si appelé directement
if (require.main === module) {
    main();
}

module.exports = {
    checkDeprecatedDependencies,
    createNvmrc,
    updateScripts,
    createEnvConfig,
    createCleanStartScript
}; 