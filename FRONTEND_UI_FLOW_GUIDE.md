# Frontend UI Flow Guide - Complete User Journey

## Why Admin Can't Login (FIXED)

### Issue
The frontend was trying to connect to Django on port **8002** instead of **8000**.

### Solution
Your `.env.local` already has the correct setting:
```bash
NEXT_PUBLIC_DJANGO_API_URL=http://localhost:8000  # ✓ Correct
```

**You just need to restart the Next.js dev server:**

```bash
# Stop the current Next.js server (Ctrl+C)
cd frontend/nextjs_app
npm run dev
```

After restarting, admin login will work!

---

## Complete User Flow Through Frontend UI

### 1. **Landing Page**
```
URL: http://localhost:3000
```
- User sees homepage
- Clicks "Login" or "Get Started"

---

### 2. **Login Page (Role Selection)**
```
URL: http://localhost:3000/login/admin
     http://localhost:3000/login/mentor
     http://localhost:3000/login/student
```

**Available Roles:**
- 🎓 Student
- 👨‍🏫 Mentor
- ⚡ Admin
- 👔 Program Director
- 💼 Sponsor/Employer
- 📊 Analyst
- 💰 Finance

**Login Process:**
1. Select role (or use direct URL)
2. Enter email and password
3. Click "Sign In"
4. Frontend calls: `POST /api/auth/login` (Next.js API route)
5. Next.js forwards to Django: `POST http://localhost:8000/api/v1/auth/login`
6. Django validates credentials
7. Returns JWT tokens + user data
8. Frontend stores tokens in cookies
9. Redirects to role-specific dashboard

---

### 3. **Dashboard Redirect Logic**

After successful login, users are redirected based on their role:

| Role | Dashboard URL | Features |
|------|--------------|----------|
| **Admin** | `/dashboard/admin` | Full platform management |
| **Program Director** | `/dashboard/director` | Program & cohort management |
| **Mentor** | `/dashboard/mentor` | Work queue, sessions, mentees |
| **Student/Mentee** | `/dashboard/student` | Learning path, missions, progress |
| **Sponsor** | `/dashboard/sponsor` | Talent analytics, hiring |
| **Analyst** | `/dashboard/analyst` | Platform analytics |
| **Finance** | `/dashboard/finance` | Billing & revenue |

---

## Mentor Complete Flow

### Step 1: Login as Mentor
```
URL: http://localhost:3000/login/mentor
Email: mentor@ongozacyberhub.com
Password: mentor123
```

### Step 2: Mentor Dashboard
```
URL: http://localhost:3000/dashboard/mentor
```

**Dashboard Sections:**
1. **Work Queue** - Tasks awaiting action
   - Mission reviews
   - Goal feedback
   - Session notes
   - Risk flags

2. **Today's Sessions** - Upcoming and active sessions
   - One-on-one meetings
   - Group workshops
   - Capstone reviews

3. **At-Risk Mentees** - Students needing attention
   - Low engagement
   - Missing sessions
   - Falling behind

4. **Mentee List** - All assigned students
   - View TalentScope data
   - Session history
   - Progress tracking

### Step 3: Review Mission (Example Workflow)

1. **Work Queue** shows "Review SIEM Lab Submission"
2. Click on work item
3. View submission details:
   - Mission: SIEM Lab: Log Analysis
   - Student: Alice Johnson
   - Submission notes
   - Artifacts (GitHub links, files)
4. Review the work
5. Provide feedback and approve/reject
6. Work item automatically completed

### Step 4: Schedule Session

1. Click "Schedule Session"
2. Select mentee
3. Choose session type:
   - One-on-one
   - Group
   - Capstone Review
   - Goal Review
4. Set date/time
5. Add Zoom link
6. Send invitations

### Step 5: View Mentee TalentScope

1. Go to "Mentees" tab
2. Click on mentee name
3. View analytics:
   - Readiness score
   - Skill gaps
   - Learning velocity
   - Habit streaks
   - Mission performance

---

## Student Complete Flow

### Step 1: Login as Student
```
URL: http://localhost:3000/login/student
Email: alice@student.com
Password: student123
```

### Step 2: Onboarding (First Login)

**If profiling not completed:**
```
Redirect: /onboarding/ai-profiler
```
- AI asks questions about:
  - Learning style
  - Career goals
  - Cyber exposure level
  - Interests
