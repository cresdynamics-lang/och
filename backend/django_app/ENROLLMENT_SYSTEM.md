# Test Users & Enrollment Management System

## 📋 Overview

This system provides comprehensive test data setup for development and testing with support for:

1. **Support Roles** - 6 staff/admin users (admin, director, mentor, sponsor, analyst, finance)
2. **Cohorts** - 2 cohorts for student grouping and management
3. **Students** - 100 students distributed across tracks
4. **Enrollments** - Director-managed student cohort assignments

---

## 🚀 Quick Setup

### 1. Create All Test Data

```bash
cd backend/django_app
python create_comprehensive_test_users.py
```

This creates:
- 6 support role users with appropriate permissions
- 2 cohorts (Cohort 1 & 2)
- 100 students (10 per track, per cohort)
- All enrollments with director assignment

### 2. View Enrollment Utilities

```bash
cd backend/django_app
python enrollment_utils.py
```

This displays:
- All support roles and their status
- Cohort summaries with student distribution
- Available utility functions for enrollment management

---

## 👥 Support Roles

All support users have password: **`testpass123`**

| Role | Email | Scope | Features |
|------|-------|-------|----------|
| **Admin** | admin@test.com | Global | Full system access, superuser |
| **Program Director** | director@test.com | Program | Manage cohorts, enroll students, director dashboard |
| **Mentor** | mentor@test.com | Cohort | View/manage assigned cohort, mentorship |
| **Sponsor Admin** | sponsor@test.com | Organization | Sponsorship management |
| **Analyst** | analyst@test.com | Global | Analytics and reporting |
| **Finance Manager** | finance@test.com | Organization | Billing and finance |

---

## 🎓 Students

**Total**: 100 students  
**Password**: `testpass123` (all students)  
**Email Format**: `student<N>@test.com` where N = 1-100  
**Distribution**:

### Cohort 1 (Students 1-50)
- **Defender Track**: students 1-10
- **Offensive Track**: students 11-20
- **GRC Track**: students 21-30
- **Leadership Track**: students 31-40
- **Innovation Track**: students 41-50

### Cohort 2 (Students 51-100)
- **Defender Track**: students 51-60
- **Offensive Track**: students 61-70
- **GRC Track**: students 71-80
- **Leadership Track**: students 81-90
- **Innovation Track**: students 91-100

### Student Features

✅ Pre-profiled (profiling_complete = True)  
✅ Track recommendations assigned  
✅ Profiler sessions with scores  
✅ Active enrollments via director  
✅ Verified email accounts  
✅ Account status: active

---

## 📚 Files

### Main Scripts

1. **`create_comprehensive_test_users.py`** (320 lines)
   - Creates all test users and enrollments
   - Runs transactions atomically
   - Prints detailed summary

2. **`enrollment_utils.py`** (250 lines)
   - Helper functions for enrollment management
   - Query and modify student enrollments
   - Display cohort and enrollment summaries

3. **`TEST_USERS_README.md`**
   - Detailed documentation
   - API endpoints for enrollment
   - Usage examples and troubleshooting

### Documentation

- **docs1/cookie-sessions.md** - OAuth and session management (recently added)
- **TEST_USERS_README.md** - Comprehensive user guide
- **This file** - Quick reference and overview

---

## 🔧 Enrollment Management

### Python API

```python
from enrollment_utils import *

# Enroll a student in a cohort
enroll_student(1, 1)  # Student 1 to Cohort 1

# Enroll with specific track
enroll_student(5, 1, 'offensive')

# Unenroll a student
unenroll_student(1, 1)

# Transfer between cohorts
transfer_student(1, 1, 2)  # From Cohort 1 to 2

# Get cohort students
students = get_cohort_students(1)

# Get student enrollments
enrollments = get_student_enrollments(1)

# Print summary
print_cohort_summary(1)
```

### HTTP API

**Enroll Student**:
```bash
curl -X POST http://localhost:8000/api/v1/enrollments/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "student_id",
    "cohort_id": "cohort_id",
    "enrollment_type": "director",
    "track_id": "track_id"
  }'
```

**Get Cohort Students**:
```bash
curl http://localhost:8000/api/v1/cohorts/{cohort_id}/students/ \
  -H "Authorization: Bearer <token>"
```

