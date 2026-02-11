# Mentorship Auto-Match & Registry API

## Base paths

- Cohorts: **`/api/v1/cohorts/`** (not `/programs/cohorts/`).
- Mentorship registry: **`/api/v1/mentorship/registry`**.

## Cohort mentors

- **GET** `/api/v1/cohorts/{id}/mentors/` — List mentors for the cohort.
- **POST** `/api/v1/cohorts/{id}/mentors/` — Assign one mentor. Body: `mentor` or `mentor_id` (required), `role` (optional). Resolve user by integer `id` or `uuid_id`; require `is_mentor=True`. Directors/admins only.
- **POST** `/api/v1/cohorts/{id}/mentors/auto-match/` — Auto-assign up to 20 mentors. Body: `track_id`, `role`. Prefer `track_key` match and lower workload (`cohort_count`). Directors/admins only.

## Cohort enrollments

- **GET** `/api/v1/cohorts/{id}/enrollments/` — Enrollments for the cohort (for mentor UI “Enrolled Students”). Uses existing mentor permission (cohort must be assigned to mentor).

## Mentorship registry

- **GET** `/api/v1/mentorship/registry` — Mentor pool for directors/admins. Query params: `track_id`, `track_key`, `has_availability`. Returns mentors with `id`, `uuid_id`, `email`, `name`, `track_key`, `mentor_availability`, `mentor_specialties`, `mentor_capacity_weekly`, `cohort_count` (workload).

## Permissions & privacy

- Directors/admins: full access to cohorts, mentors, enrollments, and registry.
- Mentors: list/retrieve only for cohorts they are assigned to (via `MentorAssignment`); no registry access.
