// Script de test pour simuler des réseaux WiFi
const networks = [
    {
        ssid: "MonWiFi_2.4G",
        frequency: "2412",
        quality: "85",
        security: "WPA2",
        signalStrength: "85",
        isBlocked: false,
        lastSeen: new Date().toISOString()
    },
    {
        ssid: "MonWiFi_5G",
        frequency: "5180",
        quality: "92",
        security: "WPA3",
        signalStrength: "92",
        isBlocked: false,
        lastSeen: new Date().toISOString()
    },
    {
        ssid: "Voisin_Open",
        frequency: "2437",
        quality: "45",
        security: "Open",
        signalStrength: "45",
        isBlocked: true,
        lastSeen: new Date().toISOString()
    },
    {
        ssid: "Cafe_WiFi",
        frequency: "2462",
        quality: "78",
        security: "WPA2",
        signalStrength: "78",
        isBlocked: false,
        lastSeen: new Date().toISOString()
    },
    {
        ssid: "iPhone_cyp",
        frequency: "5180",
        quality: "88",
        security: "WPA2",
        signalStrength: "88",
        isBlocked: false,
        lastSeen: new Date().toISOString()
    },
    {
        ssid: "Suspicious_Network",
        frequency: "2412",
        quality: "32",
        security: "WEP",
        signalStrength: "32",
        isBlocked: true,
        lastSeen: new Date().toISOString()
    }
];

console.log('Réseaux WiFi de test:');
networks.forEach((network, index) => {
    console.log(`${index + 1}. ${network.ssid}`);
    console.log(`   Fréquence: ${network.frequency} MHz (${parseInt(network.frequency) >= 5000 ? '5 GHz' : '2.4 GHz'})`);
    console.log(`   Signal: ${network.signalStrength}%`);
    console.log(`   Sécurité: ${network.security}`);
    console.log(`   Bloqué: ${network.isBlocked ? 'Oui' : 'Non'}`);
    console.log('');
});

module.exports = networks; 