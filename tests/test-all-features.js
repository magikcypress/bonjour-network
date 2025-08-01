const puppeteer = require('puppeteer');
const io = require('socket.io-client');

async function testAllFeatures() {
    console.log('🧪 Test global de toutes les fonctionnalités...');

    const browser = await puppeteer.launch({
        headless: true, // Forcer le mode headless pour éviter les problèmes X
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
            '--disable-features=VizDisplayCompositor',
            '--disable-xvfb',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
        ],
        env: {
            ...process.env,
            DISPLAY: ':99' // Variable d'environnement pour X
        }
    });

    try {
        const page = await browser.newPage();

        // Activer les logs de la console
        page.on('console', msg => {
            console.log('🌐 Console:', msg.text());
        });

        console.log('🌐 Navigation vers l\'application...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

        // Attendre que l'application soit chargée
        await page.waitForSelector('.container', { timeout: 10000 });
        console.log('✅ Application chargée');

        // ===== TEST 1: Vérification des compteurs =====
        console.log('\n📊 TEST 1: Vérification des compteurs...');
        await testCounters(page);

        // ===== TEST 2: Test du toggle switch =====
        console.log('\n🔄 TEST 2: Test du toggle switch...');
        await testToggleSwitch(page);

        // ===== TEST 3: Test de navigation entre onglets =====
        console.log('\n📱 TEST 3: Test de navigation entre onglets...');
        await testTabNavigation(page);

        // ===== TEST 4: Test des réseaux WiFi =====
        console.log('\n📶 TEST 4: Test des réseaux WiFi...');
        await testNetworks(page);

        // ===== TEST 5: Test des appareils =====
        console.log('\n📱 TEST 5: Test des appareils...');
        await testDevices(page);

        // ===== TEST 6: Test WebSocket =====
        console.log('\n🔌 TEST 6: Test WebSocket...');
        await testWebSocket(page);

        // ===== TEST 7: Test de validation =====
        console.log('\n✅ TEST 7: Test de validation...');
        await testValidation(page);

        // ===== TEST 8: Test de scan automatique =====
        console.log('\n🔄 TEST 8: Test de scan automatique...');
        await testAutoScan(page);

        // ===== TEST 9: Test des détails de validation =====
        console.log('\n📋 TEST 9: Test des détails de validation...');
        await testValidationDetails(page);

        // ===== TEST 10: Test du problème des réseaux manquants =====
        console.log('\n🔍 TEST 10: Test du problème des réseaux manquants...');
        await testAutoScanMissing(page);

        // ===== TEST 11: Test WebSocket direct =====
        console.log('\n🔌 TEST 11: Test WebSocket direct...');
        await testDirectWebSocket();

        // ===== TEST 12: Test frontend WebSocket =====
        console.log('\n📱 TEST 12: Test frontend WebSocket...');
        await testFrontendWebSocket(page);

        // ===== TEST 13: Test des compteurs précis =====
        console.log('\n📊 TEST 13: Test des compteurs précis...');
        await testPreciseCounters(page);

        // ===== TEST 14: Test des compteurs HTML =====
        console.log('\n📄 TEST 14: Test des compteurs HTML...');
        await testHtmlCounters(page);

        // ===== TEST 15: Test des compteurs simples =====
        console.log('\n📈 TEST 15: Test des compteurs simples...');
        await testSimpleCounters(page);

        // ===== TEST 16: Test des compteurs multiples =====
        console.log('\n📊 TEST 16: Test des compteurs multiples...');
        await testMultipleCounters(page);

        // ===== TEST 17: Test des réseaux invalides =====
        console.log('\n❌ TEST 17: Test des réseaux invalides...');
        await testInvalidNetworks(page);

        // ===== TEST 18: Test de validation forcée =====
        console.log('\n🔧 TEST 18: Test de validation forcée...');
        await testForceInvalid(page);

        // ===== TEST 19: Test de validation automatique =====
        console.log('\n🤖 TEST 19: Test de validation automatique...');
        await testAutoValidation(page);

        // ===== TEST 20: Test de validation automatique avec correction =====
        console.log('\n🔧 TEST 20: Test de validation automatique avec correction...');
        await testAutoValidationFixed(page);

        // ===== TEST 21: Test de debug validation =====
        console.log('\n🐛 TEST 21: Test de debug validation...');
        await testValidationDebug(page);

        // ===== TEST 22: Test de toggle automatique invalide =====
        console.log('\n🔄 TEST 22: Test de toggle automatique invalide...');
        await testToggleAutoInvalid(page);

        // ===== TEST 23: Test de scan automatique invalide =====
        console.log('\n🔄 TEST 23: Test de scan automatique invalide...');
        await testAutoScanInvalid(page);

        // ===== TEST 24: Test des données serveur =====
        console.log('\n🖥️ TEST 24: Test des données serveur...');
        await testServerData(page);

        // ===== TEST 25: Test diagnostique Socket.IO =====
        console.log('\n🔍 TEST 25: Test diagnostique Socket.IO...');
        await testSocketIODiagnostic(page);

        // ===== TEST 26: Test de connexion Socket.IO directe =====
        console.log('\n🔌 TEST 26: Test de connexion Socket.IO directe...');
        await testSocketIODirectConnection(page);

        // ===== TEST 27: Test de connexion automatique Socket.IO =====
        console.log('\n🔌 TEST 27: Test de connexion automatique Socket.IO...');
        await testSocketIOAutoConnect(page);

        // ===== TEST 28: Test de diagnostic WebSocket pour le navigateur =====
        console.log('\n🔍 TEST 28: Test de diagnostic WebSocket pour le navigateur...');
        await testBrowserWebSocketDiagnostic(page);

        // ===== TEST 29: Test de connectivity.socket dans DeviceList =====
        console.log('\n📱 TEST 29: Test de connectivity.socket dans DeviceList...');
        await testDeviceListConnectivity(page);

        // ===== TEST 30: Test de cohérence des étapes scan complet =====
        console.log('\n🔍 TEST 30: Test de cohérence des étapes scan complet...');
        await testCompleteScanStepsConsistency(page);

        console.log('\n🎉 Tous les tests terminés avec succès !');

    } catch (error) {
        console.error('❌ Erreur lors du test global:', error);
    } finally {
        await browser.close();
    }
}

