module.exports = {
  apps: [
    {
      name: 'sepolia-backend',
      script: './node_modules/.bin/nest',
      args: 'start',
      cwd: './Be',
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 8000
      }
    },
    {
      name: 'sepolia-frontend',
      script: './node_modules/.bin/next',
      args: 'start',
      cwd: './web/apps',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};