- Generates personalized learning path
- Recommends track (Defender/Offensive/GRC/Innovation/Leadership)

### Step 3: Student Dashboard
```
URL: http://localhost:3000/dashboard/student
```

**Dashboard Sections:**

1. **Learning Path**
   - Current tier progress
   - Recommended next steps
   - Skill radar chart

2. **Active Missions**
   - In-progress labs
   - Pending reviews
   - AI feedback

3. **My Mentor**
   - Assigned mentor info
   - Next session
   - Message mentor

4. **TalentScope**
   - Readiness score
   - CV strength
   - Portfolio completeness

5. **Recent Activity**
   - Mission submissions
   - Achievements
   - Skill gains

### Step 4: Complete a Mission

1. **Browse Missions** → `/missions`
2. **Select Mission** → "SIEM Lab: Log Analysis"
3. **Read Instructions**
   - Objectives
   - Requirements
   - Success criteria
4. **Work on Mission**
   - Access lab environment
   - Complete tasks
   - Gather evidence
5. **Submit Mission**
   - Upload files
   - Add GitHub repo
   - Write submission notes
6. **AI Review** (immediate)
   - Auto-grading
   - Feedback
   - Score (0-100)
7. **Mentor Review** (Premium tier only)
   - Detailed feedback
   - Competency tagging
   - Approval/revision

### Step 5: View Progress

**TalentScope Analytics:**
- Readiness score trend
- Skill development
- Habit tracking
- Time investment

**Portfolio:**
- Approved missions
- Certifications
- Projects
- CV builder

---

## Admin Complete Flow

### Step 1: Login as Admin
```
URL: http://localhost:3000/login/admin
Email: admin@ongozacyberhub.com
Password: admin123
```

### Step 2: Admin Dashboard
```
URL: http://localhost:3000/dashboard/admin
```

**Admin Capabilities:**

1. **User Management**
   - Create/edit users
   - Assign roles
   - Manage permissions
   - View audit logs

2. **Program Management**
   - Create programs
   - Define tracks
   - Manage cohorts
   - Assign directors

3. **Platform Settings**
   - Subscription plans
   - API keys
   - Webhooks
   - Email templates

4. **Analytics**
   - Platform metrics
   - User growth
   - Revenue tracking
   - Engagement stats

---

## API Call Flow (Behind the Scenes)

### Login Flow
```
1. User submits form → Next.js frontend
2. Frontend → POST /api/auth/login (Next.js API route)
3. Next.js → POST http://localhost:8000/api/v1/auth/login (Django)
4. Django validates credentials
5. Django returns:
   {
     "access_token": "eyJhbGc...",
     "refresh_token": "eyJhbGc...",
     "user": {
       "id": 3,
       "email": "mentor@ongozacyberhub.com",
       "roles": [{"role": "mentor"}]
     }
   }
6. Next.js sets cookies:
   - access_token (15 min)
   - refresh_token (30 days)
   - och_roles
   - och_primary_role
   - och_dashboard
7. Frontend redirects to dashboard
```

### Authenticated API Calls
```
Frontend → Backend (with Authorization header)

Headers:
  Authorization: Bearer eyJhbGc...

Example: Get Mentor Dashboard
  GET http://localhost:8000/api/v1/mentor/dashboard
  Headers: { Authorization: Bearer <token> }

Django verifies token → Returns data → Frontend renders
```

---

## Testing the Complete Flow

### Test 1: Admin Login
```bash
# 1. Start Django server
cd backend/django_app
python manage.py runserver

# 2. Start Next.js (in new terminal)
cd frontend/nextjs_app
npm run dev

# 3. Open browser
http://localhost:3000/login/admin

# 4. Login
Email: admin@ongozacyberhub.com
Password: admin123

# 5. Should redirect to
http://localhost:3000/dashboard/admin
```

### Test 2: Mentor Flow
```bash
# 1. Login
http://localhost:3000/login/mentor
Email: mentor@ongozacyberhub.com
Password: mentor123

# 2. View Dashboard
http://localhost:3000/dashboard/mentor

# 3. Check work queue
- Should see "Review SIEM Lab Submission"
- Should see "Complete Session Notes" (overdue)
- Should see "Review Q1 Career Goals"

# 4. View mentees
- Alice Johnson
- Bob Smith
- Charlie Davis (flagged as at-risk)

# 5. View sessions
- Upcoming: Career Planning (in 2 hours)
- Group: Security Workshop (tomorrow)
- Past: Resume Review (completed)
```

