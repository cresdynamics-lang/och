# Test User System - Quick Start Guide

## 📚 Documentation Files

This system consists of the following documentation files in `backend/django_app/`:

### 1. **ENROLLMENT_SYSTEM.md** ⭐ START HERE
   - Overview of the entire test system
   - Quick setup instructions
   - Support roles and student distribution
   - Workflow examples
   - API reference (Python and HTTP)

### 2. **TEST_USERS_README.md**
   - Detailed credentials for all 106 test users
   - Student naming convention
   - Login instructions for each role
   - API endpoints for enrollment management
   - Troubleshooting guide

### 3. **This File** (GETTING_STARTED.md)
   - Directory of documentation
   - Quick reference for setup
   - Common tasks

---

## 🚀 Getting Started (2 minutes)

### Step 1: Create Test Users

```bash
cd backend/django_app
python create_comprehensive_test_users.py
```

**Output**: 106 test users ready
- 6 support roles
- 100 students (10 per track, per cohort)

### Step 2: View Available Users

```bash
python enrollment_utils.py
```

**Output**: Summary of all users and cohorts

### Step 3: Log In and Test

**Student Login**:
- Email: `student1@test.com`
- Password: `testpass123`
- Expected: Go to dashboard (already profiled)

**Director Login**:
- Email: `director@test.com`
- Password: `testpass123`
- Expected: Director dashboard with enrollment controls

**Admin Login**:
- Email: `admin@test.com`
- Password: `testpass123`
- Expected: Full admin panel

---

## 📖 Test User Credentials

### All Users Password
```
testpass123
```

### Support Roles (6 users)

| Role | Email |
|------|-------|
| Admin | admin@test.com |
| Program Director | director@test.com |
| Mentor | mentor@test.com |
| Sponsor Admin | sponsor@test.com |
| Analyst | analyst@test.com |
| Finance Manager | finance@test.com |

### Students (100 users)

**Format**: `student<N>@test.com` where N = 1 to 100  
**All password**: `testpass123`

**Examples**:
- `student1@test.com` - Cohort 1, Defender Track
- `student50@test.com` - Cohort 1, Innovation Track
- `student51@test.com` - Cohort 2, Defender Track
- `student100@test.com` - Cohort 2, Innovation Track

---

## 🎯 Common Tasks

### Enroll a Student

**Python**:
```python
from enrollment_utils import enroll_student
enroll_student(5, 1)  # Student 5 to Cohort 1
```

**HTTP**:
```bash
curl -X POST http://localhost:8000/api/v1/enrollments/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_id",
    "cohort_id": "cohort_id",
    "enrollment_type": "director",
    "track_id": "track_id"
  }'
```

### Transfer Student Between Cohorts

```python
from enrollment_utils import transfer_student
transfer_student(5, 1, 2)  # Student 5 from Cohort 1 to 2
```

### View Cohort Students

```python
from enrollment_utils import print_cohort_summary
print_cohort_summary(1)  # Show all Cohort 1 students
```

### Get Student Enrollments

```python
from enrollment_utils import get_student_enrollments
enrollments = get_student_enrollments(1)
```

---

## 🔍 Key Features

✅ **Students Pre-Profiled** - Skip onboarding, go straight to dashboard  
✅ **Track Recommendations** - Each student has recommended track assigned  
✅ **Director-Managed** - All enrollments created via director  
✅ **Multiple Cohorts** - 2 cohorts for testing group management  
✅ **Support Roles** - 6 role types with appropriate permissions  
✅ **Real Data** - Random profiler scores for realistic variance  

---

## 📂 Script Files

### `create_comprehensive_test_users.py`
- Creates all test data in one command
- Runs as atomic transaction
- Prints detailed summary
- ~320 lines of code

### `enrollment_utils.py`
- Helper functions for enrollment management
- Print summaries and status
- Useful for shell scripts
- ~250 lines of code

---

## 🧪 Testing Scenarios

### Scenario 1: New Student Registration
1. Login as `student1@test.com`
2. See profiler already complete
3. Go to student dashboard
4. View courses/missions

### Scenario 2: Director Enrollment
1. Login as `director@test.com`
2. Go to Director Dashboard
3. View Cohort 1 students (50 students)
4. Add/remove students
5. Change student tracks

### Scenario 3: Mentor Mentorship
1. Login as `mentor@test.com`
2. View assigned cohorts
3. Send messages to students
4. Track student progress

### Scenario 4: Bulk Enrollments
```python
# Enroll students 1-10 in Cohort 1
for i in range(1, 11):
    enroll_student(i, 1)
```

---

## 💡 Pro Tips

- **Find a student by number**: `student<N>@test.com` where N = 1-100
- **Students in Cohort 1**: students 1-50
- **Students in Cohort 2**: students 51-100
- **All users password**: `testpass123`
- **View summaries**: `python enrollment_utils.py`
- **Reset all**: Delete `@test.com` users, run script again

---

## 📋 File Structure

```
backend/django_app/
├── create_comprehensive_test_users.py  ← Main script
├── enrollment_utils.py                 ← Helper functions
├── ENROLLMENT_SYSTEM.md                ← Full documentation
├── TEST_USERS_README.md                ← Detailed guide
└── GETTING_STARTED.md                  ← This file
```

---

## 🔗 Related Documentation

- [docs1/cookie-sessions.md](../../docs1/cookie-sessions.md) - OAuth & session management
- [Django REST Framework Docs](https://www.django-rest-framework.org/) - API endpoints
- [Next.js Docs](https://nextjs.org/docs) - Frontend authentication

---

## ❓ Frequently Asked Questions

**Q: How do I change a student's track?**
```python
from programs.models import Track, Enrollment
enrollment = Enrollment.objects.get(user_id=1, cohort_id=1)
enrollment.track = Track.objects.get(key='offensive')
enrollment.save()
```

**Q: How do I remove a student from a cohort?**
```python
from enrollment_utils import unenroll_student
unenroll_student(1, 1)
```

**Q: Can I add more students?**
Yes, use the same pattern in `enrollment_utils.py` to create new users and enroll them.

**Q: What if a student is already enrolled?**
The system will skip them and print a warning. They're idempotent.

**Q: Where are students 1-100 distributed?**
- Cohort 1: students 1-50 (10 per track)
- Cohort 2: students 51-100 (10 per track)

---

## 🚀 Next Steps

1. **Run the setup script** → `python create_comprehensive_test_users.py`
2. **View the summary** → `python enrollment_utils.py`
3. **Login and test** → Use credentials from TEST_USERS_README.md
4. **Manage enrollments** → Use enrollment_utils.py functions
5. **Read full docs** → See ENROLLMENT_SYSTEM.md for workflows

---

**Created**: January 18, 2026  
**All test users password**: `testpass123`  
**Questions?** See ENROLLMENT_SYSTEM.md or TEST_USERS_README.md