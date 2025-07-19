const ManufacturerService = require('./manufacturer-service');
const fs = require('fs').promises;
const path = require('path');

async function importInitialManufacturers() {
    try {
        console.log('🔄 Import de la base initiale des fabricants...');

        const manufacturerService = new ManufacturerService();
        await manufacturerService.loadManufacturers();

        // Charger la base initiale
        const initialDataPath = path.join(__dirname, 'data', 'manufacturers-initial.json');
        const initialData = JSON.parse(await fs.readFile(initialDataPath, 'utf8'));

        let importedCount = 0;
        let skippedCount = 0;

        for (const [macPrefix, data] of Object.entries(initialData)) {
            try {
                // Vérifier si déjà présent
                const existing = manufacturerService.manufacturers[macPrefix];
                if (!existing) {
                    // Ajouter à la base locale
                    manufacturerService.manufacturers[macPrefix] = {
                        manufacturer: data.manufacturer,
                        deviceType: data.deviceType,
                        confidence: data.confidence,
                        addedAt: new Date().toISOString(),
                        source: 'initial-import'
                    };
                    importedCount++;
                    console.log(`✅ Importé: ${macPrefix} -> ${data.manufacturer}`);
                } else {
                    skippedCount++;
                    console.log(`⏭️ Déjà présent: ${macPrefix} -> ${data.manufacturer}`);
                }
            } catch (error) {
                console.error(`❌ Erreur import ${macPrefix}:`, error);
            }
        }

        // Sauvegarder la base mise à jour
        await manufacturerService.saveManufacturers();

        console.log(`\n📊 Résumé de l'import:`);
        console.log(`✅ Importés: ${importedCount}`);
        console.log(`⏭️ Ignorés: ${skippedCount}`);
        console.log(`📈 Total dans la base: ${Object.keys(manufacturerService.manufacturers).length}`);

        // Afficher les statistiques
        const stats = manufacturerService.getStats();
        console.log(`\n📈 Statistiques finales:`);
        console.log(`- Fabricants total: ${stats.totalManufacturers}`);
        console.log(`- Taux de succès: ${stats.successRate}%`);

    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error);
    }
}

// Exécuter l'import si appelé directement
if (require.main === module) {
    importInitialManufacturers();
}

module.exports = { importInitialManufacturers }; 