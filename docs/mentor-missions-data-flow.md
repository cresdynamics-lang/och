# Mentor Missions Page – Where the Data Comes From

This doc explains how **http://localhost:3000/dashboard/mentor/missions** gets its data and why you might see "No missions pending review", "No missions found in your assigned cohorts", or "No capstones pending scoring."

---

## 1. Mission Review Inbox ("No missions pending review")

### Frontend
- **Component:** `MissionsPending` (`frontend/nextjs_app/components/mentor/MissionsPending.tsx`)
- **Hook:** `useMentorMissions(mentorId, { status: 'pending_review', limit, offset })`
- **Client:** `mentorClient.getMissionSubmissionQueue(mentorId, params)`
- **API:** `GET /api/v1/mentors/{mentor_id}/missions/submissions?status=pending_review&limit=10&offset=0`

### Backend
- **View:** `mentor_mission_submissions` in `backend/django_app/mentorship_coordination/views.py` (the **second** definition, ~line 2151; it overrides the first).
- **Logic:**
  1. Resolve mentor from authenticated user.
  2. Get mentee user IDs from **MenteeMentorAssignment** where `mentor=mentor` and `status='active'`.
  3. Map those user IDs to UUIDs via **User** (`uuid_id`).
  4. Query **MissionSubmission** (missions app) where `student_id` is in those UUIDs.
  5. If `status=pending_review`: filter to `status__in=['submitted', 'ai_reviewed']`.
  6. Return paginated list (id, mission_title, mentee_name, status, submitted_at, etc.).

### Why it’s empty
- **No active mentor–mentee links:** The mentor has no rows in **MenteeMentorAssignment** with `status='active'`, so there are no mentees.
- **No submissions in review:** Assigned mentees have no **MissionSubmission** in status `submitted` or `ai_reviewed`.

**Data sources:** `mentorship_coordination.MenteeMentorAssignment`, `users.User`, `missions.MissionSubmission` (and related `MissionAssignment`, `Mission`).

---

## 2. Cohort Missions ("No missions found in your assigned cohorts")

### Frontend
- **Page:** `MissionsPageInner` in `frontend/nextjs_app/app/dashboard/mentor/missions/page.tsx`
- **Client:** `mentorClient.getCohortMissions(mentorId, { page, page_size, difficulty, track, search })`
- **API:** `GET /api/v1/mentors/{mentor_id}/missions/cohorts?page=1&page_size=20&...`

### Backend
- **View:** `mentor_cohort_missions` in `backend/django_app/mentorship_coordination/views.py` (~line 707).
- **Logic:**
  1. Get cohort IDs from **MentorAssignment** (programs app) where `mentor=mentor` and `active=True`.
  2. From those cohorts, get **Track** keys (e.g. `defender`, `builder`).
  3. Query **Mission** (missions app) where `is_active=True` and `track_id` is in those track keys.
  4. Apply query params: `difficulty`, `track`, `search`; paginate with `page` / `page_size`.
  5. Serialize with **MissionSerializer** (with track/program context) and return `{ results, count, total, page, page_size, has_next, has_previous }`.

### Why it’s empty
- **No cohort assignment:** The mentor has no **MentorAssignment** (programs) with `active=True` for any cohort.
- **No missions for those tracks:** The cohorts’ tracks have no **Mission** rows with `is_active=True` and matching `track_id` (track key).

**Data sources:** `programs.MentorAssignment`, `programs.Cohort`, `programs.Track`, `missions.Mission`, `missions.serializers.MissionSerializer`.

---

## 3. Capstone Projects ("No capstones pending scoring")

### Frontend
- **Page:** same `MissionsPageInner`; `loadCapstones()` calls `mentorClient.getCapstoneProjects(mentorId, { status: 'pending_scoring' })`
- **API:** `GET /api/v1/mentors/{mentor_id}/capstones?status=pending_scoring`

### Backend
- **View:** `mentor_capstones` in `backend/django_app/mentorship_coordination/views.py` (~line 142).
- **Logic:**
  1. Get mentee user IDs from **MenteeMentorAssignment** where `mentor_id=mentor_id` and `status='active'`.
  2. Map to user UUIDs via **User** (`uuid_id`).
  3. Query **MissionSubmission** where:
     - `student_id` in those UUIDs
     - `status='submitted'`
     - `assignment__mission__mission_type='capstone'`
  4. If `status=pending_scoring`: also filter `reviewed_at__isnull=True`.
  5. Return list of capstone summaries (id, title, mentee_name, submitted_at, rubric_id).

### Why it’s empty
- **No active mentor–mentee links:** Same as Mission Review – no **MenteeMentorAssignment** with `status='active'`.
- **No capstone submissions:** Assigned mentees have no **MissionSubmission** that is `submitted` and linked to a **Mission** with `mission_type='capstone'`.
- **All scored:** Every such submission has `reviewed_at` set (so none are "pending scoring").

**Data sources:** `mentorship_coordination.MenteeMentorAssignment`, `users.User`, `missions.MissionSubmission`, `missions.MissionAssignment`, `missions.Mission`.

---

## Summary Table

| Section            | API path                                      | Main backend view              | Key data sources                                                                 |
|--------------------|-----------------------------------------------|---------------------------------|-----------------------------------------------------------------------------------|
| Mission Review     | `GET …/mentors/{id}/missions/submissions`      | `mentor_mission_submissions`   | MenteeMentorAssignment, User, MissionSubmission                                  |
| Cohort Missions    | `GET …/mentors/{id}/missions/cohorts`         | `mentor_cohort_missions`      | MentorAssignment (programs), Cohort, Track, Mission                                |
| Capstone Projects  | `GET …/mentors/{id}/capstones`                | `mentor_capstones`             | MenteeMentorAssignment, User, MissionSubmission (capstone missions)               |

---

## Two different “mentor assignment” concepts

- **MenteeMentorAssignment** (mentorship_coordination): direct mentor–mentee link. Drives **Mission Review** and **Capstone** (who has submissions to review / capstones to score).
- **MentorAssignment** (programs): mentor assigned to a **cohort**. Drives **Cohort Missions** (which track’s missions the mentor can see).

To see data on the mentor missions page you typically need:
1. **Mission Review / Capstones:** At least one **MenteeMentorAssignment** with `mentor` = you and `status='active'`, and those mentees to have the right submissions.
2. **Cohort Missions:** At least one **MentorAssignment** (programs) with that mentor and `active=True` on a cohort whose track has **Mission**s with `is_active=True` and matching `track_id`.
