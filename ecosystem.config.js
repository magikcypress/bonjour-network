const path = require('path');

module.exports = {
    apps: [
        {
            name: 'bonjour-backend',
            cwd: path.join(__dirname, 'server'),
            script: 'index.js',
            env: {
                NODE_ENV: 'production',
                PORT: 5001,
                NODE_OPTIONS: '--max-old-space-size=512'
            },
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '512M',
            log_file: path.join(__dirname, 'logs', 'backend.log'),
            error_file: path.join(__dirname, 'logs', 'backend-error.log'),
            out_file: path.join(__dirname, 'logs', 'backend-out.log')
        },
        {
            name: 'bonjour-frontend',
            cwd: path.join(__dirname, 'client'),
            script: 'npm',
            args: 'start',
            env: {
                NODE_ENV: 'production',
                REACT_APP_API_URL: 'http://localhost:5001'
            },
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '512M',
            log_file: path.join(__dirname, 'logs', 'frontend.log'),
            error_file: path.join(__dirname, 'logs', 'frontend-error.log'),
            out_file: path.join(__dirname, 'logs', 'frontend-out.log')
        }
    ]
}; 