**Update Enrollment Status**:
```bash
curl -X PATCH http://localhost:8000/api/v1/enrollments/{enrollment_id}/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'
```

---

## 🧪 Testing Workflows

### 1. Test Student Login & Profiling

```bash
# Student should see profiler already complete
Email: student1@test.com
Password: testpass123
Expected: Redirect to dashboard (profiling already done)
```

### 2. Test Director Enrollment

```bash
# Login as director
Email: director@test.com
Password: testpass123

# Access director dashboard
URL: http://localhost:3000/dashboard/director

# Manage student enrollments
- View all cohorts
- Add/remove students
- Change tracks
- View enrollment status
```

### 3. Test Admin Access

```bash
# Login as admin
Email: admin@test.com
Password: testpass123

# Access admin panel
URL: http://localhost:3000/admin

# Full system access
```

### 4. Test Mentor Access

```bash
# Login as mentor
Email: mentor@test.com
Password: testpass123

# View cohorts and students
# Provide mentorship
```

---

## 📊 Data Structure

### User Model
```python
{
  'email': 'student1@test.com',
  'username': 'student1',
  'first_name': 'Student',
  'last_name': '1',
  'account_status': 'active',
  'email_verified': True,
  'is_active': True,
  'profiling_complete': True
}
```

### Enrollment Model
```python
{
  'user_id': 'student_id',
  'cohort_id': 'cohort_id',
  'track_id': 'track_id',
  'enrollment_type': 'director',
  'status': 'active',
  'is_current': True,
  'enrollment_date': '2025-01-18T...',
  'enrolled_by_user': 'director_id'
}
```

### ProfilerSession Model
```python
{
  'user_id': 'student_id',
  'status': 'finished',
  'recommended_track_id': 'track_id',
  'aptitude_score': 75.5,
  'track_confidence': 0.87,
  'is_locked': True,
  'completed_at': '2025-01-18T...'
}
```

---

## 🔄 Workflow Examples

### Complete Student Onboarding

```python
# 1. Create student (done by create_comprehensive_test_users.py)
student = User.objects.get(email='student1@test.com')

# 2. Complete profiling (done automatically)
profiler_session = student.profiling_session
# Has: recommended_track, aptitude_score, track_confidence

# 3. Director enrolls student
enrollment = Enrollment.objects.create(
  user=student,
  cohort=cohort,
  track=profiler_session.recommended_track,
  enrollment_type='director',
  status='active',
  enrolled_by_user=director
)

# 4. Student logs in and sees dashboard
# Already profiled, goes straight to dashboard
```

### Transfer Between Cohorts

```python
# 1. Get current enrollment
old_enrollment = Enrollment.objects.get(user=student, cohort=cohort1)

# 2. Create new enrollment
new_enrollment = Enrollment.objects.create(
  user=student,
  cohort=cohort2,
  track=old_enrollment.track,
  enrollment_type='director',
  enrolled_by_user=director
)

# 3. Archive old enrollment
old_enrollment.status = 'completed'
old_enrollment.is_current = False
old_enrollment.save()
```

---

## 🛠️ Maintenance

### Reset All Test Data

```bash
cd backend/django_app
python manage.py shell

# Delete all test users
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> User.objects.filter(email__endswith='@test.com').delete()
>>> exit()

# Recreate
python create_comprehensive_test_users.py
```

### Add More Students to Cohort

```python
from enrollment_utils import enroll_student

# Enroll additional students
for student_num in [101, 102, 103]:
  enroll_student(student_num, 1, 'defender')
```

### Change Student Track

```python
from programs.models import Enrollment, Track

enrollment = Enrollment.objects.get(user_id=1, cohort_id=1)
enrollment.track = Track.objects.get(key='offensive')
enrollment.save()
```

---

## 📝 Notes

- All test users use password: **`testpass123`**
- Students are pre-profiled to skip the onboarding flow
- Enrollment type `'director'` indicates director-managed enrollment
- DirectorProfile is automatically created for program director
- Students receive random profiler scores (60-95) for variance
- All accounts are verified and active by default

---

## 📖 Additional Resources

- [TEST_USERS_README.md](TEST_USERS_README.md) - Detailed guide
- [docs1/cookie-sessions.md](../../docs1/cookie-sessions.md) - OAuth and sessions
- API Documentation: See Django REST framework endpoints at `/api/v1/`