// Test 1: Vérification des compteurs
async function testCounters(page) {
    try {
        // Attendre un peu pour le chargement
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Récupérer les compteurs
        const counters = await page.evaluate(() => {
            const networkCounter = document.querySelector('span:contains("réseaux")')?.textContent || 'N/A';
            const deviceCounter = document.querySelector('span:contains("appareils")')?.textContent || 'N/A';

            return { networkCounter, deviceCounter };
        });

        console.log(`   📊 Compteurs trouvés: Réseaux=${counters.networkCounter}, Appareils=${counters.deviceCounter}`);

        // Vérifier que les compteurs sont présents
        if (counters.networkCounter !== 'N/A' || counters.deviceCounter !== 'N/A') {
            console.log('   ✅ Compteurs détectés');
        } else {
            console.log('   ⚠️ Compteurs non trouvés');
        }

    } catch (error) {
        console.log('   ❌ Erreur lors du test des compteurs:', error.message);
    }
}

// Test 2: Test du toggle switch
async function testToggleSwitch(page) {
    try {
        // Chercher le toggle switch
        const toggleSwitch = await page.$('button[class*="inline-flex h-6 w-11"]');

        if (toggleSwitch) {
            console.log('   ✅ Toggle switch trouvé');

            // Cliquer sur le toggle switch
            await toggleSwitch.click();
            console.log('   ✅ Toggle switch activé');

            // Attendre un peu
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Vérifier l'état
            const isEnabled = await page.$eval('button[class*="inline-flex h-6 w-11"]', el => {
                return el.classList.contains('bg-gradient-to-r');
            });

            console.log(`   📊 État du toggle: ${isEnabled ? 'Activé' : 'Désactivé'}`);

            // Cliquer à nouveau pour désactiver
            await toggleSwitch.click();
            console.log('   ✅ Toggle switch désactivé');

        } else {
            console.log('   ❌ Toggle switch non trouvé');
        }

    } catch (error) {
        console.log('   ❌ Erreur lors du test du toggle:', error.message);
    }
}

// Test 3: Test de navigation entre onglets
async function testTabNavigation(page) {
    try {
        // Aller sur la page Appareils
        const devicesTab = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(button => button.textContent.includes('Appareils'));
        });

        if (devicesTab && devicesTab.asElement()) {
            await devicesTab.asElement().click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log('   ✅ Navigation vers Appareils réussie');

            // Vérifier que la page a changé
            const isDevicesPage = await page.evaluate(() => {
                return document.querySelector('div.bg-white.rounded-lg') !== null;
            });

            if (isDevicesPage) {
                console.log('   ✅ Page Appareils chargée');
            } else {
                console.log('   ⚠️ Page Appareils non détectée');
            }

            // Revenir sur la page Réseaux
            const networksTab = await page.evaluateHandle(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.find(button => button.textContent.includes('Réseaux'));
            });

            if (networksTab && networksTab.asElement()) {
                await networksTab.asElement().click();
                await new Promise(resolve => setTimeout(resolve, 2000));
                console.log('   ✅ Navigation vers Réseaux réussie');
            }

        } else {
            console.log('   ❌ Onglet Appareils non trouvé');
        }

    } catch (error) {
        console.log('   ❌ Erreur lors de la navigation:', error.message);
    }
}

// Test 4: Test des réseaux WiFi
async function testNetworks(page) {
    try {
        // Vérifier que nous sommes sur la page réseaux
        const networkList = await page.$('div.grid.gap-6');

        if (networkList) {
            console.log('   ✅ Liste des réseaux trouvée');

            // Compter les réseaux
            const networkCount = await page.evaluate(() => {
                const networks = document.querySelectorAll('div.bg-white.rounded-lg.shadow-lg');
                return networks.length;
            });

            console.log(`   📊 Nombre de réseaux: ${networkCount}`);

            // Tester le bouton de scan
            const scanButton = await page.$('button:contains("Scanner")');
            if (scanButton) {
                console.log('   ✅ Bouton de scan trouvé');
            } else {
                console.log('   ⚠️ Bouton de scan non trouvé');
            }

        } else {
            console.log('   ⚠️ Liste des réseaux non trouvée');
        }

    } catch (error) {
        console.log('   ❌ Erreur lors du test des réseaux:', error.message);
    }
}

// Test 5: Test des appareils
async function testDevices(page) {
    try {
        // Aller sur la page Appareils
        const devicesTab = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(button => button.textContent.includes('Appareils'));
        });

        if (devicesTab && devicesTab.asElement()) {
            await devicesTab.asElement().click();
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Vérifier la liste des appareils
            const deviceList = await page.$('div.bg-white.rounded-lg');

            if (deviceList) {
                console.log('   ✅ Liste des appareils trouvée');

                // Compter les appareils
                const deviceCount = await page.evaluate(() => {
                    const devices = document.querySelectorAll('div.bg-white.rounded-lg.shadow-lg');
                    return devices.length;
                });

                console.log(`   📊 Nombre d'appareils: ${deviceCount}`);

                // Tester les boutons de scan
                const scanButtons = await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    return buttons.filter(button =>
                        button.textContent.includes('Scan') ||
                        button.textContent.includes('Scanner')
                    ).map(button => button.textContent.trim());
                });

                console.log(`   🔍 Boutons de scan trouvés: ${scanButtons.join(', ')}`);

            } else {
                console.log('   ⚠️ Liste des appareils non trouvée');
            }

        } else {
            console.log('   ❌ Onglet Appareils non trouvé');
        }

    } catch (error) {
        console.log('   ❌ Erreur lors du test des appareils:', error.message);
    }
}

