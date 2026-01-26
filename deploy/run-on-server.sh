#!/bin/bash
# Run this script on your DigitalOcean server
# Copy and paste this entire script after SSH'ing into the server

set -e

echo "🚀 Starting deployment..."

# Step 1: Clone repository
echo "Step 1: Cloning repository..."
if [ ! -d "$HOME/ongozacyberhub" ]; then
    git clone https://github.com/strivego254/ongozacyberhub.git $HOME/ongozacyberhub
    cd $HOME/ongozacyberhub
else
    cd $HOME/ongozacyberhub
    git pull origin main || git pull origin master || true
fi

# Step 2: Make deploy script executable
echo "Step 2: Making deploy script executable..."
chmod +x deploy/deploy.sh

# Step 3: Run deployment
echo "Step 3: Running deployment script..."
./deploy/deploy.sh

echo "✅ All commands completed!"

