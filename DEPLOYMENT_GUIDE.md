# Ongoza CyberHub Deployment Guide

## Overview
This guide covers deploying the Ongoza CyberHub application with smooth Google SSO student account creation.

## Prerequisites
- Ubuntu 20.04+ server
- Domain name (ongozacyberhub.com)
- SSL certificate (Let's Encrypt)
- Google OAuth credentials configured

## Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - Development: `http://localhost:3000/auth/google/callback`
   - Production: `https://ongozacyberhub.com/auth/google/callback`

## Quick Deployment

### Option 1: Automated Deployment (Recommended)
```bash
# On your server
git clone https://github.com/strivego254/ongozacyberhub.git
cd ongozacyberhub
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

### Option 2: Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## Environment Configuration

### Backend (.env)
```bash
# Copy and edit the template
cp .env.production.example .env

# Edit with your values
nano .env
```

Required environment variables:
- `DJANGO_SECRET_KEY`: Generate a secure random key
- `JWT_SECRET_KEY`: Generate a secure random key
- `GOOGLE_CLIENT_ID`: From Google Cloud Console
- `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
- `DB_PASSWORD`: Secure database password
- `EMAIL_HOST_USER`: Your email
- `EMAIL_HOST_PASSWORD`: App password (not regular password)

### Frontend (.env.production)
```bash
# Copy and edit
cp frontend/nextjs_app/.env.production.template frontend/nextjs_app/.env.production

# Edit URLs for production
NEXT_PUBLIC_DJANGO_API_URL=https://ongozacyberhub.com/api
NEXT_PUBLIC_FRONTEND_URL=https://ongozacyberhub.com
```

## SSL Setup
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d ongozacyberhub.com -d www.ongozacyberhub.com
```

## Testing Google SSO

### Student Account Creation Flow
1. Visit `https://ongozacyberhub.com/signup/student`
2. Click "Continue with Google"
3. Select Google account (existing or new)
4. Account is created automatically with student role
5. Redirected to AI profiler for onboarding

### Testing Checklist
- [ ] Google OAuth initiation works
- [ ] Redirect to Google authorization page
- [ ] Account creation on callback
- [ ] Correct role assignment (student)
- [ ] Proper redirect after signup
- [ ] Email verification bypassed (Google verified)

## Troubleshooting

### Common Issues

#### "Failed to fetch" on Google OAuth
- Check CORS settings in production.py
- Verify FRONTEND_URL environment variable
- Ensure SSL certificate is valid

#### Account not created
- Check SSO provider configuration in database
- Verify Google OAuth credentials
- Check Django logs for errors

#### Wrong redirect after signup
- Verify role-based redirect logic
- Check user role assignment
- Ensure profile creation works

### Logs
```bash
# PM2 logs
pm2 logs

# Django logs
tail -f /var/log/django/django.log

# Nginx logs
tail -f /var/log/nginx/error.log
```

### Database Management
```bash
# Access Django shell
cd backend/django_app
python3 manage.py shell

# Check SSO providers
from users.auth_models import SSOProvider
SSOProvider.objects.all()

# Check user roles
from users.models import User, UserRole
UserRole.objects.all()
```

## Production Monitoring

### Health Checks
- Frontend: `https://ongozacyberhub.com/api/health/`
- Backend: `https://ongozacyberhub.com/api/v1/health/`
- AI Service: `https://ongozacyberhub.com/ai/health`

### PM2 Management
```bash
# Check status
pm2 status

# Restart services
pm2 restart ongoza-nextjs
pm2 restart ongoza-django

# View logs
pm2 logs ongoza-nextjs
pm2 logs ongoza-django
```

## Security Checklist
- [ ] SSL certificate installed and valid
- [ ] SECRET_KEY changed from default
- [ ] DEBUG=False in production
- [ ] ALLOWED_HOSTS configured
- [ ] CORS settings restrictive
- [ ] Database password secure
- [ ] Google OAuth credentials secure
- [ ] Email credentials secure
- [ ] Firewall configured
- [ ] Regular backups configured

## Performance Optimization
- Enable gzip compression in Nginx
- Configure Redis caching
- Set up database connection pooling
- Enable static file caching
- Configure CDN for assets (optional)

## Support
For issues with Google SSO or deployment, check:
1. Django logs for backend errors
2. Browser console for frontend errors
3. Google Cloud Console for OAuth issues
4. Server logs for deployment issues
