#!/usr/bin/env node

/**
 * Test de diagnostic WebSocket pour le navigateur
 * Simule le comportement du navigateur pour identifier le problème
 */

const puppeteer = require('puppeteer');

async function testBrowserSocket() {
    console.log('🔍 Test de diagnostic WebSocket pour le navigateur...');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Intercepter les erreurs de console
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('🌐 Console Error:', msg.text());
            }
        });

        // Intercepter les erreurs de réseau
        page.on('pageerror', error => {
            console.log('❌ Page Error:', error.message);
        });

        // Intercepter les requêtes réseau
        page.on('requestfailed', request => {
            console.log('❌ Request Failed:', request.url(), request.failure().errorText);
        });

        console.log('📱 Navigation vers l\'application...');
        await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

        console.log('⏳ Attente du chargement complet...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Vérifier les erreurs de WebSocket
        const socketErrors = await page.evaluate(() => {
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

            return errors;
        });

        console.log('🔍 Erreurs WebSocket détectées:', socketErrors);

        // Vérifier la configuration Socket.IO
        const socketConfig = await page.evaluate(() => {
            return {
                windowLocation: window.location.href,
                userAgent: navigator.userAgent,
                hasSocketIO: typeof window.io !== 'undefined'
            };
        });

        console.log('⚙️ Configuration Socket.IO:', socketConfig);

        // Tester la connexion Socket.IO directement
        const socketTest = await page.evaluate(async () => {
            try {
                // Simuler la connexion Socket.IO
                const io = window.io;
                if (!io) {
                    return { error: 'Socket.IO non disponible dans le navigateur' };
                }

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

        console.log('🔌 Test de connexion Socket.IO:', socketTest);

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    } finally {
        await browser.close();
    }
}

testBrowserSocket().catch(console.error); 