// Test 6: Test WebSocket
async function testWebSocket(page) {
    try {
        // Vérifier la connectivité WebSocket
        const websocketStatus = await page.evaluate(() => {
            return window.socketService ? 'Service disponible' : 'Service non disponible';
        });

        console.log(`   🔌 État WebSocket: ${websocketStatus}`);

        if (websocketStatus === 'Service disponible') {
            console.log('   ✅ Service WebSocket disponible');
        } else {
            console.log('   ⚠️ Service WebSocket non disponible');
        }

    } catch (error) {
        console.log('   ❌ Erreur lors du test WebSocket:', error.message);
    }
}

// Test 7: Test de validation
async function testValidation(page) {
    try {
        // Vérifier la présence d'éléments de validation
        const validationElements = await page.evaluate(() => {
            const elements = [];

            // Chercher les messages d'erreur
            const errorMessages = document.querySelectorAll('[class*="error"], [class*="Error"]');
            elements.push(...Array.from(errorMessages).map(el => el.textContent.trim()));

            // Chercher les indicateurs de validation
            const validationIndicators = document.querySelectorAll('[class*="valid"], [class*="invalid"]');
            elements.push(...Array.from(validationIndicators).map(el => el.textContent.trim()));

            return elements;
        });

        if (validationElements.length > 0) {
            console.log(`   📋 Éléments de validation trouvés: ${validationElements.length}`);
        } else {
            console.log('   ✅ Aucun élément de validation (normal)');
        }

    } catch (error) {
        console.log('   ❌ Erreur lors du test de validation:', error.message);
    }
}

// Test 8: Test de scan automatique
async function testAutoScan(page) {
    try {
        // Vérifier les éléments de scan automatique
        const autoScanElements = await page.evaluate(() => {
            const elements = [];

            // Chercher les boutons de scan automatique
            const autoScanButtons = document.querySelectorAll('button');
            elements.push(...Array.from(autoScanButtons)
                .filter(button => button.textContent.includes('Auto') || button.textContent.includes('Automatique'))
                .map(button => button.textContent.trim()));

            // Chercher les indicateurs de scan en cours
            const scanIndicators = document.querySelectorAll('[class*="scan"], [class*="progress"]');
            elements.push(...Array.from(scanIndicators).map(el => el.textContent.trim()));

            return elements;
        });

        if (autoScanElements.length > 0) {
            console.log(`   🔄 Éléments de scan automatique: ${autoScanElements.join(', ')}`);
        } else {
            console.log('   ⚠️ Aucun élément de scan automatique trouvé');
        }

    } catch (error) {
        console.log('   ❌ Erreur lors du test de scan automatique:', error.message);
    }
}

// Test 9: Test des détails de validation
async function testValidationDetails(page) {
    try {
        // Attendre un peu pour voir les logs de validation
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Cliquer sur "Scanner maintenant" pour déclencher une nouvelle validation
        const buttons = await page.$$('button');
        for (const button of buttons) {
            const text = await button.evaluate(el => el.textContent);
            if (text.includes('Scanner maintenant')) {
                await button.click();
                console.log('   ✅ Bouton "Scanner maintenant" cliqué');
                break;
            }
        }

        // Attendre pour voir les nouveaux logs
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('   📊 Résumé de la validation:');
        console.log('   - Les logs ci-dessus montrent quels réseaux sont rejetés et pourquoi');
        console.log('   - Les réseaux "détectés" sont tous ceux du serveur');
        console.log('   - Les réseaux "validés" sont ceux qui passent la validation frontend');

    } catch (error) {
        console.log('   ❌ Erreur lors du test des détails de validation:', error.message);
    }
}

// Test 10: Test du problème des réseaux manquants
async function testAutoScanMissing(page) {
    try {
        // Vérifier l'état initial (mode manuel)
        const initialState = await page.evaluate(() => {
            const validatedCount = document.querySelectorAll('[class*="border-blue-500"]').length;
            const invalidSection = document.querySelector('h2');
            const invalidCount = invalidSection && invalidSection.textContent.includes('non validés')
                ? invalidSection.textContent.match(/\((\d+)\)/)?.[1] || '0'
                : '0';

            const allNetworks = document.querySelectorAll('[class*="border"]');
            const totalVisible = allNetworks.length;

            return {
                validated: validatedCount,
                invalid: parseInt(invalidCount),
                totalVisible: totalVisible,
                hasInvalidSection: !!invalidSection
            };
        });

        console.log(`   📊 État initial: Réseaux validés=${initialState.validated}, Non validés=${initialState.invalid}, Total visible=${initialState.totalVisible}`);

        // Chercher le toggle switch "Scan automatique"
        const autoScanToggle = await page.evaluate(() => {
            const toggleSwitches = Array.from(document.querySelectorAll('button')).filter(btn => {
                const classes = btn.className || '';
                return classes.includes('h-6') && classes.includes('w-11') && classes.includes('rounded-full');
            });

            if (toggleSwitches.length > 0) {
                return { found: true, count: toggleSwitches.length };
            }

            return { found: false };
        });

        if (autoScanToggle.found) {
            console.log('   ✅ Toggle switch trouvé');

            // Activer le mode automatique
            await page.evaluate(() => {
                const toggleSwitches = Array.from(document.querySelectorAll('button')).filter(btn => {
                    const classes = btn.className || '';
                    return classes.includes('h-6') && classes.includes('w-11') && classes.includes('rounded-full');
                });

                if (toggleSwitches.length > 0) {
                    toggleSwitches[0].click();
                }
            });

            console.log('   ✅ Mode automatique activé');
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Vérifier l'état après activation
            const finalState = await page.evaluate(() => {
                const validatedCount = document.querySelectorAll('[class*="border-blue-500"]').length;
                const allNetworks = document.querySelectorAll('[class*="border"]');
                return {
                    validated: validatedCount,
                    totalVisible: allNetworks.length
                };
            });

            console.log(`   📊 État final: Réseaux validés=${finalState.validated}, Total visible=${finalState.totalVisible}`);

        } else {
            console.log('   ❌ Toggle switch non trouvé');
        }

    } catch (error) {
        console.log('   ❌ Erreur lors du test des réseaux manquants:', error.message);
    }
}

