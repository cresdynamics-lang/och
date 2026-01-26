#!/bin/bash

echo '🚀 Updating OCH CyberHub Server...'
echo 'Pulling latest changes...'

cd ~/ongozacyberhub
git pull origin main

echo 'Installing updated dependencies...'
cd frontend/nextjs_app
npm install

echo 'Installing Django dependencies...'
cd ../backend/django_app
pip3 install -r requirements.txt --break-system-packages

echo 'Running Django migrations...'
python3 manage.py migrate

echo 'Building Next.js application...'
cd ../frontend/nextjs_app
npm run build

echo 'Restarting services...'
cd ~/ongozacyberhub
pm2 restart ongoza-nextjs
pm2 restart ongoza-django

echo '✅ Server updated successfully!'
echo 'Check status with: pm2 status'
echo 'View logs with: pm2 logs ongoza-nextjs'
echo 'View Django logs with: pm2 logs ongoza-django'

