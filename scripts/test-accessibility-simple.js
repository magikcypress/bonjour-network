#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testAccessibilitySimple() {
    console.log('🧪 Test d\'accessibilité simple...\n');

    const baseURL = 'http://localhost:3000';

    try {
        // ===== TEST 1: Vérification de la disponibilité du frontend =====
        console.log('🔍 TEST 1: Vérification du frontend...');
        try {
            const response = await axios.get(baseURL, { timeout: 10000 });
            console.log('✅ Frontend accessible:', response.status);
        } catch (error) {
            console.log('❌ Frontend inaccessible:', error.message);
            console.log('💡 Assurez-vous que le frontend est démarré avec: npm start');
            return;
        }

        // ===== TEST 2: Vérification des pages principales =====
        console.log('\n📄 TEST 2: Vérification des pages principales...');

        const pages = [
            { name: 'Page d\'accueil', url: '/' },
            { name: 'Page Appareils', url: '/appareils' },
            { name: 'Page Réseaux', url: '/reseaux' },
            { name: 'Page DNS & Services', url: '/dns' }
        ];

        for (const page of pages) {
            try {
                const response = await axios.get(`${baseURL}${page.url}`, { timeout: 5000 });
                console.log(`✅ ${page.name}: ${response.status}`);
            } catch (error) {
                console.log(`❌ ${page.name}: ${error.message}`);
            }
        }

        // ===== TEST 3: Vérification des API =====
        console.log('\n🔌 TEST 3: Vérification des API...');

        const apis = [
            { name: 'API Health', url: 'http://localhost:5001/api/health' },
            { name: 'API Appareils', url: 'http://localhost:5001/api/devices' },
            { name: 'API Réseaux WiFi', url: 'http://localhost:5001/api/wifi' },
            { name: 'API DNS', url: 'http://localhost:5001/api/dns' }
        ];

        for (const api of apis) {
            try {
                const response = await axios.get(api.url, { timeout: 5000 });
                console.log(`✅ ${api.name}: ${response.status}`);
            } catch (error) {
                console.log(`❌ ${api.name}: ${error.message}`);
            }
        }

        // ===== TEST 4: Vérification des éléments d'accessibilité =====
        console.log('\n♿ TEST 4: Vérification des éléments d\'accessibilité...');

        // Test de la page d'accueil pour les éléments d'accessibilité
        try {
            const homeResponse = await axios.get(baseURL, { timeout: 5000 });
            const html = homeResponse.data;

            // Vérifications d'accessibilité basiques
            const accessibilityChecks = [
                { name: 'Balise title', pattern: /<title>.*<\/title>/i, found: html.includes('<title>') },
                { name: 'Balise main', pattern: /<main/i, found: html.includes('<main') },
                { name: 'Balise nav', pattern: /<nav/i, found: html.includes('<nav') },
                { name: 'Balise h1', pattern: /<h1/i, found: html.includes('<h1') },
                { name: 'Balise h2', pattern: /<h2/i, found: html.includes('<h2') },
                { name: 'Attribut lang', pattern: /lang=/i, found: html.includes('lang=') },
                { name: 'Meta viewport', pattern: /viewport/i, found: html.includes('viewport') },
                { name: 'Meta description', pattern: /description/i, found: html.includes('description') }
            ];

            console.log('📋 Vérifications d\'accessibilité HTML:');
            accessibilityChecks.forEach(check => {
                if (check.found) {
                    console.log(`   ✅ ${check.name}`);
                } else {
                    console.log(`   ❌ ${check.name} manquant`);
                }
            });

        } catch (error) {
            console.log('❌ Erreur lors de la vérification d\'accessibilité:', error.message);
        }

        // ===== TEST 5: Vérification des couleurs et contrastes =====
        console.log('\n🎨 TEST 5: Vérification des couleurs et contrastes...');

        try {
            const homeResponse = await axios.get(baseURL, { timeout: 5000 });
            const html = homeResponse.data;

            // Vérifications de couleurs et contrastes
            const colorChecks = [
                { name: 'Classes Tailwind dark:', pattern: /dark:/g, found: html.includes('dark:') },
                { name: 'Classes Tailwind text-', pattern: /text-/g, found: html.includes('text-') },
                { name: 'Classes Tailwind bg-', pattern: /bg-/g, found: html.includes('bg-') },
                { name: 'Classes Tailwind border-', pattern: /border-/g, found: html.includes('border-') }
            ];

            console.log('📋 Vérifications de couleurs:');
            colorChecks.forEach(check => {
                if (check.found) {
                    console.log(`   ✅ ${check.name}`);
                } else {
                    console.log(`   ❌ ${check.name} manquant`);
                }
            });

        } catch (error) {
            console.log('❌ Erreur lors de la vérification des couleurs:', error.message);
        }

        // ===== TEST 6: Vérification de la responsivité =====
        console.log('\n📱 TEST 6: Vérification de la responsivité...');

        try {
            const homeResponse = await axios.get(baseURL, { timeout: 5000 });
            const html = homeResponse.data;

            // Vérifications de responsivité
            const responsiveChecks = [
                { name: 'Classes responsive sm:', pattern: /sm:/g, found: html.includes('sm:') },
                { name: 'Classes responsive md:', pattern: /md:/g, found: html.includes('md:') },
                { name: 'Classes responsive lg:', pattern: /lg:/g, found: html.includes('lg:') },
                { name: 'Classes responsive xl:', pattern: /xl:/g, found: html.includes('xl:') },
                { name: 'Classes flex', pattern: /flex/g, found: html.includes('flex') },
                { name: 'Classes grid', pattern: /grid/g, found: html.includes('grid') }
            ];

            console.log('📋 Vérifications de responsivité:');
            responsiveChecks.forEach(check => {
                if (check.found) {
                    console.log(`   ✅ ${check.name}`);
                } else {
                    console.log(`   ❌ ${check.name} manquant`);
                }
            });

        } catch (error) {
            console.log('❌ Erreur lors de la vérification de responsivité:', error.message);
        }

        console.log('\n🎉 Tests d\'accessibilité simples terminés !');
        console.log('\n💡 Pour des tests d\'accessibilité complets, utilisez:');
        console.log('   - Lighthouse (Chrome DevTools)');
        console.log('   - axe DevTools (extension navigateur)');
        console.log('   - WAVE Web Accessibility Evaluator');

    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

// Exécuter les tests
testAccessibilitySimple(); 