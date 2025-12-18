module.exports = {
  apps: [
    {
      name: 'sepolia-backend-dev',
      script: 'npm',
      args: 'run start:dev',
      cwd: './Be',
      instances: 1,
      autorestart: false,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 8000
      },
      log_file: '/dev/null',
      out_file: '/dev/null',
      error_file: '/dev/null',
      log_date_format: ''
    },
    {
      name: 'sepolia-frontend-dev',
      script: 'npm',
      args: 'run dev',
      cwd: './web/apps',
      instances: 1,
      autorestart: false,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      log_file: '/dev/null',
      out_file: '/dev/null',
      error_file: '/dev/null',
      log_date_format: ''
    }
  ]
};
