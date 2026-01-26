#!/bin/bash

# SSL Setup Script for Let's Encrypt
# Usage: ./setup-ssl.sh yourdomain.com

set -e

if [ -z "$1" ]; then
    echo "Usage: ./setup-ssl.sh yourdomain.com"
    exit 1
fi

DOMAIN=$1

echo "Setting up SSL for $DOMAIN..."

# Install Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN

# Test renewal
sudo certbot renew --dry-run

echo "✅ SSL setup completed!"
echo "Your site should now be accessible at: https://$DOMAIN"

