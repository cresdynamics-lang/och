# Implementation Report & Roadmap

Document covering what has been implemented and what is planned next.

---

## What Has Been Implemented

### Tracks & Missions

- **Points in tracks** — Tracks support points; students earn points and progress is tracked per track.
- **Mission unlock by points** — Missions are gated by point thresholds so students unlock content as they reach milestones.
- **Mission strictness** — Stricter rules and validation for mission completion (e.g. requirements, deadlines, approval flows).
- **Mission customization by directors and mentors** — Directors and mentors can customize missions (e.g. criteria, instructions, visibility) within their scope.

### Curriculum & Progress

- **Curriculum progress report** — Reporting on student progress through curriculum (modules, levels, completion).
- **Progress in telemetry** — Progress and activity are captured in telemetry for analytics and dashboards.

### Portfolio & Engagement

- **Portfolio** — Student portfolio to showcase work, achievements, and artifacts.
- **Cohort peers engagement (dynamic)** — Dynamic cohort-level engagement (e.g. peer visibility, activity, collaboration) so students see and interact with cohort peers.

### Mentorship & Assignments

- **Mentor–student assignment** — Assigning mentors to students (e.g. at cohort level).
- **Mentor–track assignment** — Assigning mentors at track level so all students in a track share those mentors.
- **Direct mentor assignment** — Directors can assign a specific mentor directly to a specific student.
- **Mentor review in missions** — Mentors can review, grade, and give feedback on mission submissions.
- **Grading and submission** — Mission submission flow with mentor grading and feedback.
- **Director–mentor communication** — Communication channel or tools between directors and mentors.

### Tracks & Telemetry

- **Changing of tracks** — Students can change track (with appropriate rules and director/mentor visibility).
- **Progress in telemetry** — Progress and key events are sent to telemetry for reporting and dashboards.

### Recipe Engine

- **Recipe engine** — Engine that drives workflows, content, or logic based on rules and conditions.
- **Recipe engine fallback** — When AI is unavailable or fails, the recipe engine falls back to conditional logic so behavior remains deterministic and reliable.

### End-to-End Flow

- **Complete flow from Student–Mentor–Director** — Full flow where students submit work, mentors review and grade, and directors oversee and manage (assignments, tracks, communication, reporting).

### Sponsors & Finance

- **Sponsor team management (External Finance)** — Management of sponsor teams and external finance (e.g. sponsorship, funding, external stakeholders) in the platform.

### Sponsors & Students External Registration

- **Public cohort registration** — Directors publish cohorts to the homepage when creating at `/dashboard/director/cohorts/new`.
- **Publish options** — Checkbox to publish, optional profile image, customizable registration form fields for students and sponsors.
- **Homepage section** — "Apply as Student" and "Join as Sponsor" with cohort cards and director-customizable forms.
- **Public API** — `GET /api/v1/public/cohorts/`, `POST .../apply/student/`, `POST .../apply/sponsor/` (no auth).
- **Testing** — See `PUBLIC_REGISTRATION_TESTING.md`.

---

## What Will Be Done

Planned work (today / next):

- **Full RBAC** — Role-based access control across the platform so permissions are consistent and auditable.
- **MFA** — Multi-factor authentication for secure login.
- **Future Me (Student Control Center)** — Dedicated student area for “Future Me” (goals, reflection, self-directed planning).
- **Subscription** — Subscription and usage/entitlement handling (e.g. plans, limits, upgrades).

---

*This report summarizes implemented features and the current plan for next steps. Update the “What Will Be Done” section as work is completed or priorities change.*
