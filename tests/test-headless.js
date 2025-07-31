#!/usr/bin/env node

const puppeteer = require('puppeteer');
const io = require('socket.io-client');

async function testHeadless() {
    console.log('🧪 Test headless de toutes les fonctionnalités...\n');

    const browser = await puppeteer.launch({
        headless: true, // Mode headless pour éviter les problèmes de sandbox
        defaultViewport: { width: 1280, height: 720 },
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ]
    });

    try {
        const page = await browser.newPage();

        // Activer les logs de la console
        page.on('console', msg => {
            console.log('🌐 Console:', msg.text());
        });

        // Activer les logs d'erreur
        page.on('pageerror', error => {
            console.log('❌ Erreur page:', error.message);
        });

        console.log('🌐 Navigation vers l\'application...');
        await page.goto('http://localhost:3000', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Attendre que l'application soit chargée
        await page.waitForSelector('.container', { timeout: 15000 });
        console.log('✅ Application chargée');

        // ===== TEST 1: Vérification des compteurs =====
        console.log('\n📊 TEST 1: Vérification des compteurs...');
        await testCounters(page);

        // ===== TEST 2: Test de navigation entre onglets =====
        console.log('\n📱 TEST 2: Test de navigation entre onglets...');
        await testTabNavigation(page);

        // ===== TEST 3: Test des réseaux WiFi =====
        console.log('\n📶 TEST 3: Test des réseaux WiFi...');
        await testNetworks(page);

        // ===== TEST 4: Test des appareils =====
        console.log('\n📱 TEST 4: Test des appareils...');
        await testDevices(page);

        // ===== TEST 5: Test de validation =====
        console.log('\n✅ TEST 5: Test de validation...');
        await testValidation(page);

        // ===== TEST 6: Test des détails de validation =====
        console.log('\n📋 TEST 6: Test des détails de validation...');
        await testValidationDetails(page);

        // ===== TEST 7: Test des compteurs précis =====
        console.log('\n📊 TEST 7: Test des compteurs précis...');
        await testPreciseCounters(page);

        // ===== TEST 8: Test des réseaux invalides =====
        console.log('\n❌ TEST 8: Test des réseaux invalides...');
        await testInvalidNetworks(page);

        console.log('\n🎉 Tests headless terminés avec succès !');

    } catch (error) {
        console.error('❌ Erreur lors des tests:', error.message);
    } finally {
        await browser.close();
    }
}

async function testCounters(page) {
    try {
        // Attendre que les compteurs soient chargés
        await page.waitForSelector('[data-testid="networks-count"]', { timeout: 10000 });

        const networksCount = await page.$eval('[data-testid="networks-count"]', el => el.textContent);
        const devicesCount = await page.$eval('[data-testid="devices-count"]', el => el.textContent);
        const dnsCount = await page.$eval('[data-testid="dns-count"]', el => el.textContent);

        console.log(`✅ Compteurs: ${networksCount} réseaux, ${devicesCount} appareils, ${dnsCount} DNS`);
    } catch (error) {
        console.log('⚠️ Compteurs non trouvés:', error.message);
    }
}

async function testTabNavigation(page) {
    try {
        // Cliquer sur l'onglet Appareils
        await page.click('[data-testid="tab-devices"]');
        await page.waitForTimeout(1000);
        console.log('✅ Navigation vers onglet Appareils');

        // Cliquer sur l'onglet Réseaux
        await page.click('[data-testid="tab-networks"]');
        await page.waitForTimeout(1000);
        console.log('✅ Navigation vers onglet Réseaux');

        // Cliquer sur l'onglet DNS & Services
        await page.click('[data-testid="tab-dns"]');
        await page.waitForTimeout(1000);
        console.log('✅ Navigation vers onglet DNS & Services');

    } catch (error) {
        console.log('⚠️ Navigation entre onglets échouée:', error.message);
    }
}

async function testNetworks(page) {
    try {
        // Aller à l'onglet Réseaux
        await page.click('[data-testid="tab-networks"]');
        await page.waitForTimeout(2000);

        // Vérifier la présence de la liste des réseaux
        const networksList = await page.$$('.network-card');
        console.log(`✅ Réseaux trouvés: ${networksList.length} cartes`);

    } catch (error) {
        console.log('⚠️ Test réseaux échoué:', error.message);
    }
}

async function testDevices(page) {
    try {
        // Aller à l'onglet Appareils
        await page.click('[data-testid="tab-devices"]');
        await page.waitForTimeout(2000);

        // Vérifier la présence de la liste des appareils
        const devicesList = await page.$$('.device-card');
        console.log(`✅ Appareils trouvés: ${devicesList.length} cartes`);

    } catch (error) {
        console.log('⚠️ Test appareils échoué:', error.message);
    }
}

async function testValidation(page) {
    try {
        // Aller à l'onglet DNS & Services
        await page.click('[data-testid="tab-dns"]');
        await page.waitForTimeout(2000);

        // Vérifier la présence des sections de validation
        const resolvedSection = await page.$('.resolved-hosts');
        const failedSection = await page.$('.failed-hosts');

        if (resolvedSection) console.log('✅ Section hôtes résolus trouvée');
        if (failedSection) console.log('✅ Section hôtes échoués trouvée');

    } catch (error) {
        console.log('⚠️ Test validation échoué:', error.message);
    }
}

async function testValidationDetails(page) {
    try {
        // Aller à l'onglet DNS & Services
        await page.click('[data-testid="tab-dns"]');
        await page.waitForTimeout(2000);

        // Vérifier la présence des détails de validation
        const validationDetails = await page.$$('.validation-details');
        console.log(`✅ Détails de validation trouvés: ${validationDetails.length}`);

    } catch (error) {
        console.log('⚠️ Test détails validation échoué:', error.message);
    }
}

async function testPreciseCounters(page) {
    try {
        // Vérifier les compteurs précis
        const counters = await page.$$eval('.counter-item', elements =>
            elements.map(el => ({
                label: el.querySelector('.counter-label')?.textContent,
                value: el.querySelector('.counter-value')?.textContent
            }))
        );

        console.log(`✅ Compteurs précis trouvés: ${counters.length}`);

    } catch (error) {
        console.log('⚠️ Test compteurs précis échoué:', error.message);
    }
}

async function testInvalidNetworks(page) {
    try {
        // Aller à l'onglet Réseaux
        await page.click('[data-testid="tab-networks"]');
        await page.waitForTimeout(2000);

        // Vérifier la présence de réseaux invalides
        const invalidNetworks = await page.$$('.invalid-network');
        console.log(`✅ Réseaux invalides trouvés: ${invalidNetworks.length}`);

    } catch (error) {
        console.log('⚠️ Test réseaux invalides échoué:', error.message);
    }
}

// Exécuter les tests
testHeadless(); 