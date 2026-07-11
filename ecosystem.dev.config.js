module.exports = {
  apps: [
    {
      name: 'sepolia-backend-dev',
      script: 'npm.cmd',
      args: 'run start:dev',
      cwd: './Be',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 8000
      }
    },
    {
      name: 'sepolia-frontend-dev',
      script: 'npm.cmd',
      args: 'run dev',
      cwd: './web/apps',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      }
    },
    {
      name: 'sepolia-ai-dev',
      script: 'npm.cmd',
      args: 'run start',
      cwd: './app',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
};
