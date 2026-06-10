module.exports = {
  apps: [
    {
      name: 'arra-server',
      script: 'server.js',
      cwd: '/home/jackc/projects/arra/server',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 5050,
      },
    },
    {
      name: 'arra-client',
      script: 'npx',
      args: 'vite --port 3050 --host',
      cwd: '/home/jackc/projects/arra/client',
      watch: false,
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'arra-analysis',
      script: '/home/jackc/projects/arra/venv/bin/python',
      args: 'app.py',
      cwd: '/home/jackc/projects/arra/analysis_service',
      watch: false,
      env: {
        PORT: 8080,
      },
    },
  ],
};
