const path = require('path');
const os = require('os');

// Get home directory (works for both root and regular users)
const homeDir = os.homedir();
const projectDir = path.join(homeDir, 'ongozacyberhub');
const frontendDir = path.join(projectDir, 'frontend', 'nextjs_app');
const backendDir = path.join(projectDir, 'backend', 'django_app');

module.exports = {
  apps: [{
    name: 'ongoza-nextjs',
    script: 'npm',
    args: 'start',
    cwd: frontendDir,
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_DJANGO_API_URL: 'http://localhost:8000',
      NEXT_PUBLIC_FRONTEND_URL: 'http://localhost'
    },
    error_file: path.join(homeDir, '.pm2', 'logs', 'ongoza-nextjs-error.log'),
    out_file: path.join(homeDir, '.pm2', 'logs', 'ongoza-nextjs-out.log'),
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }, {
    name: 'ongoza-django',
    script: 'python3',
    args: 'manage.py runserver 0.0.0.0:8000',
    cwd: backendDir,
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      PYTHONPATH: backendDir,
      DJANGO_SETTINGS_MODULE: 'core.settings.sqlite_settings'
    },
    error_file: path.join(homeDir, '.pm2', 'logs', 'ongoza-django-error.log'),
    out_file: path.join(homeDir, '.pm2', 'logs', 'ongoza-django-out.log'),
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};

