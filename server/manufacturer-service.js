const fs = require('fs');
const path = require('path');

class ManufacturerService {
    constructor() {
        this.manufacturers = this.loadManufacturers();
    }

    loadManufacturers() {
        try {
            const dataPath = path.join(__dirname, 'data', 'manufacturers.json');
            if (fs.existsSync(dataPath)) {
                const data = fs.readFileSync(dataPath, 'utf8');
                const manufacturers = JSON.parse(data);
                console.log(`✅ Base de données chargée: ${Object.keys(manufacturers).length} fabricants`);
                return manufacturers;
            }
        } catch (error) {
            console.warn('⚠️ Impossible de charger manufacturers.json:', error.message);
        }

        console.warn('⚠️ Utilisation des données par défaut (fichier manufacturers.json non trouvé)');
        // Base de données par défaut minimale (fallback)
        return {
            "B827EB": { "manufacturer": "Raspberry Pi Foundation", "deviceType": "Single Board Computer", "confidence": 0.95 },
            "48E15C": { "manufacturer": "Samsung Electronics", "deviceType": "Smart TV", "confidence": 0.80 },
            "96E840": { "manufacturer": "LG Electronics", "deviceType": "Smart Device", "confidence": 0.75 },
            "BCD074": { "manufacturer": "Xiaomi Corporation", "deviceType": "IoT Device", "confidence": 0.70 }
        };
    }

    identifyManufacturer(mac) {
        if (!mac || mac === 'N/A') {
            return {
                identified: false,
                manufacturer: 'Unknown',
                device_type: 'Unknown',
                confidence: 0,
                source: 'none'
            };
        }

        // Normaliser la MAC (enlever les : et -)
        const normalizedMac = mac.replace(/[:-]/g, '').toUpperCase();

        // Essayer différents préfixes (3, 6, 9 caractères)
        const prefixes = [
            normalizedMac.substring(0, 6),  // 6 caractères (OUI standard)
            normalizedMac.substring(0, 3),  // 3 caractères (préfixe court)
            normalizedMac.substring(0, 9)   // 9 caractères (préfixe long)
        ];

        for (const prefix of prefixes) {
            if (this.manufacturers[prefix]) {
                const info = this.manufacturers[prefix];
                console.log(`✅ Fabricant identifié pour ${mac}: ${info.manufacturer} (préfixe: ${prefix})`);
                return {
                    identified: true,
                    manufacturer: info.manufacturer,
                    device_type: info.deviceType || 'Unknown Device',
                    confidence: info.confidence,
                    source: 'local_database'
                };
            }
        }

        console.log(`❌ Fabricant non trouvé pour ${mac} (préfixes testés: ${prefixes.join(', ')})`);
        return {
            identified: false,
            manufacturer: 'Unknown',
            device_type: 'Unknown',
            confidence: 0,
            source: 'unknown'
        };
    }

    async identifyDevices(devices) {
        console.log(`🔍 Identification des fabricants pour ${devices.length} appareils...`);

        const identifiedDevices = devices.map(device => {
            if (device.mac && device.mac !== 'N/A') {
                const manufacturerInfo = this.identifyManufacturer(device.mac);
                return {
                    ...device,
                    manufacturer: manufacturerInfo.manufacturer,
                    deviceType: manufacturerInfo.device_type,
                    manufacturerInfo: manufacturerInfo
                };
            }
            return device;
        });

        const identifiedCount = identifiedDevices.filter(d => d.manufacturerInfo?.identified).length;
        console.log(`✅ ${identifiedCount} appareils identifiés sur ${devices.length}`);

        return identifiedDevices;
    }

    // Méthode pour ajouter de nouveaux fabricants
    addManufacturer(prefix, manufacturer, deviceType, confidence = 0.8) {
        this.manufacturers[prefix.toUpperCase()] = {
            manufacturer,
            device_type: deviceType,
            confidence
        };
        console.log(`➕ Fabricant ajouté: ${prefix} -> ${manufacturer}`);
    }

    // Méthode pour sauvegarder la base de données
    saveManufacturers() {
        try {
            const dataPath = path.join(__dirname, 'data', 'manufacturers.json');
            const dir = path.dirname(dataPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(dataPath, JSON.stringify(this.manufacturers, null, 2));
            console.log('💾 Base de données des fabricants sauvegardée');
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);
        }
    }
}

module.exports = ManufacturerService; 