# Test Users Setup Guide

## Overview

The `create_comprehensive_test_users.py` script creates a complete test environment for development and testing with:

- **Support Roles**: Admin, Program Director, Mentor, Sponsor Admin, Analyst, Finance
- **Cohorts**: 2 cohorts for student management
- **Students**: 100 students across multiple tracks (10 students per track per cohort)
- **Enrollments**: All students properly enrolled via director

## Quick Start

### Run the Script

```bash
cd backend/django_app
python create_comprehensive_test_users.py
```

### Output

The script prints a summary of all created users with credentials:

```
======================================================================
✅ TEST USERS CREATED SUCCESSFULLY
======================================================================

🔐 SUPPORT ROLES (Staff & Administrators)
------

  Admin:
    Email:    admin@test.com
    Password: testpass123
    Scope:    global

  Program Director:
    Email:    director@test.com
    Password: testpass123
    Scope:    program

  ... (etc for mentor, sponsor, analyst, finance)

📊 STUDENT SUMMARY
  Total Students Created:  100
  Total Enrollments:       100
  Cohorts:                 2 (Cohort 1, Cohort 2)
  Tracks per Cohort:       5
  Students per Track:      10
```

## Created Users

### Support Roles (6 users)

| Role | Email | Username | Password | Scope |
|------|-------|----------|----------|-------|
| Admin | admin@test.com | admin | testpass123 | global |
| Program Director | director@test.com | director | testpass123 | program |
| Mentor | mentor@test.com | mentor | testpass123 | cohort |
| Sponsor Admin | sponsor@test.com | sponsor | testpass123 | organization |
| Analyst | analyst@test.com | analyst | testpass123 | global |
| Finance Manager | finance@test.com | finance | testpass123 | organization |

### Students (100 total)

**Email Format**: `student<N>@test.com` where N = 1 to 100  
**Password**: `testpass123` (for all students)  
**Username Format**: `student<N>`

**Distribution**:
- **Cohort 1**: 50 students
  - 10 students per track (defender, offensive, grc, leadership, innovation)
- **Cohort 2**: 50 students
  - 10 students per track

**Examples**:
- `student1@test.com` - Cohort 1, Defender Track
- `student11@test.com` - Cohort 1, Offensive Track
- `student51@test.com` - Cohort 2, Defender Track
- `student100@test.com` - Cohort 2, Innovation Track

## Features

### Student Profile Data

All students are automatically provisioned with:

- ✅ **Pre-profiled**: `profiling_complete = True`
- ✅ **Track Recommendations**: Each student has a recommended track assigned
- ✅ **Profiler Session**: Complete with scores and behavioral profile
- ✅ **Cohort Enrollment**: Via director enrollment type
- ✅ **Account Status**: Active and verified
- ✅ **Enrollment Status**: Active in assigned cohort

### Support Role Features

**Admin** (`admin@test.com`):
- Full system access
- Superuser privileges
- Can manage all resources

**Program Director** (`director@test.com`):
- Can manage cohorts
- Can enroll/unenroll students
- DirectorProfile created automatically
- Access to director dashboard

**Mentor** (`mentor@test.com`):
- Can view assigned cohorts
- Can provide mentorship
- Limited to assigned cohorts

**Sponsor Admin** (`sponsor@test.com`):
- Organization scope
- Can manage sponsorship features

**Analyst** (`analyst@test.com`):
- Global scope for data analysis
- Staff access for reporting

**Finance Manager** (`finance@test.com`):
- Organization scope
- Can manage billing and finance

## API Endpoints for Enrollment Management

### Director Enrollment Management

```bash
# List students in a cohort
GET /api/v1/cohorts/{cohort_id}/students/

# Get student enrollments
GET /api/v1/students/{student_id}/enrollments/

# Create enrollment (director)
POST /api/v1/enrollments/
{
  "user_id": "student_id",
  "cohort_id": "cohort_id",
  "enrollment_type": "director",
  "track_id": "track_id"
}

# Update enrollment status
PATCH /api/v1/enrollments/{enrollment_id}/
{
  "status": "active|suspended|completed"
}

# Remove student from cohort
DELETE /api/v1/enrollments/{enrollment_id}/
```

### Student Track Assignment

All students have track recommendations assigned during profiling:

```bash
# Get student profile
GET /api/v1/students/{student_id}/profile/

# Response includes:
{
  "profiling_session": {
    "recommended_track": "defender|offensive|grc|leadership|innovation",
    "aptitude_score": 85.5,
    "track_confidence": 0.92
  }
}
```

## Login and Testing

### Test Using Frontend

1. Go to `http://localhost:3000/login/student`
2. Login with any student email and password: `testpass123`
3. You'll be redirected to the profiler (already complete)
4. Then to your student dashboard

### Test Director Features

1. Go to `http://localhost:3000/login/director`
2. Login with:
   - Email: `director@test.com`
   - Password: `testpass123`
3. Access the Director Dashboard
4. Manage student enrollments

### Test Admin Features

1. Go to `http://localhost:3000/admin`
2. Login with:
   - Email: `admin@test.com`
   - Password: `testpass123`
3. Full admin panel access

## Student Naming Convention

Students are numbered sequentially across two cohorts:

**Cohort 1** (students 1-50):
- Defender Track: students 1-10
- Offensive Track: students 11-20
- GRC Track: students 21-30
- Leadership Track: students 31-40
- Innovation Track: students 41-50

**Cohort 2** (students 51-100):
- Defender Track: students 51-60
- Offensive Track: students 61-70
- GRC Track: students 71-80
- Leadership Track: students 81-90
- Innovation Track: students 91-100

## Resetting Test Data

If you need to reset and recreate all test users:

```bash
# Delete all test data (careful!)
python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> User.objects.filter(email__endswith='@test.com').delete()

# Then run the script again
python create_comprehensive_test_users.py
```

## Notes

- All test passwords are `testpass123`
- Students are pre-profiled to skip profiling page (optional for testing)
- Enrollments are created with `enrollment_type='director'` to track director-managed enrollments
- DirectorProfile is automatically created for program director user
- All students have active status and verified email
- Random profiler scores (60-95) for realistic variance

## Troubleshooting

**Students not appearing in cohort**:
- Check enrollment status: `Enrollment.objects.filter(cohort_id=<cohort_id>)`
- Verify `status='active'` and `is_current=True`

**Director can't see students**:
- Verify director has `DirectorProfile` created
- Check director role has `scope='program'`
- Ensure students are enrolled with `enrollment_type='director'`

**Login failures**:
- Verify user status: `User.objects.get(email='student1@test.com').account_status`
- Should be `'active'`