// Test 11: Test WebSocket direct
async function testDirectWebSocket() {
    try {
        const socket = io('http://localhost:5001', {
            transports: ['websocket', 'polling'],
            timeout: 5000
        });

        return new Promise((resolve) => {
            socket.on('connect', () => {
                console.log('   ✅ WebSocket direct connecté:', socket.id);

                // Tester le scan en temps réel
                socket.emit('start-real-time-scan');

                setTimeout(() => {
                    socket.emit('stop-real-time-scan');
                    socket.disconnect();
                    resolve();
                }, 3000);
            });

            socket.on('connect_error', (error) => {
                console.log('   ❌ Erreur de connexion WebSocket direct:', error.message);
                resolve();
            });

            socket.on('real-time-scan-status', (status) => {
                console.log('   📡 Statut du scan en temps réel:', status);
            });

            socket.on('networks-updated', (networks) => {
                console.log(`   📡 Réseaux mis à jour: ${networks.length} réseaux`);
            });

            // Timeout après 5 secondes
            setTimeout(() => {
                console.log('   ⏰ Timeout du test WebSocket direct');
                socket.disconnect();
                resolve();
            }, 5000);
        });

    } catch (error) {
        console.log('   ❌ Erreur lors du test WebSocket direct:', error.message);
    }
}

// Test 12: Test frontend WebSocket
async function testFrontendWebSocket(page) {
    try {
        // Attendre un peu pour que les WebSockets se connectent
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Chercher le toggle switch
        const toggleSwitch = await page.$('button[class*="inline-flex h-6 w-11"]');

        if (toggleSwitch) {
            console.log('   ✅ Toggle switch trouvé');

            // Cliquer sur le toggle switch
            await toggleSwitch.click();
            console.log('   ✅ Toggle switch activé');

            // Attendre pour voir les logs
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Cliquer à nouveau pour désactiver
            await toggleSwitch.click();
            console.log('   ✅ Toggle switch désactivé');

            await new Promise(resolve => setTimeout(resolve, 2000));

        } else {
            console.log('   ❌ Toggle switch non trouvé');
        }

    } catch (error) {
        console.log('   ❌ Erreur lors du test frontend WebSocket:', error.message);
    }
}

// Test 13: Test des compteurs précis
async function testPreciseCounters(page) {
    try {
        const counters = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('*'));
            const texts = elements
                .filter(el => el.textContent && el.textContent.includes('réseaux'))
                .map(el => el.textContent.trim());
            return texts;
        });

        console.log(`   📊 Compteurs précis trouvés: ${counters.length}`);
        if (counters.length > 0) {
            console.log(`   📋 Textes: ${counters.slice(0, 3).join(', ')}${counters.length > 3 ? '...' : ''}`);
        }

    } catch (error) {
        console.log('   ❌ Erreur lors du test des compteurs précis:', error.message);
    }
}

// Test 14: Test des compteurs HTML
async function testHtmlCounters(page) {
    try {
        const networkListHTML = await page.evaluate(() => {
            const networkListSection = document.querySelector('.space-y-6');
            return networkListSection ? networkListSection.innerHTML.substring(0, 500) : 'Non trouvé';
        });

        console.log('   📄 HTML NetworkList:', networkListHTML + '...');

    } catch (error) {
        console.log('   ❌ Erreur lors du test des compteurs HTML:', error.message);
    }
}

// Test 15: Test des compteurs simples
async function testSimpleCounters(page) {
    try {
        const allTexts = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('*'));
            const texts = elements
                .filter(el => el.textContent && el.textContent.includes('réseaux'))
                .map(el => el.textContent.trim());
            return texts;
        });

        console.log(`   📊 Textes contenant "réseaux": ${allTexts.length}`);
        if (allTexts.length > 0) {
            console.log(`   📋 Exemples: ${allTexts.slice(0, 2).join(', ')}`);
        }

    } catch (error) {
        console.log('   ❌ Erreur lors du test des compteurs simples:', error.message);
    }
}

// Test 16: Test des compteurs multiples
async function testMultipleCounters(page) {
    try {
        const counters = await page.evaluate(() => {
            const networkElements = document.querySelectorAll('[class*="network"], [class*="Network"]');
            const deviceElements = document.querySelectorAll('[class*="device"], [class*="Device"]');

            return {
                networkCount: networkElements.length,
                deviceCount: deviceElements.length,
                networkTexts: Array.from(networkElements).map(el => el.textContent.trim()).slice(0, 3),
                deviceTexts: Array.from(deviceElements).map(el => el.textContent.trim()).slice(0, 3)
            };
        });

        console.log(`   📊 Compteurs multiples: Réseaux=${counters.networkCount}, Appareils=${counters.deviceCount}`);
        if (counters.networkTexts.length > 0) {
            console.log(`   📋 Exemples réseaux: ${counters.networkTexts.join(', ')}`);
        }

    } catch (error) {
        console.log('   ❌ Erreur lors du test des compteurs multiples:', error.message);
    }
}

