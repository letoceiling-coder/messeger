// PM2 конфигурация для production
require('dotenv').config({ path: '.env.production' });

module.exports = {
  apps: [
    {
      name: 'messager-backend',
      script: 'dist/src/main.js',
      instances: 1, // Один инстанс для shared hosting
      exec_mode: 'fork', // Fork mode вместо cluster (нет прав для cluster)
      env_file: '.env.production',
      env: {
        NODE_ENV: 'production',
        PORT: 30000, // Порт для shared hosting
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        REDIS_URL: process.env.REDIS_URL,
        CORS_ORIGIN: process.env.CORS_ORIGIN,
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
    },
  ],
};
