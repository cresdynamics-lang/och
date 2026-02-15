# Public Registration — Sponsors & Students

Testing documentation for the external registration flow: directors publish cohorts to the homepage, and students/sponsors can apply without going through the internal dashboard.

---

## Overview

- **Director** creates a cohort at `/dashboard/director/cohorts/new`
- **Publish to homepage**: Director chooses whether the cohort appears on the public homepage
- **Profile image**: Optional cohort image shown on the homepage
- **Customizable forms**: Director defines which fields students and sponsors enter when applying
- **Homepage**: "Apply as Student" and "Join as Sponsor" allow public registration without login

---

## Prerequisites

1. **Services running**
   - Django backend: `http://localhost:8000`
   - Next.js frontend: `http://localhost:3000`
   - Database migrated: `python manage.py migrate` (includes migration `0016_cohort_public_registration`)

2. **Test data**
   - At least one Program
   - At least one Track
   - A director/admin user

---

## Test Scenarios

### 1. Director Creates a Cohort with Publish Options

**Steps**

1. Log in as a director (or admin).
2. Go to `http://localhost:3000/dashboard/director/cohorts/new`.
3. Complete the cohort form:
   - Program and Track
   - Cohort name
   - Start/end dates
   - Mode, seat capacity, etc.
4. In **Publish to Homepage**:
   - Check "Publish this cohort to the homepage".
   - (Optional) Upload a profile image.
   - Confirm default form fields for student and sponsor.
5. Submit the form.

**Expected**

- Cohort is created.
- Redirect to `/dashboard/director/cohorts`.
- Cohort record includes `published_to_homepage: true` and optional `profile_image`.

**API**

- `POST /api/v1/cohorts/` with `published_to_homepage: true`, `profile_image` (if used), and `registration_form_fields`.

---

### 2. Homepage Shows Published Cohorts

**Steps**

1. Open `http://localhost:3000` in an incognito/private window (unauthenticated).
2. Scroll to the **"Apply to a Cohort"** section.
3. Confirm published cohorts are listed as cards.

**Expected**

- Section is visible when at least one cohort is published.
- Each card shows:
  - Cohort name
  - Track and program
  - Start/end dates
  - Enrollment count / seat cap
  - Profile image if set
- Buttons: "Apply as Student" and "Join as Sponsor".

**API**

- `GET /api/v1/public/cohorts/` (no auth).
- Returns `{ cohorts: [...] }` for published cohorts.

---

### 3. Student Application

**Steps**

1. On the homepage, click **"Apply as Student"** on a cohort card.
2. Fill the form with:
   - First Name, Last Name
   - Email (required)
   - Phone (optional, if configured)
3. Submit.

**Expected**

- Success message.
- New record in `CohortPublicApplication` with `applicant_type: 'student'` and `status: 'pending'`.

**API**

- `POST /api/v1/public/cohorts/{cohort_id}/apply/student/` with `{ form_data: { first_name, last_name, email, ... } }`.

---

### 4. Sponsor Registration

**Steps**

1. On the homepage, click **"Join as Sponsor"** on a cohort card.
2. Fill the form with:
   - Organization Name
   - Contact Name
   - Contact Email (required)
   - Phone (optional, if configured)
3. Submit.

**Expected**

- Success message.
- New record in `CohortPublicApplication` with `applicant_type: 'sponsor'` and `status: 'pending'`.

**API**

- `POST /api/v1/public/cohorts/{cohort_id}/apply/sponsor/` with `{ form_data: { org_name, contact_name, contact_email, ... } }`.

---

### 5. Director Reviews Applications

**Steps**

1. Log in as admin.
2. Go to Django Admin: `http://localhost:8000/admin/`.
3. Open **Programs → Cohort public applications**.

**Expected**

- List of applications with cohort, applicant type, status, form data, and timestamps.
- Ability to filter by type (student/sponsor) and status.

---

### 6. Custom Form Fields

**Steps**

1. Create a cohort and enable "Publish to Homepage".
2. Inspect `registration_form_fields` in the payload or in the database.
3. Default structure:
   - Student: `first_name`, `last_name`, `email`, `phone`
   - Sponsor: `org_name`, `contact_name`, `contact_email`, `phone`

**Expected**

- Forms on the homepage render the configured fields.
- Required fields are enforced.
- Submitted `form_data` matches the configured schema.

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/public/cohorts/` | No | List published cohorts |
| POST | `/api/v1/public/cohorts/{id}/apply/student/` | No | Submit student application |
| POST | `/api/v1/public/cohorts/{id}/apply/sponsor/` | No | Submit sponsor interest |
| POST | `/api/v1/cohorts/` | Yes (Director) | Create cohort (incl. publish options) |

---

## Database

**Migration**: `programs/migrations/0016_cohort_public_registration.py`

**New/Updated tables**

- `cohorts`: `published_to_homepage`, `profile_image`, `registration_form_fields`
- `cohort_public_applications`: stores student and sponsor applications

---

## Troubleshooting

1. **Published cohorts not visible**
   - Verify `published_to_homepage=True` and cohort status is `draft`, `active`, or `running`.
   - Call `GET /api/v1/public/cohorts/` directly to confirm response.

2. **Profile image not shown**
   - Ensure `MEDIA_URL` and `MEDIA_ROOT` are set.
   - Check that the image is uploaded under `cohorts/profile_images/`.

3. **Applications not created**
   - Inspect `POST` request body and server logs.
   - Ensure `email` (student) or `contact_email` (sponsor) is present.

4. **CORS**
   - Ensure Django CORS settings allow the frontend origin.
