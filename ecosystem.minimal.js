module.exports = {
  apps: [
    {
      name: 'sepolia-backend',
      script: './Be/node_modules/.bin/nest',
      args: 'start --watch',
      cwd: './Be',
      instances: 1,
      autorestart: true,
      watch: ['src'],
      ignore_watch: ['node_modules', 'dist'],
      env: {
        NODE_ENV: 'development',
        PORT: 8000
      }
    },
    {
      name: 'sepolia-frontend',
      script: './web/apps/node_modules/.bin/next',
      args: 'dev',
      cwd: './web/apps',
      instances: 1,
      autorestart: true,
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      }
    }
  ]
};