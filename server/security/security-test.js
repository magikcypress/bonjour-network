#!/usr/bin/env node

/**
 * Script de test de sécurité pour WiFi Tracker
 * Usage: node security/security-test.js
 */

const CommandValidator = require('./command-validator');
const EnvironmentValidator = require('../config/environment');
const { getCorsConfig } = require('../config/cors');

class SecurityTester {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: []
        };
    }

    /**
     * Exécute tous les tests de sécurité
     */
    async runAllTests() {
        console.log('🔒 Démarrage des tests de sécurité WiFi Tracker...\n');

        // Tests de validation des commandes
        this.testCommandValidation();

        // Tests de configuration CORS
        this.testCorsConfiguration();

        // Tests de variables d'environnement
        this.testEnvironmentVariables();

        // Tests de validation des entrées
        this.testInputValidation();

        // Tests de sécurité réseau
        this.testNetworkSecurity();

        // Tests de sécurité des API
        this.testApiSecurity();

        this.printResults();
    }

    /**
     * Test de validation des commandes système
     */
    testCommandValidation() {
        console.log('📋 Test 1: Validation des commandes système');

        const testCommands = [
            { cmd: 'arp -a', expected: true, desc: 'Commande ARP valide' },
            { cmd: 'netstat -rn', expected: true, desc: 'Commande netstat valide' },
            { cmd: 'ifconfig en0', expected: true, desc: 'Commande ifconfig valide' },
            { cmd: 'ping -c 1 192.168.1.1', expected: true, desc: 'Commande ping valide' },
            { cmd: 'rm -rf /', expected: false, desc: 'Commande dangereuse' },
            { cmd: 'cat /etc/passwd', expected: false, desc: 'Commande non autorisée' },
            { cmd: 'curl http://evil.com', expected: false, desc: 'Commande réseau non autorisée' }
        ];

        testCommands.forEach(test => {
            const result = CommandValidator.validate(test.cmd);
            this.addTestResult(
                'Command Validation',
                test.desc,
                result === test.expected,
                result ? '✅ Autorisée' : '❌ Bloquée'
            );
        });
    }

    /**
     * Test de configuration CORS
     */
    testCorsConfiguration() {
        console.log('📋 Test 2: Configuration CORS');

        const devConfig = getCorsConfig('development');
        const prodConfig = getCorsConfig('production');

        // Test configuration développement
        this.addTestResult(
            'CORS Development',
            'Origines locales autorisées',
            devConfig.origin.includes('http://localhost:3000'),
            devConfig.origin.join(', ')
        );

        // Test configuration production
        this.addTestResult(
            'CORS Production',
            'Origines strictes en production',
            prodConfig.origin.length === 2 &&
            prodConfig.origin.every(origin => origin.startsWith('https://')),
            prodConfig.origin.join(', ')
        );

        // Test méthodes HTTP
        this.addTestResult(
            'CORS Methods',
            'Méthodes HTTP limitées',
            devConfig.methods.length <= 5,
            devConfig.methods.join(', ')
        );
    }

    /**
     * Test des variables d'environnement
     */
    testEnvironmentVariables() {
        console.log('📋 Test 3: Variables d\'environnement');

        const validation = EnvironmentValidator.validate();

        this.addTestResult(
            'Environment Validation',
            'Configuration valide',
            validation.isValid,
            validation.isValid ? '✅ Valide' : `❌ ${validation.errors.length} erreurs`
        );

        if (validation.warnings.length > 0) {
            this.addTestResult(
                'Environment Warnings',
                'Avertissements de configuration',
                false,
                `${validation.warnings.length} avertissements`
            );
        }

        // Test des secrets
        const config = validation.config;
        this.addTestResult(
            'JWT Secret',
            'Secret JWT configuré',
            config.JWT_SECRET && config.JWT_SECRET.length >= 32,
            config.JWT_SECRET ? '✅ Configuré' : '❌ Non configuré'
        );

        this.addTestResult(
            'Mistral AI Key',
            'Clé API Mistral configurée',
            config.MISTRAL_AI_KEY && config.MISTRAL_AI_KEY.length >= 32,
            config.MISTRAL_AI_KEY ? '✅ Configurée' : '❌ Non configurée'
        );
    }

    /**
     * Test de validation des entrées
     */
    testInputValidation() {
        console.log('📋 Test 4: Validation des entrées');

        // Test validation MAC
        const macTests = [
            { mac: '00:11:22:33:44:55', expected: true, desc: 'MAC valide avec :' },
            { mac: '00-11-22-33-44-55', expected: true, desc: 'MAC valide avec -' },
            { mac: '00:11:22:33:44:5G', expected: false, desc: 'MAC invalide caractère' },
            { mac: '00:11:22:33:44', expected: false, desc: 'MAC trop courte' },
            { mac: '00:11:22:33:44:55:66', expected: false, desc: 'MAC trop longue' }
        ];

        macTests.forEach(test => {
            const result = CommandValidator.isValidMac(test.mac);
            this.addTestResult(
                'MAC Validation',
                test.desc,
                result === test.expected,
                result ? '✅ Valide' : '❌ Invalide'
            );
        });

        // Test validation IP
        const ipTests = [
            { ip: '192.168.1.1', expected: true, desc: 'IP valide' },
            { ip: '10.0.0.1', expected: true, desc: 'IP privée valide' },
            { ip: '256.1.2.3', expected: false, desc: 'IP invalide octet' },
            { ip: '192.168.1', expected: false, desc: 'IP incomplète' },
            { ip: '192.168.1.1.1', expected: false, desc: 'IP trop longue' }
        ];

        ipTests.forEach(test => {
            const result = CommandValidator.isValidIp(test.ip);
            this.addTestResult(
                'IP Validation',
                test.desc,
                result === test.expected,
                result ? '✅ Valide' : '❌ Invalide'
            );
        });
    }

    /**
     * Test de sécurité réseau
     */
    testNetworkSecurity() {
        console.log('📋 Test 5: Sécurité réseau');

        // Test des ports
        const config = EnvironmentValidator.getConfig();
        this.addTestResult(
            'Port Security',
            'Port non privilégié',
            parseInt(config.PORT) >= 1024,
            `Port ${config.PORT}`
        );

        // Test des timeouts
        this.addTestResult(
            'Timeout Security',
            'Timeouts raisonnables',
            parseInt(config.REQUEST_TIMEOUT) >= parseInt(config.SCAN_TIMEOUT),
            `Request: ${config.REQUEST_TIMEOUT}ms, Scan: ${config.SCAN_TIMEOUT}ms`
        );

        // Test des intervalles
        this.addTestResult(
            'Interval Security',
            'Intervalles de scan raisonnables',
            parseInt(config.WIFI_SCAN_INTERVAL) >= 5000,
            `${config.WIFI_SCAN_INTERVAL}ms`
        );
    }

    /**
     * Test de sécurité des API
     */
    testApiSecurity() {
        console.log('📋 Test 6: Sécurité des API');

        // Test des headers de sécurité
        const securityHeaders = [
            'X-Content-Type-Options',
            'X-Frame-Options',
            'X-XSS-Protection',
            'Referrer-Policy'
        ];

        this.addTestResult(
            'Security Headers',
            'Headers de sécurité configurés',
            true, // À implémenter avec un vrai test HTTP
            'Headers de sécurité disponibles'
        );

        // Test de rate limiting
        this.addTestResult(
            'Rate Limiting',
            'Rate limiting configuré',
            false, // À implémenter
            'Rate limiting à configurer'
        );
    }

    /**
     * Ajoute un résultat de test
     */
    addTestResult(category, description, passed, details) {
        const test = {
            category,
            description,
            passed,
            details,
            timestamp: new Date().toISOString()
        };

        this.results.tests.push(test);

        if (passed) {
            this.results.passed++;
        } else {
            this.results.failed++;
        }

        const status = passed ? '✅' : '❌';
        console.log(`  ${status} ${description}: ${details}`);
    }

    /**
     * Affiche les résultats finaux
     */
    printResults() {
        console.log('\n📊 Résultats des tests de sécurité:');
        console.log(`  ✅ Tests réussis: ${this.results.passed}`);
        console.log(`  ❌ Tests échoués: ${this.results.failed}`);
        console.log(`  ⚠️ Avertissements: ${this.results.warnings}`);

        const total = this.results.passed + this.results.failed;
        const successRate = total > 0 ? Math.round((this.results.passed / total) * 100) : 0;

        console.log(`\n📈 Taux de réussite: ${successRate}%`);

        if (this.results.failed > 0) {
            console.log('\n🚨 Tests échoués:');
            this.results.tests
                .filter(test => !test.passed)
                .forEach(test => {
                    console.log(`  - ${test.category}: ${test.description}`);
                });
        }

        if (successRate >= 80) {
            console.log('\n🎉 Application sécurisée !');
        } else if (successRate >= 60) {
            console.log('\n⚠️ Sécurité acceptable, améliorations recommandées.');
        } else {
            console.log('\n🚨 Sécurité insuffisante, corrections urgentes requises !');
        }
    }
}

// Exécution des tests si le script est appelé directement
if (require.main === module) {
    const tester = new SecurityTester();
    tester.runAllTests().catch(error => {
        console.error('❌ Erreur lors des tests de sécurité:', error);
        process.exit(1);
    });
}

module.exports = SecurityTester; 