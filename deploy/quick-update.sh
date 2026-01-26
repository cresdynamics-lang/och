#!/bin/bash

echo '🚀 Quick server update...'
echo 'Pulling latest changes...'

cd ~/ongozacyberhub
git pull origin main

echo 'Installing dependencies...'
cd frontend/nextjs_app
npm install

echo 'Installing Django dependencies...'
cd ../backend/django_app
pip3 install -r requirements.txt --break-system-packages

echo 'Building Next.js...'
cd ../frontend/nextjs_app
npm run build

echo 'Restarting services...'
cd ~/ongozacyberhub
pm2 restart ongoza-nextjs
pm2 restart ongoza-django

echo '✅ Update complete!'
pm2 status

