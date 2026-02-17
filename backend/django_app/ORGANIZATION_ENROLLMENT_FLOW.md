# Organization Enrollment Flow Documentation

## Where Organization Data is Stored

When enrolling students from an organization in `/dashboard/director/enrollment`:

### 1. Organization Creation/Retrieval
- **Location**: `organizations` table
- **Process**: 
  - User enters organization name (e.g., "Ma") and number of students
  - `handleOrgDetailsSubmit()` creates or finds the organization
  - Organization is stored in `organizations` table with:
    - `id` (primary key)
    - `name` (e.g., "Ma")
    - `slug` (auto-generated from name)
    - `org_type` ('employer')
    - `status` ('active')
    - `owner_id` (the director who created it)

### 2. User-Organization Link
- **Location**: `users.org_id_id` column (Django ForeignKey field)
- **Process**:
  - When creating a user, `enrollSingleStudent()` sets `userData.org_id = enrollmentForm.organizationId`
  - This saves the organization ID to `users.org_id_id` in the database
  - The `org_id` field in the User model is a ForeignKey to `organizations` table

### 3. Display in Table
- **Location**: Frontend enrollment table "Organization" column
- **Process**:
  - `loadData()` fetches all students
  - For each student, it checks `student.org_id` (from UserSerializer)
  - If `org_id` exists, it fetches the organization via `/orgs/${student.org_id}/`
  - The organization name is displayed in the "Organization" column

## Database Schema

```sql
-- Organizations table
CREATE TABLE organizations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    slug VARCHAR(255) UNIQUE,
    org_type VARCHAR(20),
    status VARCHAR(20),
    owner_id BIGINT REFERENCES users(id),
    ...
);

-- Users table (organization link)
-- The org_id ForeignKey creates a column named org_id_id
ALTER TABLE users ADD COLUMN org_id_id BIGINT REFERENCES organizations(id);
```

## Verification Query

To verify organization enrollment:

```sql
-- Check users with organizations
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.org_id_id,
    o.name as organization_name,
    o.org_type
FROM users u
LEFT JOIN organizations o ON u.org_id_id = o.id
WHERE u.org_id_id IS NOT NULL
ORDER BY u.created_at DESC;
```

## Summary

**Organization Name "Ma" goes to:**
1. ✅ `organizations.name` - The organization name is stored here
2. ✅ `users.org_id_id` - Each enrolled student's user record links to the organization via this ForeignKey
3. ✅ Displayed in the "Organization" column of the enrollment table

The organization is properly saved and linked to students when enrolling from an organization.