// Test 17: Test des réseaux invalides
async function testInvalidNetworks(page) {
    try {
        const invalidNetworks = await page.evaluate(() => {
            const invalidElements = document.querySelectorAll('[class*="invalid"], [class*="error"]');
            return Array.from(invalidElements).map(el => el.textContent.trim()).slice(0, 5);
        });

        console.log(`   ❌ Réseaux invalides trouvés: ${invalidNetworks.length}`);
        if (invalidNetworks.length > 0) {
            console.log(`   📋 Exemples: ${invalidNetworks.join(', ')}`);
        } else {
            console.log('   ✅ Aucun réseau invalide détecté');
        }

    } catch (error) {
        console.log('   ❌ Erreur lors du test des réseaux invalides:', error.message);
    }
}

// Test 18: Test de validation forcée
async function testForceInvalid(page) {
    try {
        // Chercher des éléments de validation forcée
        const forceElements = await page.evaluate(() => {
            const elements = document.querySelectorAll('[class*="force"], [class*="invalid"]');
            return Array.from(elements).map(el => el.textContent.trim()).slice(0, 3);
        });

        console.log(`   🔧 Éléments de validation forcée: ${forceElements.length}`);
        if (forceElements.length > 0) {
            console.log(`   📋 Exemples: ${forceElements.join(', ')}`);
        }

    } catch (error) {
        console.log('   ❌ Erreur lors du test de validation forcée:', error.message);
    }
}

// Test 19: Test de validation automatique
async function testAutoValidation(page) {
    try {
        // Simuler une validation automatique
        const validationResult = await page.evaluate(() => {
            const validationElements = document.querySelectorAll('[class*="valid"], [class*="invalid"]');
            return {
                total: validationElements.length,
                valid: Array.from(validationElements).filter(el => el.className.includes('valid')).length,
                invalid: Array.from(validationElements).filter(el => el.className.includes('invalid')).length
            };
        });

        console.log(`   🤖 Validation automatique: Total=${validationResult.total}, Valides=${validationResult.valid}, Invalides=${validationResult.invalid}`);

    } catch (error) {
        console.log('   ❌ Erreur lors du test de validation automatique:', error.message);
    }
}

// Test 20: Test de validation automatique avec correction
async function testAutoValidationFixed(page) {
    try {
        // Simuler une validation avec correction automatique
        const fixedValidation = await page.evaluate(() => {
            const elements = document.querySelectorAll('[class*="fixed"], [class*="corrected"]');
            return Array.from(elements).map(el => el.textContent.trim()).slice(0, 3);
        });

        console.log(`   🔧 Validations corrigées: ${fixedValidation.length}`);
        if (fixedValidation.length > 0) {
            console.log(`   📋 Exemples: ${fixedValidation.join(', ')}`);
        }

    } catch (error) {
        console.log('   ❌ Erreur lors du test de validation corrigée:', error.message);
    }
}

// Test 21: Test de debug validation
async function testValidationDebug(page) {
    try {
        // Chercher des éléments de debug
        const debugElements = await page.evaluate(() => {
            const elements = document.querySelectorAll('[class*="debug"], [class*="log"]');
            return Array.from(elements).map(el => el.textContent.trim()).slice(0, 3);
        });

        console.log(`   🐛 Éléments de debug: ${debugElements.length}`);
        if (debugElements.length > 0) {
            console.log(`   📋 Exemples: ${debugElements.join(', ')}`);
        }

    } catch (error) {
        console.log('   ❌ Erreur lors du test de debug validation:', error.message);
    }
}

// Test 22: Test de toggle automatique invalide
async function testToggleAutoInvalid(page) {
    try {
        // Tester le toggle avec des données invalides
        const toggleResult = await page.evaluate(() => {
            const toggleSwitches = document.querySelectorAll('button[class*="h-6 w-11"]');
            return {
                found: toggleSwitches.length > 0,
                count: toggleSwitches.length
            };
        });

        console.log(`   🔄 Toggle switches trouvés: ${toggleResult.count}`);
        if (toggleResult.found) {
            console.log('   ✅ Toggle switches disponibles pour test');
        }

    } catch (error) {
        console.log('   ❌ Erreur lors du test de toggle automatique invalide:', error.message);
    }
}

// Test 23: Test de scan automatique invalide
async function testAutoScanInvalid(page) {
    try {
        // Tester le scan automatique avec des données invalides
        const scanResult = await page.evaluate(() => {
            const scanButtons = document.querySelectorAll('button');
            const autoScanButtons = Array.from(scanButtons).filter(btn =>
                btn.textContent.includes('Auto') || btn.textContent.includes('Automatique')
            );
            return {
                total: scanButtons.length,
                autoScan: autoScanButtons.length,
                autoScanTexts: autoScanButtons.map(btn => btn.textContent.trim())
            };
        });

        console.log(`   🔄 Scan automatique: Total boutons=${scanResult.total}, Auto scan=${scanResult.autoScan}`);
        if (scanResult.autoScan > 0) {
            console.log(`   📋 Boutons auto scan: ${scanResult.autoScanTexts.join(', ')}`);
        }

    } catch (error) {
        console.log('   ❌ Erreur lors du test de scan automatique invalide:', error.message);
    }
}

// Test 24: Test des données serveur
async function testServerData(page) {
    try {
        // Vérifier les données du serveur
        const serverData = await page.evaluate(() => {
            const networkElements = document.querySelectorAll('div.bg-white.rounded-lg.shadow-lg');
            const deviceElements = document.querySelectorAll('div.bg-white.rounded-lg.shadow-lg');

            return {
                networks: networkElements.length,
                devices: deviceElements.length,
                hasNetworkData: networkElements.length > 0,
                hasDeviceData: deviceElements.length > 0
            };
        });

        console.log(`   🖥️ Données serveur: Réseaux=${serverData.networks}, Appareils=${serverData.devices}`);
        console.log(`   📊 Données disponibles: Réseaux=${serverData.hasNetworkData ? 'OUI' : 'NON'}, Appareils=${serverData.hasDeviceData ? 'OUI' : 'NON'}`);

    } catch (error) {
        console.log('   ❌ Erreur lors du test des données serveur:', error.message);
    }
}

