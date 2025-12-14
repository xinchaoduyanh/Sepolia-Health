module.exports = {
  apps: [{
    name: 'sepolia-frontend',
    cwd: './web/apps',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    },
    log_file: './logs/frontend.log',
    out_file: './logs/frontend-out.log',
    error_file: './logs/frontend-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    time: true
  }]
};