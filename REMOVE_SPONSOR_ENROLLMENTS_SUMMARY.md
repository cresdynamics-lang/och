# Remove Sponsor Enrollment Functionality - Summary

## Overview
Sponsors/employers should **only** post jobs and connect with job-ready students through the marketplace. They **cannot** enroll students in cohorts.

## Changes Made

### 1. Database Cleanup SQL
**File:** `backend/django_app/sql/remove_sponsor_enrollments.sql`

**Actions:**
- Converts all `enrollment_type='sponsor'` to `enrollment_type='director'`
- Converts all `seat_type='sponsored'` to `seat_type='scholarship'`
- Deletes all records from `sponsor_student_cohorts` table
- Deletes all records from `sponsor_student_links` table
- Keeps `sponsor_cohort_assignments` (for funding/partnership tracking only)

**To Apply:**
```bash
psql $DATABASE_URL -f backend/django_app/sql/remove_sponsor_enrollments.sql
```

### 2. Backend Model Updates
**File:** `backend/django_app/programs/models.py`
- Removed `'sponsor'` from `ENROLLMENT_TYPE_CHOICES`
- Kept `'sponsored'` in `SEAT_TYPE_CHOICES` (can be used by directors for sponsored seats)

### 3. Backend API Updates
**Files Updated:**
- `backend/django_app/sponsor_dashboard/views.py` - Disabled `seats_assign` endpoint
- `backend/django_app/sponsors/views_api.py` - Disabled `enroll_sponsored_students` endpoint

**Changes:**
- Both endpoints now return 403 Forbidden with message explaining sponsors cannot enroll students

### 4. Frontend Updates
**Files Updated:**
- `frontend/nextjs_app/app/dashboard/director/enrollment/page.tsx` - Removed 'sponsor' from enrollment types
- `frontend/nextjs_app/services/programsClient.ts` - Removed 'sponsor' from Enrollment interface
- `frontend/nextjs_app/app/dashboard/student/settings/profile/page.tsx` - Removed sponsor enrollment display
- `frontend/nextjs_app/app/dashboard/director/cohorts/[id]/enrollments/page.tsx` - Removed 'sponsor' from filter options

### 5. What Remains (Intentionally Kept)
- **Sponsor cohorts** (`sponsor_cohorts` table) - For sponsor's own training programs
- **Sponsor cohort assignments** (`sponsor_cohort_assignments`) - For funding/partnership tracking
- **Marketplace/job posting functionality** - Sponsors can post jobs and connect with students
- **Seat type 'sponsored'** - Directors can still use this for sponsored seats (managed by directors, not sponsors)

## Migration Steps

1. **Run SQL cleanup:**
   ```bash
   psql $DATABASE_URL -f backend/django_app/sql/remove_sponsor_enrollments.sql
   ```

2. **Create Django migration (optional, for tracking):**
   ```bash
   python manage.py makemigrations programs
   python manage.py migrate
   ```

3. **Restart backend services** to apply code changes

## Verification

### Check Database:
```sql
-- Should return 0
SELECT COUNT(*) FROM enrollments WHERE enrollment_type = 'sponsor';
SELECT COUNT(*) FROM enrollments WHERE seat_type = 'sponsored';
SELECT COUNT(*) FROM sponsor_student_links;
SELECT COUNT(*) FROM sponsor_student_cohorts;
```

### Check Code:
- Search for `enrollment_type='sponsor'` - should only appear in migration files
- Search for `enroll_sponsored_students` - should return 403 errors
- Search for `seats_assign` sponsor endpoint - should return 403 errors

## Notes

- **Sponsor role remains** - Sponsors can still access the platform, post jobs, and connect with students
- **Director enrollment** - Directors can still enroll students and assign them sponsored seats
- **Marketplace** - Sponsors can browse and connect with job-ready students through marketplace
- **No data loss** - All sponsor enrollments converted to director enrollments (preserves student records)
