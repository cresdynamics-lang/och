# Production Readiness Checklist for OCH Platform

## ✅ What's Already Good

### Environment Variables (All APIs use env vars with dev fallbacks)
- ✅ `NEXT_PUBLIC_DJANGO_API_URL` - Django backend URL
- ✅ `NEXT_PUBLIC_FASTAPI_API_URL` - FastAPI profiling service URL  
- ✅ `NEXT_PUBLIC_FRONTEND_URL` - Frontend URL for callbacks
- ✅ All API clients check env vars first, localhost only as dev fallback

### Mock Data (Acceptable - Used only as offline fallback)
- ✅ Mock profiling sessions - Only created when API unavailable
- ✅ Mock questions - Demo mode fallback
- ✅ Default UI values (`'INTERMEDIATE'`, `'Beginner'`) - UX fallbacks for missing data

### Test Files (Not deployed to production)
- ✅ `test_profiling_endpoints.py` - Test script with test credentials (stays in repo, not deployed)

## ⚠️ Pre-Production Actions Required

### 1. Environment Configuration
**Action**: Set these in your production environment (Vercel/AWS/etc.):

```bash
# Production .env
NEXT_PUBLIC_DJANGO_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_FASTAPI_API_URL=https://profiler-api.yourdomain.com
NEXT_PUBLIC_FRONTEND_URL=https://app.yourdomain.com

# Database (Django/FastAPI)
DATABASE_URL=postgresql://prod_user:secure_password@prod-host:5432/prod_db
POSTGRES_DB=prod_db_name
POSTGRES_USER=prod_user
POSTGRES_PASSWORD=<strong-password-here>

# Security Keys
SECRET_KEY=<generated-secure-key>
JWT_SECRET_KEY=<generated-jwt-key>

# Email Service
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.yourprovider.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@domain.com
EMAIL_HOST_PASSWORD=<email-password>

# AI Services (if using)
OPENAI_API_KEY=<your-openai-key>

# Redis (for caching/sessions)
REDIS_URL=redis://prod-redis:6379/0
```

### 2. Remove/Secure Test Data
**Action**: In production database:

```sql
-- Remove test accounts
DELETE FROM users WHERE email IN (
  'student@example.com',
  'mentor@example.com', 
  'admin@example.com',
  'director@example.com'
) AND created_at < NOW() - INTERVAL '7 days';

-- Or at minimum, change their passwords
UPDATE users 
SET password = '<hashed-secure-password>'
WHERE email LIKE '%@example.com';
```

### 3. Security Headers & CORS
**Action**: Update Django settings for production:

```python
# settings/production.py
ALLOWED_HOSTS = ['api.yourdomain.com', 'yourdomain.com']
CORS_ALLOWED_ORIGINS = [
    'https://app.yourdomain.com',
]
CORS_ALLOW_CREDENTIALS = True
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

### 4. API Rate Limiting
**Action**: Add rate limiting to prevent abuse:

```python
# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}
```

### 5. Error Tracking
**Action**: Set up Sentry or similar:

```bash
SENTRY_DSN=<your-sentry-dsn>
SENTRY_ENVIRONMENT=production
```

### 6. Database Backups
**Action**: Set up automated backups:
- Daily full backups
- Hourly incremental backups
- Backup retention policy (30 days minimum)

### 7. Monitoring & Logging
**Action**: Configure production logging:
- Application logs → CloudWatch/Datadog/etc.
- Database query monitoring
- API performance metrics
- User activity analytics

## 🚫 Never Deploy to Production

1. **Files to exclude** (add to `.dockerignore` / `.gitignore`):
   - `.env.local` (dev environment)
   - `test_*.py` (test scripts)
   - `*.log` (log files)
   - `__pycache__/`
   - `*.pyc`
   - `node_modules/`
   - `.DS_Store`

2. **Debug modes**:
   ```python
   # settings/production.py
   DEBUG = False
   TEMPLATE_DEBUG = False
   ```

3. **Default credentials**:
   - Change all default passwords
   - Rotate all API keys
   - Generate new SECRET_KEY and JWT_SECRET_KEY

## ✅ Pre-Launch Checklist

- [ ] All environment variables set in production environment
- [ ] Test accounts removed or secured
- [ ] SSL certificates installed and working
- [ ] Database backups configured and tested
- [ ] Error tracking (Sentry) configured
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Monitoring dashboards set up
- [ ] Incident response plan documented
- [ ] Rollback procedure tested

## 📝 Current Status

**Development Environment**: ✅ Properly configured with fallbacks  
**Production Environment**: ⚠️ Needs configuration (see actions above)

**Mock Data Usage**: ✅ Acceptable - Only used as API unavailable fallback  
**Hardcoded Values**: ✅ None in production code paths (all use env vars)  
**Test Credentials**: ✅ Only in test scripts (not in production code)

## 🎯 Summary

Your codebase is **production-ready from a code perspective**. All necessary values use environment variables with sensible development fallbacks. 

**Next Steps:**
1. Configure production environment variables
2. Remove/secure test accounts in production database
3. Complete the pre-launch checklist above
4. Run security audit before launch

---
Generated: 2026-02-05
