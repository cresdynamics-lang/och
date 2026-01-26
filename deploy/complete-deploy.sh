#!/bin/bash
# Complete deployment script - Run this on your server after SSH'ing in
# Copy this entire file and run: bash complete-deploy.sh

set -e

echo "🚀 Starting complete deployment..."

# Install Node.js
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi
echo "Node.js: $(node --version)"

# Clone repository
if [ ! -d "$HOME/ongozacyberhub" ]; then
    git clone https://github.com/strivego254/ongozacyberhub.git $HOME/ongozacyberhub
fi
cd $HOME/ongozacyberhub
git pull origin main || git pull origin master || true

# Install dependencies
cd frontend/nextjs_app
npm install

# Create .env.production
if [ ! -f .env.production ]; then
    cat > .env.production << 'EOF'
NEXT_PUBLIC_DJANGO_API_URL=http://localhost:8000
NEXT_PUBLIC_FASTAPI_API_URL=http://localhost:8001
NEXT_PUBLIC_FRONTEND_URL=https://ongozacyberhub.com
EOF
fi

# Build
npm run build

# Install PM2
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# Start with PM2
cd $HOME/ongozacyberhub
pm2 delete ongoza-nextjs 2>/dev/null || true
pm2 start deploy/ecosystem.config.js
pm2 save
STARTUP_CMD=$(pm2 startup ubuntu -u $USER --hp $HOME | grep -oP 'sudo.*$' || echo "")
if [ ! -z "$STARTUP_CMD" ]; then
    eval $STARTUP_CMD
fi

# Setup firewall
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 22/tcp
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Install and configure NGINX
if ! command -v nginx &> /dev/null; then
    sudo apt update
    sudo apt install -y nginx
fi

sudo cp $HOME/ongozacyberhub/deploy/nginx.conf /etc/nginx/sites-available/ongoza-cyberhub
sudo ln -sf /etc/nginx/sites-available/ongoza-cyberhub /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "✅ Deployment complete! App running at http://ongozacyberhub.com"
echo "Run: cd $HOME/ongozacyberhub && ./deploy/setup-ssl.sh ongozacyberhub.com"

