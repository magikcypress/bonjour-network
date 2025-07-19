const MistralAIService = require('./mistral-ai-service');
const fs = require('fs').promises;
const path = require('path');

class ManufacturerService {
    constructor() {
        this.manufacturersFile = path.join(__dirname, 'data', 'manufacturers.json');
        this.manufacturers = {};
        this.mistralService = new MistralAIService();
    }

    // Charger la base de données locale
    async loadManufacturers() {
        try {
            const data = await fs.readFile(this.manufacturersFile, 'utf8');
            this.manufacturers = JSON.parse(data);
            console.log(`✅ Base de données chargée: ${Object.keys(this.manufacturers).length} fabricants`);
        } catch (error) {
            console.log('⚠️ Base de données non trouvée, création d\'une nouvelle base');
            this.manufacturers = {};
        }
    }

    // Sauvegarder la base de données locale
    async saveManufacturers() {
        try {
            await fs.mkdir(path.dirname(this.manufacturersFile), { recursive: true });
            await fs.writeFile(this.manufacturersFile, JSON.stringify(this.manufacturers, null, 2));
            console.log('✅ Base de données sauvegardée');
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);
        }
    }

    // Identifier un fabricant par adresse MAC
    async identifyManufacturer(mac) {
        // 1. Vérifier d'abord la base locale
        const localResult = this.identifyFromLocal(mac);
        if (localResult.identified) {
            return localResult;
        }

        // 2. Demander à Mistral AI
        try {
            const mistralResult = await this.mistralService.identifyDevice(mac);

            // 3. Ajouter à la base locale si identifié
            if (mistralResult.identified && mistralResult.manufacturer !== 'Unknown Manufacturer') {
                await this.addToLocalDatabase(mac, mistralResult);
            }

            return mistralResult;
        } catch (error) {
            console.error(`❌ Erreur identification Mistral pour ${mac}:`, error);
            return {
                manufacturer: 'Unknown Manufacturer',
                deviceType: 'Unknown Device',
                confidence: 0,
                identified: false
            };
        }
    }

    // Identifier depuis la base locale
    identifyFromLocal(mac) {
        const macPrefix = mac.replace(/:/g, '').substring(0, 6).toUpperCase();

        if (this.manufacturers[macPrefix]) {
            return {
                manufacturer: this.manufacturers[macPrefix].manufacturer,
                deviceType: this.manufacturers[macPrefix].deviceType,
                confidence: 0.9, // Haute confiance pour la base locale
                identified: true,
                source: 'local'
            };
        }

        return {
            manufacturer: 'Unknown Manufacturer',
            deviceType: 'Unknown Device',
            confidence: 0,
            identified: false,
            source: 'local'
        };
    }

    // Ajouter à la base locale
    async addToLocalDatabase(mac, mistralResult) {
        const macPrefix = mac.replace(/:/g, '').substring(0, 6).toUpperCase();

        this.manufacturers[macPrefix] = {
            manufacturer: mistralResult.manufacturer,
            deviceType: mistralResult.deviceType,
            confidence: mistralResult.confidence,
            addedAt: new Date().toISOString(),
            mac: mac
        };

        await this.saveManufacturers();
        console.log(`✅ Ajouté à la base locale: ${macPrefix} -> ${mistralResult.manufacturer}`);
    }

    // Obtenir des statistiques sur la base
    getStats() {
        const total = Object.keys(this.manufacturers).length;
        const identified = Object.values(this.manufacturers).filter(m => m.confidence > 0.5).length;

        return {
            totalManufacturers: total,
            identifiedDevices: identified,
            successRate: total > 0 ? (identified / total * 100).toFixed(1) : 0
        };
    }

    // Lister tous les fabricants
    getAllManufacturers() {
        return this.manufacturers;
    }

    // Rechercher par fabricant
    searchByManufacturer(manufacturerName) {
        const results = [];
        for (const [prefix, data] of Object.entries(this.manufacturers)) {
            if (data.manufacturer.toLowerCase().includes(manufacturerName.toLowerCase())) {
                results.push({
                    macPrefix: prefix,
                    ...data
                });
            }
        }
        return results;
    }

    // Exporter la base en CSV
    exportToCSV() {
        const csv = ['MAC Prefix,Manufacturer,Device Type,Confidence,Added At\n'];

        for (const [prefix, data] of Object.entries(this.manufacturers)) {
            csv.push(`${prefix},${data.manufacturer},${data.deviceType},${data.confidence},${data.addedAt}\n`);
        }

        return csv.join('');
    }
}

module.exports = ManufacturerService; 