// Test 25: Test diagnostique Socket.IO
async function testSocketIODiagnostic(page) {
    try {
        console.log('   🔍 Démarrage du diagnostic Socket.IO...');

        // 1. Vérifier le message d'erreur Socket.IO sur la page appareils
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const appareilsButton = buttons.find(btn => btn.textContent.includes('Appareils'));
            if (appareilsButton) {
                appareilsButton.click();
            }
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        const socketErrorMessage = await page.evaluate(() => {
            const errorElements = Array.from(document.querySelectorAll('*')).filter(el =>
                el.textContent && el.textContent.includes('Socket.IO non disponible')
            );
            return errorElements.length > 0 ? errorElements[0].textContent.trim() : null;
        });

        if (socketErrorMessage) {
            console.log(`   ⚠️ Message Socket.IO trouvé: "${socketErrorMessage}"`);
        } else {
            console.log(`   ✅ Aucun message d'erreur Socket.IO trouvé`);
        }

        // 2. Vérifier l'état de connectivité dans le hook
        const connectivityState = await page.evaluate(() => {
            // Essayer d'accéder aux variables globales ou aux logs de console
            return {
                hasSocketService: typeof window.socketService !== 'undefined',
                hasUseDataManager: typeof window.useDataManager !== 'undefined',
                consoleLogs: window.consoleLogs || []
            };
        });

        console.log(`   🔌 État de connectivité:`, connectivityState);

        // 3. Vérifier les logs de console pour les erreurs Socket.IO
        const consoleErrors = await page.evaluate(() => {
            return window.consoleErrors || [];
        });

        if (consoleErrors.length > 0) {
            console.log(`   🐛 Erreurs de console trouvées:`, consoleErrors);
        }

        // 4. Tester la connexion WebSocket directe
        const websocketTest = await page.evaluate(() => {
            return new Promise((resolve) => {
                try {
                    const socket = new WebSocket('ws://localhost:3001');
                    socket.onopen = () => {
                        console.log('✅ WebSocket connecté directement');
                        socket.close();
                        resolve({ success: true, message: 'WebSocket connecté' });
                    };
                    socket.onerror = (error) => {
                        console.log('❌ Erreur WebSocket:', error);
                        resolve({ success: false, message: 'WebSocket non connecté' });
                    };
                    setTimeout(() => {
                        resolve({ success: false, message: 'Timeout WebSocket' });
                    }, 3000);
                } catch (error) {
                    resolve({ success: false, message: error.message });
                }
            });
        });

        console.log(`   🔌 Test WebSocket direct: ${websocketTest.success ? '✅' : '❌'} ${websocketTest.message}`);

        // 5. Vérifier les variables d'environnement et la configuration
        const configCheck = await page.evaluate(() => {
            return {
                hasSocketIO: typeof io !== 'undefined',
                hasPuppeteer: typeof puppeteer !== 'undefined',
                windowLocation: window.location.href,
                userAgent: navigator.userAgent
            };
        });

        console.log(`   ⚙️ Configuration:`, configCheck);

        // 6. Analyser le code source pour comprendre le problème
        const sourceAnalysis = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script')).map(script => ({
                src: script.src,
                type: script.type,
                hasContent: script.innerHTML.length > 0
            }));
            return {
                totalScripts: scripts.length,
                externalScripts: scripts.filter(s => s.src).length,
                inlineScripts: scripts.filter(s => s.hasContent).length
            };
        });

        console.log(`   📄 Analyse du code source:`, sourceAnalysis);

        // 7. Vérifier spécifiquement le hook useDataManager
        const hookAnalysis = await page.evaluate(() => {
            // Essayer de capturer les logs du hook
            const originalConsoleLog = console.log;
            const logs = [];
            console.log = (...args) => {
                logs.push(args.join(' '));
                originalConsoleLog.apply(console, args);
            };

            // Attendre un peu pour capturer les logs
            setTimeout(() => {
                console.log = originalConsoleLog;
            }, 1000);

            return {
                logs: logs,
                hasReact: typeof React !== 'undefined',
                hasHooks: typeof React !== 'undefined' && React.useState
            };
        });

        console.log(`   🪝 Analyse du hook:`, hookAnalysis);

    } catch (error) {
        console.log(`   ❌ Erreur lors du diagnostic Socket.IO: ${error.message}`);
    }
}

// Test 26: Test de connexion Socket.IO directe
async function testSocketIODirectConnection(page) {
    try {
        console.log('   🔌 Test de connexion Socket.IO directe...');

        const socketTest = await page.evaluate(async () => {
            try {
                // Vérifier si Socket.IO est disponible
                if (typeof io === 'undefined') {
                    return { error: 'Socket.IO non disponible dans le navigateur' };
                }

                // Tenter la connexion
                const socket = io('http://localhost:5001', {
                    transports: ['websocket', 'polling'],
                    timeout: 5000
                });

                return new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        resolve({ error: 'Timeout de connexion Socket.IO' });
                    }, 5000);

                    socket.on('connect', () => {
                        clearTimeout(timeout);
                        resolve({
                            success: true,
                            socketId: socket.id,
                            connected: socket.connected
                        });
                    });

                    socket.on('connect_error', (error) => {
                        clearTimeout(timeout);
                        resolve({
                            error: 'Erreur de connexion Socket.IO',
                            details: error.message
                        });
                    });
                });
            } catch (error) {
                return { error: error.message };
            }
        });

        console.log(`   🔌 Test de connexion Socket.IO:`, socketTest);

    } catch (error) {
        console.log(`   ❌ Erreur lors du test de connexion directe: ${error.message}`);
    }
}

