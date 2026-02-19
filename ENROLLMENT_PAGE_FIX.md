# Enrollment Page Fix - Show All Students

## Problem
The frontend enrollment page (`/dashboard/director/enrollment`) was only showing students who were enrolled in cohorts. Students who were created via the enrollment form but not assigned to any cohort were not visible.

## Root Cause
The page was fetching students by iterating through all cohorts and getting their enrollments:
```typescript
// OLD CODE - Only fetched students enrolled in cohorts
const enrollmentPromises = cohortsList.map((cohort: any) =>
  programsClient.getCohortEnrollments(cohort.id)
  // ...
)
```

This approach missed students who:
- Were enrolled via the director enrollment form
- Had subscriptions but no cohort assignments
- Were created through Google SSO but not enrolled in any cohort

## Solution
Updated the frontend to use the correct backend endpoint that returns ALL students with the student role:

**Endpoint:** `GET /api/v1/director/students/`

**Response Format:**
```json
{
  "success": true,
  "students": [
    {
      "id": 1,
      "email": "student@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "sponsor_name": "Sponsor Name",
      "track_key": "defender",
      "track_display": "Defender",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 10
}
```

## Changes Made

### File: `frontend/nextjs_app/app/dashboard/director/enrollment/page.tsx`

**Before:**
- Fetched enrollments from each cohort
- Built student list from cohort enrollments
- Separately fetched students without enrollments from subscriptions

**After:**
- Fetches ALL students from `/api/v1/programs/director/students/`
- Fetches cohort enrollments to supplement student data with cohort information
- Builds a complete student list that includes:
  - Students enrolled in cohorts (with cohort details)
  - Students without cohort enrollments (director-enrolled)
  - All students regardless of enrollment status

## Benefits
1. **Complete Visibility:** Directors can now see ALL students in the system
2. **Correct Endpoint:** Uses the purpose-built endpoint for director student management
3. **Better Performance:** Single endpoint call to get all students instead of multiple cohort queries
4. **Consistent Data:** All students are shown with consistent data structure

## Backend Endpoint Details
The endpoint is defined in `backend/django_app/programs/views/director_students_views.py`:

```python
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsProgramDirector])
def director_students_list(request):
    """Get all students with their sponsor information."""
    # Returns all users with student role
    # Includes sponsor links, track information, and mentor assignments
```

## Testing
After this fix:
1. All students should appear in the enrollment page
2. Students enrolled via Google SSO should be visible
3. Students created through the enrollment form should be visible
4. Students with and without cohort assignments should both appear

## Related Files
- `frontend/nextjs_app/app/dashboard/director/enrollment/page.tsx` - Updated
- `backend/django_app/programs/views/director_students_views.py` - Existing endpoint (no changes needed)
