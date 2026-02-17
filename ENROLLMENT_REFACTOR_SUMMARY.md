# Enrollment Refactor Summary

## Changes Made

### 1. Gender Field Addition

**Files Created:**
- `backend/django_app/sql/add_gender_field_to_users.sql`

**Files Modified:**
- `backend/django_app/users/models.py` - Added `gender` field to User model

**SQL File:**
- Adds `gender` column to `users` table
- Values: `male`, `female`, `other`, `prefer_not_to_say` (optional/nullable)
- Includes check constraint and index

**To Apply:**
```bash
psql $DATABASE_URL -f backend/django_app/sql/add_gender_field_to_users.sql
# OR
python manage.py dbshell < backend/django_app/sql/add_gender_field_to_users.sql
```

### 2. Subscription Permissions for Directors

**Files Created:**
- `backend/django_app/sql/add_subscription_permissions_for_directors.sql`

**Files Modified:**
- `backend/django_app/users/models.py` - Added `subscription` to RESOURCE_TYPES
- `backend/django_app/subscriptions/admin_views.py` - Added `IsAdminOrDirector` permission class and updated `UserSubscriptionAdminViewSet` to use it

**SQL File:**
- Creates 6 subscription permissions: `create_subscription`, `read_subscription`, `update_subscription`, `delete_subscription`, `list_subscriptions`, `manage_subscriptions`
- Assigns subscription management permissions to `program_director` role
- Also grants `read_billing` permission for context

**To Apply:**
```bash
psql $DATABASE_URL -f backend/django_app/sql/add_subscription_permissions_for_directors.sql
# OR
python manage.py dbshell < backend/django_app/sql/add_subscription_permissions_for_directors.sql
```

### 3. Self-Enrolled Students Detection

**Files Modified:**
- `frontend/nextjs_app/app/dashboard/director/enrollment/page.tsx`

**Changes:**
- Updated logic to identify self-enrolled students as:
  1. Students with `enrollment_type='self'` in their enrollments (already included)
  2. Students with no enrollments at all (they created their own account, no director added them)

**Logic:**
- Self-enrolled students are those who don't have any enrollments created by a director
- They are identified by the absence of enrollments (no `added_by` field needed - enrollment_type handles this)
- All students with student role but no enrollments are considered self-enrolled

### 4. Enrollment Form Updates

**Files Modified:**
- `frontend/nextjs_app/app/dashboard/director/enrollment/page.tsx`

**Changes:**
- Gender field is now saved when creating users
- Form includes all required fields: First Name, Last Name, Email, Gender (optional), Phone (optional), Country (optional), Subscription Tier (required)

## Database Migration Steps

1. **Add Gender Field:**
   ```bash
   psql $DATABASE_URL -f backend/django_app/sql/add_gender_field_to_users.sql
   ```

2. **Add Subscription Permissions:**
   ```bash
   psql $DATABASE_URL -f backend/django_app/sql/add_subscription_permissions_for_directors.sql
   ```

3. **Create Django Migration (optional, for Django migration tracking):**
   ```bash
   python manage.py makemigrations users
   python manage.py makemigrations subscriptions
   python manage.py migrate
   ```

## Verification Queries

### Check Gender Field:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'gender';
```

### Check Subscription Permissions:
```sql
SELECT r.name AS role_name, p.name AS permission_name, p.resource_type, p.action
FROM roles r
JOIN roles_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'program_director' AND p.resource_type = 'subscription'
ORDER BY p.action;
```

## Notes

- Gender field is optional and can be NULL
- Subscription permissions allow directors to manage user subscriptions via the admin endpoint
- Self-enrolled students are automatically detected and displayed in the enrollment page
- All changes are backward compatible (existing data remains valid)
