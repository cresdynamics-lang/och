# Deploy to DigitalOcean Server

## Quick Update (Recommended)

SSH into the server and run:

```bash
ssh root@159.223.224.136
cd ~/ongozacyberhub
bash deploy/quick_update.sh
```

This will:
- Pull latest code
- Update dependencies
- Rebuild frontend
- Restart all services
- Verify health

## Full Update & Restart

For a complete update with verification:

```bash
ssh root@159.223.224.136
cd ~/ongozacyberhub
bash deploy/update_and_restart.sh
```

## Manual Steps

If scripts don't work, follow these steps:

### 1. Update Code
```bash
cd ~/ongozacyberhub
git pull origin main
```

### 2. Update Frontend (PM2)
```bash
cd frontend/nextjs_app
npm install
npm run build
```

### 3. Update Backend (PM2)
```bash
cd ~/ongozacyberhub/backend/django_app
pip3 install -r requirements.txt
python3 manage.py migrate --noinput
```

### 4. Restart Services (PM2)
```bash
cd ~/ongozacyberhub
pm2 restart all
pm2 save
```

### 5. Restart Services (Docker)
```bash
cd ~/ongozacyberhub/backend
docker compose pull
docker compose up -d --build
```

### 6. Verify
```bash
curl http://localhost:8000/api/v1/health/
curl http://localhost:8000/api/v1/auth/google/initiate?role=student
```

## Check Logs

```bash
# PM2
pm2 logs ongoza-django
pm2 logs ongoza-nextjs

# Docker
docker compose logs -f django
docker compose logs -f nextjs
```

## Server Details

- IP: 159.223.224.136
- Domain: ongozacyberhub.com
- SSH: ssh root@159.223.224.136
