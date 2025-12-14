module.exports = {
  apps: [
    {
      name: 'sepolia-backend-dev',
      cwd: './Be',
      script: 'node_modules/.bin/nest',
      args: 'start --watch',
      instances: 1,
      autorestart: true,
      watch: ['src'],
      ignore_watch: ['node_modules', 'dist', 'coverage'],
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 8000
      },
      out_file: './logs/backend-out.log',
      error_file: './logs/backend-error.log'
    },
    {
      name: 'sepolia-frontend-dev',
      cwd: './web/apps',
      script: 'node_modules/.bin/next',
      args: 'dev --port 3000',
      instances: 1,
      autorestart: true,
      watch: false, // Next.js handles its own watching
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      out_file: './logs/frontend-out.log',
      error_file: './logs/frontend-error.log'
    }
  ]
};