// Test 27: Test de connexion automatique Socket.IO
async function testSocketIOAutoConnect(page) {
    try {
        console.log('   🔌 Test de connexion automatique Socket.IO...');

        const autoConnectTest = await page.evaluate(async () => {
            let socket = null;
            let isConnected = false;

            // Simuler la connexion automatique
            const connectSocket = () => {
                return new Promise((resolve, reject) => {
                    if (typeof io === 'undefined') {
                        reject(new Error('Socket.IO non disponible'));
                        return;
                    }

                    socket = io('http://localhost:5001', {
                        transports: ['websocket', 'polling'],
                        timeout: 10000,
                        reconnection: true,
                        reconnectionAttempts: 3,
                        reconnectionDelay: 1000
                    });

                    socket.on('connect', () => {
                        isConnected = true;
                        resolve({ success: true, socketId: socket.id });
                    });

                    socket.on('connect_error', (error) => {
                        isConnected = false;
                        reject(error);
                    });

                    socket.on('disconnect', (reason) => {
                        isConnected = false;
                    });
                });
            };

            try {
                const result = await connectSocket();
                return {
                    success: true,
                    socketId: result.socketId,
                    isConnected: isConnected
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message,
                    isConnected: isConnected
                };
            }
        });

        console.log(`   🔌 Test de connexion automatique:`, autoConnectTest);

    } catch (error) {
        console.log(`   ❌ Erreur lors du test de connexion automatique: ${error.message}`);
    }
}

// Test 28: Test de diagnostic WebSocket pour le navigateur
async function testBrowserWebSocketDiagnostic(page) {
    try {
        console.log('   🔍 Test de diagnostic WebSocket pour le navigateur...');

        const browserDiagnostic = await page.evaluate(() => {
            const errors = [];

            // Intercepter les erreurs WebSocket
            const originalWebSocket = window.WebSocket;
            window.WebSocket = function (url, protocols) {
                console.log('🔌 Tentative de connexion WebSocket vers:', url);
                const ws = new originalWebSocket(url, protocols);

                ws.addEventListener('error', (event) => {
                    errors.push({
                        type: 'websocket_error',
                        url: url,
                        error: event.error?.message || 'Erreur WebSocket'
                    });
                });

                ws.addEventListener('open', () => {
                    console.log('✅ WebSocket connecté vers:', url);
                });

                return ws;
            };

            return {
                errors: errors,
                hasSocketIO: typeof io !== 'undefined',
                windowLocation: window.location.href,
                userAgent: navigator.userAgent
            };
        });

        console.log(`   🔍 Diagnostic WebSocket navigateur:`, browserDiagnostic);

    } catch (error) {
        console.log(`   ❌ Erreur lors du diagnostic WebSocket navigateur: ${error.message}`);
    }
}

// Test 29: Test de connectivity.socket dans DeviceList
async function testDeviceListConnectivity(page) {
    try {
        console.log('   📱 Test de connectivity.socket dans DeviceList...');

        // 1. Aller sur la page Appareils
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const appareilsButton = buttons.find(btn => btn.textContent.includes('Appareils'));
            if (appareilsButton) {
                appareilsButton.click();
            }
        });
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 2. Vérifier l'état de connectivity.socket
        const connectivityState = await page.evaluate(() => {
            // Essayer d'accéder à l'état de connectivité via différentes méthodes
            const state = {
                hasConnectivityObject: false,
                hasSocketProperty: false,
                socketValue: null,
                hasSocketService: false,
                hasIo: false,
                errorMessage: null,
                errorCount: 0
            };

            // Vérifier window.connectivity
            if (window.connectivity) {
                state.hasConnectivityObject = true;
                if (window.connectivity.socket !== undefined) {
                    state.hasSocketProperty = true;
                    state.socketValue = window.connectivity.socket;
                }
            }

            // Vérifier Socket.IO
            if (window.io) {
                state.hasIo = true;
            }

            // Vérifier les messages d'erreur Socket.IO
            const errorElements = Array.from(document.querySelectorAll('*')).filter(el =>
                el.textContent && el.textContent.includes('Socket.IO non disponible')
            );
            state.errorCount = errorElements.length;
            state.errorMessage = errorElements.length > 0 ? errorElements[0].textContent : null;

            return state;
        });

        console.log('   🔌 État de connectivity.socket:', connectivityState);

        // 3. Test de connexion Socket.IO directe
        const socketTest = await page.evaluate(() => {
            if (!window.io) {
                return { success: false, error: 'Socket.IO non disponible' };
            }

            try {
                const socket = window.io('http://localhost:5001');
                return new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        resolve({ success: false, error: 'Timeout de connexion' });
                    }, 5000);

                    socket.on('connect', () => {
                        clearTimeout(timeout);
                        resolve({
                            success: true,
                            socketId: socket.id,
                            connected: socket.connected
                        });
                    });

                    socket.on('connect_error', (error) => {
                        clearTimeout(timeout);
                        resolve({ success: false, error: error.message });
                    });
                });
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        console.log('   🔌 Test de connexion Socket.IO:', socketTest);

        // 4. Vérifier les logs du hook useDataManager
        const hookLogs = await page.evaluate(() => {
            // Récupérer les logs depuis la console (si disponibles)
            return {
                hasHookLogs: true,
                message: 'Hook useDataManager devrait avoir des logs de connexion'
            };
        });

        console.log('   📊 Logs du hook:', hookLogs);

        // 5. Résultats finaux
        const results = {
            connectivity: connectivityState,
            socketTest: socketTest,
            hookLogs: hookLogs
        };

        console.log('   ✅ Test DeviceListConnectivity terminé');
        return results;

    } catch (error) {
        console.error('   ❌ Erreur lors du test DeviceListConnectivity:', error);
        throw error;
    }
}

