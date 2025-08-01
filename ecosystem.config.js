module.exports = {
    apps: [
        {
            name: 'bonjour-backend',
            cwd: './server',
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
            log_file: './logs/backend.log',
            error_file: './logs/backend-error.log',
            out_file: './logs/backend-out.log'
        },
        {
            name: 'bonjour-frontend',
            cwd: './client',
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
            log_file: './logs/frontend.log',
            error_file: './logs/frontend-error.log',
            out_file: './logs/frontend-out.log'
        }
    ]
}; 