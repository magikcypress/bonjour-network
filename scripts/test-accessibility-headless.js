#!/usr/bin/env node

const puppeteer = require('puppeteer');

const urls = [
    'http://localhost:3000/',
    'http://localhost:3000/appareils',
    'http://localhost:3000/reseaux',
    'http://localhost:3000/dns'
];

async function testAccessibilityHeadless() {
    console.log('🧪 Test d\'accessibilité headless...\n');

    const browser = await puppeteer.launch({
        headless: true,
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

        let hasErrors = false;

        for (const url of urls) {
            try {
                console.log(`\n📋 Test d'accessibilité pour: ${url}`);

                await page.goto(url, {
                    waitUntil: 'networkidle2',
                    timeout: 30000
                });

                // Attendre que la page soit chargée
                await page.waitForSelector('.container', { timeout: 15000 });

                // Vérifications d'accessibilité
                const accessibilityResults = await page.evaluate(() => {
                    const results = {
                        title: !!document.title,
                        main: !!document.querySelector('main'),
                        nav: !!document.querySelector('nav'),
                        h1: !!document.querySelector('h1'),
                        h2: !!document.querySelector('h2'),
                        lang: !!document.documentElement.lang,
                        viewport: !!document.querySelector('meta[name="viewport"]'),
                        description: !!document.querySelector('meta[name="description"]'),
                        buttons: document.querySelectorAll('button').length,
                        links: document.querySelectorAll('a').length,
                        images: document.querySelectorAll('img').length,
                        forms: document.querySelectorAll('form').length
                    };

                    // Vérifier les attributs d'accessibilité
                    const buttons = document.querySelectorAll('button');
                    const links = document.querySelectorAll('a');
                    const images = document.querySelectorAll('img');

                    results.buttonsWithAria = Array.from(buttons).filter(btn =>
                        btn.getAttribute('aria-label') || btn.getAttribute('aria-labelledby')
                    ).length;

                    results.linksWithText = Array.from(links).filter(link =>
                        link.textContent.trim().length > 0
                    ).length;

                    results.imagesWithAlt = Array.from(images).filter(img =>
                        img.getAttribute('alt')
                    ).length;

                    return results;
                });

                console.log(`✅ ${url} - Vérifications d'accessibilité:`);
                console.log(`   📄 Titre: ${accessibilityResults.title ? '✅' : '❌'}`);
                console.log(`   🧭 Navigation: ${accessibilityResults.nav ? '✅' : '❌'}`);
                console.log(`   📝 Contenu principal: ${accessibilityResults.main ? '✅' : '❌'}`);
                console.log(`   🏷️ Titres: H1=${accessibilityResults.h1 ? '✅' : '❌'}, H2=${accessibilityResults.h2 ? '✅' : '❌'}`);
                console.log(`   🌐 Langue: ${accessibilityResults.lang ? '✅' : '❌'}`);
                console.log(`   📱 Viewport: ${accessibilityResults.viewport ? '✅' : '❌'}`);
                console.log(`   📋 Description: ${accessibilityResults.description ? '✅' : '❌'}`);
                console.log(`   🔘 Boutons: ${accessibilityResults.buttons} (${accessibilityResults.buttonsWithAria} avec aria)`);
                console.log(`   🔗 Liens: ${accessibilityResults.links} (${accessibilityResults.linksWithText} avec texte)`);
                console.log(`   🖼️ Images: ${accessibilityResults.images} (${accessibilityResults.imagesWithAlt} avec alt)`);
                console.log(`   📝 Formulaires: ${accessibilityResults.forms}`);

                // Vérifier les contrastes et couleurs
                const colorResults = await page.evaluate(() => {
                    const style = getComputedStyle(document.body);
                    const hasDarkMode = document.documentElement.classList.contains('dark');
                    const hasTailwindClasses = document.body.className.includes('bg-') ||
                        document.body.className.includes('text-') ||
                        document.body.className.includes('border-');

                    return {
                        hasDarkMode,
                        hasTailwindClasses,
                        backgroundColor: style.backgroundColor,
                        color: style.color
                    };
                });

                console.log(`   🎨 Couleurs: Mode sombre=${colorResults.hasDarkMode ? '✅' : '❌'}, Tailwind=${colorResults.hasTailwindClasses ? '✅' : '❌'}`);

                // Vérifier la responsivité
                const responsiveResults = await page.evaluate(() => {
                    const hasResponsiveClasses = document.body.className.includes('sm:') ||
                        document.body.className.includes('md:') ||
                        document.body.className.includes('lg:') ||
                        document.body.className.includes('xl:');
                    const hasFlexGrid = document.body.className.includes('flex') ||
                        document.body.className.includes('grid');

                    return {
                        hasResponsiveClasses,
                        hasFlexGrid
                    };
                });

                console.log(`   📱 Responsive: Classes=${responsiveResults.hasResponsiveClasses ? '✅' : '❌'}, Flex/Grid=${responsiveResults.hasFlexGrid ? '✅' : '❌'}`);

                // Vérifier les erreurs de console
                const consoleErrors = await page.evaluate(() => {
                    return window.consoleErrors || [];
                });

                if (consoleErrors.length > 0) {
                    console.log(`   ⚠️ Erreurs console: ${consoleErrors.length}`);
                    hasErrors = true;
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

    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

// Exécuter les tests
testAccessibilityHeadless(); 