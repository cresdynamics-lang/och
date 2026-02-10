# Quick Login & Profiler Access Guide

## 🚀 All Services Running

✅ **Django Backend:** http://localhost:8000  
✅ **FastAPI Profiling:** http://localhost:8001  
✅ **Next.js Frontend:** http://localhost:3000  

---

## 🔐 Login Credentials

### Test User Accounts (Password: `testpass123`)

| Role | Email | Username | Dashboard URL |
|------|-------|----------|---------------|
| **Student** | `student@test.com` | `student` | `/dashboard/student` |
| **Admin** | `admin@test.com` | `admin` | `/dashboard/admin` |
| **Mentor** | `mentor@test.com` | `mentor` | `/dashboard/mentor` |
| **Director** | `director@test.com` | `director` | `/dashboard/director` |
| **Sponsor** | `sponsor@test.com` | `sponsor` | `/dashboard/sponsor` |
| **Analyst** | `analyst@test.com` | `analyst` | `/dashboard/analyst` |
| **Finance** | `finance@test.com` | `finance` | `/dashboard/finance` |

---

## 📋 Login & Profiler Flow

### Step 1: Access Login Page
**URL:** http://localhost:3000/login/student

Or navigate to:
- http://localhost:3000/login/admin (for admin)
- http://localhost:3000/login/mentor (for mentor)
- etc.

### Step 2: Login
1. Enter email: `student@test.com`
2. Enter password: `testpass123`
3. Click "Sign In"

### Step 3: Auto-Redirect to Profiler
After successful login, if profiling is not complete:
- **Automatic redirect** to: http://localhost:3000/onboarding/ai-profiler
- The system checks `user.profiling_complete` flag
- If `false`, redirects to profiler automatically

### Step 4: Complete Profiling
- Answer profiling questions
- Complete all modules
- System will mark `profiling_complete = true`
- Redirects to dashboard after completion

---

## 🎯 Direct Profiler Access

If you're already logged in and want to access profiler directly:

**URL:** http://localhost:3000/onboarding/ai-profiler

**Note:** The profiler will check if you've already completed it. If completed, it will redirect to dashboard.

---

## 🔄 Reset Profiling (For Testing)

To reset a user's profiling status:

```sql
-- Connect to database
PGPASSWORD=postgres psql -U postgres -h localhost -d ongozacyberhub

-- Reset profiling for a user
UPDATE users SET profiling_complete = false WHERE email = 'student@test.com';
```

Or via Django shell:
```python
python3 manage.py shell
from users.models import User
user = User.objects.get(email='student@test.com')
user.profiling_complete = False
user.save()
```

---

## ✅ Verification

After login, you should see:
1. **If profiling incomplete:** Redirected to `/onboarding/ai-profiler`
2. **If profiling complete:** Redirected to `/dashboard/student` (or role-specific dashboard)

---

## 🐛 Troubleshooting

**Issue:** "Profiling service is temporarily unavailable"
- **Solution:** Ensure FastAPI is running on port 8001
- **Check:** `curl http://localhost:8001/health`

**Issue:** Login fails
- **Check:** Django backend is running on port 8000
- **Check:** User account status is `active`
- **Check:** Password is correct (`testpass123`)

**Issue:** Redirect loop
- **Check:** User's `profiling_complete` flag in database
- **Check:** FastAPI profiling service is accessible

---

**Last Updated:** $(date)
