const pa11y = require('pa11y');
const fs = require('fs');

const urls = [
    'http://localhost:3000/',
    'http://localhost:3000/appareils',
    'http://localhost:3000/reseaux'
];

const options = {
    timeout: 30000,
    chromeLaunchConfig: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ],
        headless: true
    },
    log: {
        debug: console.log,
        error: console.error,
        info: console.log
    }
};

async function testAccessibility() {
    console.log('🔍 Démarrage des tests d\'accessibilité...');

    let hasErrors = false;

    for (const url of urls) {
        try {
            console.log(`\n📋 Test de l'accessibilité pour: ${url}`);

            const results = await pa11y(url, options);

            if (results.issues.length > 0) {
                console.log(`⚠️  ${results.issues.length} problème(s) d'accessibilité trouvé(s) sur ${url}:`);
                results.issues.forEach((issue, index) => {
                    console.log(`  ${index + 1}. ${issue.message} (${issue.code})`);
                });
                hasErrors = true;
            } else {
                console.log(`✅ Aucun problème d'accessibilité trouvé sur ${url}`);
            }

        } catch (error) {
            console.error(`❌ Erreur lors du test de ${url}:`, error.message);
            hasErrors = true;
        }
    }

    if (hasErrors) {
        console.log('\n❌ Des problèmes d\'accessibilité ont été trouvés');
        process.exit(1);
    } else {
        console.log('\n✅ Tous les tests d\'accessibilité ont réussi');
        process.exit(0);
    }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesse rejetée non gérée:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Exception non capturée:', error);
    process.exit(1);
});

testAccessibility(); 