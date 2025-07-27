module.exports = {
    env: {
        node: true,
        es2021: true,
    },
    extends: [
        'eslint:recommended',
    ],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
    },
    rules: {
        'no-unused-vars': 'warn',
        'no-console': 'off', // Permettre console.log pour les logs
        'no-undef': 'error',
        'no-unreachable': 'error',
        'no-constant-condition': 'warn',
    },
    ignorePatterns: [
        'node_modules/',
        'logs/',
        '*.log'
    ]
}; 