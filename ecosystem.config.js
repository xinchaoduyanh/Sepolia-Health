module.exports = {
  apps: [
    {
      name: 'sepolia-backend',
      script: 'dist/src/main.js',
      cwd: './Be',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 8000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 8000
      },
      log_file: '/dev/null',
      out_file: '/dev/null',
      error_file: '/dev/null',
      log_date_format: '',
      kill_timeout: 5000
    },
    {
      name: 'sepolia-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: './web/apps',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      log_file: '/dev/null',
      out_file: '/dev/null',
      error_file: '/dev/null',
      log_date_format: '',
      kill_timeout: 5000
    }
  ]
};