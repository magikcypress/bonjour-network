/**
 * Correctif pour les avertissements de dépréciation
 * Remplace util._extend par Object.assign
 */

// Patch pour node-wifi
const nodeWifi = require('node-wifi');

// Sauvegarder la fonction originale
const originalInit = nodeWifi.init;

// Remplacer util._extend par Object.assign
nodeWifi.init = function (config) {
    // Utiliser Object.assign au lieu de util._extend
    const mergedConfig = Object.assign({}, {
        iface: null,
        debug: false
    }, config);

    return originalInit.call(this, mergedConfig);
};

// Patch pour wifi-control si nécessaire
try {
    const wifiControl = require('wifi-control');

    // Sauvegarder les fonctions originales
    const originalScan = wifiControl.scan;
    const originalConnect = wifiControl.connect;

    // Remplacer les utilisations de util._extend
    if (originalScan) {
        wifiControl.scan = function (callback) {
            // Utiliser Object.assign pour fusionner les options
            const options = Object.assign({}, {
                iface: null
            });

            return originalScan.call(this, options, callback);
        };
    }

    if (originalConnect) {
        wifiControl.connect = function (ap, callback) {
            // Utiliser Object.assign pour fusionner les options
            const options = Object.assign({}, {
                iface: null
            }, ap);

            return originalConnect.call(this, options, callback);
        };
    }
} catch (error) {
    // wifi-control n'est pas installé ou n'est pas utilisé
    console.log('wifi-control non disponible, patch ignoré');
}

module.exports = {
    // Fonction utilitaire pour fusionner les objets
    mergeObjects: function (target, ...sources) {
        return Object.assign({}, target, ...sources);
    },

    // Fonction utilitaire pour étendre les objets
    extend: function (target, ...sources) {
        return Object.assign(target, ...sources);
    }
}; 