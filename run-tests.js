#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const testsDir = path.join(__dirname, 'tests');
const testFiles = fs.readdirSync(testsDir)
    .filter(file => file.endsWith('.js') && file.startsWith('test-'))
    .sort();

console.log('🧪 Lancement des tests Bonjour Network...\n');

let passedTests = 0;
let failedTests = 0;
const results = [];

async function runTest(testFile) {
    return new Promise((resolve) => {
        const testPath = path.join(testsDir, testFile);
        console.log(`\n📋 Test: ${testFile}`);
        console.log('─'.repeat(50));

        const startTime = Date.now();

        exec(`node "${testPath}"`, { timeout: 120000 }, (error, stdout, stderr) => {
            const duration = Date.now() - startTime;

            if (error) {
                console.log(`❌ ÉCHEC (${duration}ms)`);
                console.log(`   Erreur: ${error.message}`);
                if (stderr) console.log(`   Stderr: ${stderr}`);
                failedTests++;
                results.push({ test: testFile, status: 'FAILED', duration, error: error.message });
            } else {
                console.log(`✅ SUCCÈS (${duration}ms)`);
                passedTests++;
                results.push({ test: testFile, status: 'PASSED', duration });
            }

            if (stdout) {
                const lines = stdout.split('\n').slice(-5); // Afficher les 5 dernières lignes
                lines.forEach(line => {
                    if (line.trim()) console.log(`   ${line}`);
                });
            }

            resolve();
        });
    });
}

async function runAllTests() {
    console.log(`📊 ${testFiles.length} tests trouvés\n`);

    for (const testFile of testFiles) {
        await runTest(testFile);
    }

    // Résumé final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('='.repeat(60));
    console.log(`✅ Tests réussis: ${passedTests}`);
    console.log(`❌ Tests échoués: ${failedTests}`);
    console.log(`📈 Taux de réussite: ${Math.round((passedTests / testFiles.length) * 100)}%`);

    if (failedTests > 0) {
        console.log('\n❌ Tests échoués:');
        results.filter(r => r.status === 'FAILED').forEach(r => {
            console.log(`   - ${r.test}: ${r.error}`);
        });
    }

    console.log('\n🎯 Tests les plus rapides:');
    results
        .filter(r => r.status === 'PASSED')
        .sort((a, b) => a.duration - b.duration)
        .slice(0, 3)
        .forEach(r => {
            console.log(`   - ${r.test}: ${r.duration}ms`);
        });

    process.exit(failedTests > 0 ? 1 : 0);
}

runAllTests().catch(console.error); 