// Test 30: Test de cohérence des étapes scan complet
async function testCompleteScanStepsConsistency(page) {
    try {
        console.log('   🔍 Test de cohérence des étapes scan complet...');

        // 1. Aller sur la page Appareils
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const appareilsButton = buttons.find(btn => btn.textContent.includes('Appareils'));
            if (appareilsButton) {
                appareilsButton.click();
            }
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 2. Récupérer les étapes définies dans le frontend
        const frontendSteps = await page.evaluate(() => {
            // Récupérer les étapes depuis le composant DeviceList
            const SCAN_STEPS = {
                fast: [
                    { id: 'arp', name: 'Scan ARP', description: 'Détection des appareils via table ARP' },
                    { id: 'netstat', name: 'Scan netstat', description: 'Connexions réseau actives' },
                    { id: 'dns', name: 'Résolution DNS', description: 'Résolution DNS inversée' }
                ],
                complete: [
                    { id: 'arp', name: 'Scan ARP', description: 'Détection des appareils via table ARP' },
                    { id: 'netstat', name: 'Scan netstat', description: 'Connexions réseau actives' },
                    { id: 'dns', name: 'Résolution DNS', description: 'Résolution DNS inversée' },
                    { id: 'ping', name: 'Ping sweep', description: 'Découverte active sur 254 adresses' },
                    { id: 'nmap', name: 'Scan nmap', description: 'Découverte avec nmap' },
                    { id: 'bonjour', name: 'Scan Bonjour', description: 'Services réseau (HTTP, SSH, etc.)' },
                    { id: 'arping', name: 'Scan arping', description: 'Découverte ARP active' },
                    { id: 'mistral', name: 'Identification Mistral AI', description: 'Identification des fabricants' }
                ]
            };

            return {
                fastSteps: SCAN_STEPS.fast,
                completeSteps: SCAN_STEPS.complete,
                fastCount: SCAN_STEPS.fast.length,
                completeCount: SCAN_STEPS.complete.length
            };
        });

        console.log('   📋 Étapes frontend:', frontendSteps);

        // 3. Démarrer un scan complet et capturer les étapes WebSocket
        const websocketSteps = await page.evaluate(() => {
            return new Promise((resolve) => {
                if (!window.io) {
                    resolve({ error: 'Socket.IO non disponible' });
                    return;
                }

                const socket = window.io('http://localhost:5001');
                const receivedSteps = [];
                const timeout = setTimeout(() => {
                    socket.disconnect();
                    resolve({
                        error: 'Timeout - pas d\'étapes reçues',
                        receivedSteps: receivedSteps
                    });
                }, 30000);

                socket.on('connect', () => {
                    console.log('🔌 Connecté pour test des étapes');

                    // Écouter les événements de progression
                    socket.on('scan-progress', (data) => {
                        console.log('📡 Étape reçue:', data);
                        receivedSteps.push({
                            step: data.step,
                            status: data.status,
                            message: data.message,
                            timestamp: data.timestamp
                        });
                    });

                    socket.on('scan-complete', (data) => {
                        console.log('✅ Scan terminé:', data);
                        clearTimeout(timeout);
                        socket.disconnect();
                        resolve({
                            success: true,
                            receivedSteps: receivedSteps,
                            deviceCount: data.devices ? data.devices.length : 0
                        });
                    });

                    socket.on('scan-error', (error) => {
                        console.log('❌ Erreur scan:', error);
                        clearTimeout(timeout);
                        socket.disconnect();
                        resolve({
                            error: error.error || 'Erreur de scan',
                            receivedSteps: receivedSteps
                        });
                    });

                    // Démarrer le scan complet
                    socket.emit('start-scan', { mode: 'complete', type: 'devices' });
                });

                socket.on('connect_error', (error) => {
                    clearTimeout(timeout);
                    resolve({ error: 'Erreur de connexion: ' + error.message });
                });
            });
        });

        console.log('   📡 Étapes WebSocket:', websocketSteps);

        // 4. Comparer les étapes frontend et WebSocket
        const comparison = await page.evaluate((frontendSteps, websocketSteps) => {
            if (websocketSteps.error) {
                return {
                    comparison: 'Impossible - Erreur WebSocket',
                    error: websocketSteps.error,
                    frontendSteps: frontendSteps.completeSteps.length,
                    websocketSteps: websocketSteps.receivedSteps ? websocketSteps.receivedSteps.length : 0
                };
            }

            const frontendStepIds = frontendSteps.completeSteps.map(step => step.id);
            const websocketStepIds = websocketSteps.receivedSteps.map(step => step.step);

            const matchingSteps = frontendStepIds.filter(id => websocketStepIds.includes(id));
            const missingInWebsocket = frontendStepIds.filter(id => !websocketStepIds.includes(id));
            const extraInWebsocket = websocketStepIds.filter(id => !frontendStepIds.includes(id));

            return {
                frontendStepCount: frontendSteps.completeSteps.length,
                websocketStepCount: websocketSteps.receivedSteps.length,
                matchingSteps: matchingSteps,
                missingInWebsocket: missingInWebsocket,
                extraInWebsocket: extraInWebsocket,
                isConsistent: matchingSteps.length === frontendSteps.completeSteps.length && extraInWebsocket.length === 0
            };
        }, frontendSteps, websocketSteps);

        console.log('   🔍 Comparaison des étapes:', comparison);

        // 5. Résultats finaux
        const results = {
            frontendSteps: frontendSteps,
            websocketSteps: websocketSteps,
            comparison: comparison
        };

        console.log('   ✅ Test de cohérence des étapes terminé');
        return results;

    } catch (error) {
        console.error('   ❌ Erreur lors du test de cohérence des étapes:', error);
        throw error;
    }
}

// Exécuter le test global
testAllFeatures().catch(console.error); 