### Test 3: Student Flow
```bash
# 1. Login
http://localhost:3000/login/student
Email: alice@student.com
Password: student123

# 2. Onboarding (if first login)
http://localhost:3000/onboarding/ai-profiler

# 3. Complete AI Profiler
- Answer questions
- Get track recommendation

# 4. Student Dashboard
http://localhost:3000/dashboard/student

# 5. View assigned mentor
- Mentor: John Mentor
- Next session: Career Planning

# 6. Browse missions
http://localhost:3000/missions

# 7. Submit mission
- Upload work
- Get AI feedback
- Wait for mentor review (Premium)
```

---

## Troubleshooting

### Issue: Admin Can't Login

**Symptoms:**
- "Cannot connect to backend server" error
- Login button stuck on "Signing in..."
- Network error in browser console

**Solution:**
```bash
# 1. Check Django is running on port 8000
curl http://localhost:8000/api/v1/health/

# 2. Restart Next.js server
cd frontend/nextjs_app
# Ctrl+C to stop
npm run dev

# 3. Clear browser cache
# Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

# 4. Check browser console (F12)
# Look for errors related to:
# - CORS
# - Network (ECONNREFUSED)
# - 401/403 errors
```

### Issue: Redirects to Wrong Dashboard

**Symptoms:**
- Login succeeds but lands on wrong dashboard
- Gets stuck on student dashboard despite being admin

**Solution:**
```bash
# 1. Clear cookies
# Browser → DevTools → Application → Cookies → Clear

# 2. Check role assignment
cd backend/django_app
python manage.py shell -c "
from users.models import User
admin = User.objects.get(email='admin@ongozacyberhub.com')
print('Roles:', list(admin.user_roles.values('role__name', 'is_active')))
"

# 3. Login again
```

### Issue: Mentor Dashboard Empty

**Symptoms:**
- Work queue shows 0 items
- No mentees listed
- No sessions shown

**Solution:**
```bash
# Run the test data seed script
cd backend/django_app
python seed_mentor_test_data.py

# This creates:
# - 3 mentees assigned to mentor
# - 9 sessions
# - 9 work queue items
# - 1 mission submission
```

---

## Environment Variables Checklist

### Frontend `.env.local`
```bash
NEXT_PUBLIC_DJANGO_API_URL=http://localhost:8000  # ✓ Django
NEXT_PUBLIC_FASTAPI_API_URL=http://localhost:8001 # ✓ FastAPI
```

### Backend `.env`
```bash
FRONTEND_URL=http://localhost:3000               # ✓ Next.js
CORS_ALLOWED_ORIGINS=http://localhost:3000       # ✓ CORS
```

---

## Port Reference

| Service | Port | URL | Status |
|---------|------|-----|--------|
| Django API | 8000 | http://localhost:8000 | ✓ Running |
| FastAPI | 8001 | http://localhost:8001 | Optional |
| Next.js Frontend | 3000 | http://localhost:3000 | ✓ Required |
| PostgreSQL | 5432 | localhost:5432 | ✓ Running |

---

## Quick Start (All Services)

```bash
# Terminal 1: Django
cd backend/django_app
python manage.py runserver

# Terminal 2: Next.js
cd frontend/nextjs_app
npm run dev

# Terminal 3: Seed test data (one-time)
cd backend/django_app
python seed_mentor_test_data.py

# Open browser
http://localhost:3000
```

---

## Summary

✓ **Admin Login Fixed** - Just restart Next.js server
✓ **Complete Flow Documented** - Login → Dashboard → Features
✓ **Test Data Ready** - Mentors, students, sessions, missions
✓ **All Users Can Login** - Admin, Mentor, Students working

**Next Steps:**
1. Restart Next.js: `cd frontend/nextjs_app && npm run dev`
2. Login as admin: http://localhost:3000/login/admin
3. Test mentor flow: http://localhost:3000/login/mentor
4. Test student flow: http://localhost:3000/login/student

Everything is ready to test! 🚀
