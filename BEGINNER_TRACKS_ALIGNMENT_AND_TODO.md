# Beginner Tracks (Tier 2) — Alignment & Success-Criteria TODO

This document confirms alignment of the **Beginner Tracks** specification with the codebase. **Success criteria determine** what “done” means; the TODO list is driven by those criteria.

**Canonical spec (exact wording):** `docs/BEGINNER_TRACKS_SPEC.md`  
**UI copy source of truth:** `frontend/nextjs_app/lib/beginnerTracksSpec.ts`

---

## 1. Tier Overview — Alignment

| Spec | Implementation | Status |
|------|----------------|--------|
| Tier 2 = first structured pathway after Foundations | `CurriculumTrack.tier = 2`, `LEVEL_CHOICES` include `beginner` | ✅ Aligned |
| Orientation → competence-building | Flow: track dashboard → modules → quizzes → reflections → mini-missions → completion | ✅ Aligned |
| 5 categories: Defender, Offensive, GRC, Innovation, Leadership | `CurriculumTrack.slug` / `code`: defender, offensive, grc, innovation, leadership; missions/recipes use same track keys | ✅ Aligned |
| Simple, confidence-building, structured, interactive | Tier2 UI: progress bars, requirement cards, sequential unlock, completion screen | ✅ Aligned |

---

## 2. Category Breakdown (5 Beginner Categories) — Alignment

| Category | Backend / Frontend | Status |
|----------|--------------------|--------|
| Beginner — Defender | Track exists; Defender legacy API + tier=2 tracks | ✅ Aligned |
| Beginner — Offensive | Track slug/code; mock API + curriculum tracks | ✅ Aligned |
| Beginner — GRC | Track slug/code; mock level API + curriculum | ✅ Aligned |
| Beginner — Innovation | Track slug/code; mock API + curriculum | ✅ Aligned |
| Beginner — Leadership | Track slug/code; missions/recipes leadership type | ✅ Aligned |
| ~20 beginner videos + quizzes + 1–2 soft missions per category | Model supports modules/lessons/ModuleMission; count per track is data/seed (not hardcoded) | ⚠️ Confirm via seed/content |

---

## 3. User Personas — Alignment

| Persona | How platform supports | Status |
|---------|----------------------|--------|
| Beginner learners (0–1 year) | Tier 2 content, completion logic, progress UI | ✅ Aligned |
| Career switchers | Same track flow; no separate persona-specific logic required | ✅ Aligned |
| Mentors | Mentor view progress, comment on tasks (see §5 Role-Based) | ⚠️ Confirm mentor comment UI/API |
| Administrators | Track analytics, module CRUD (admin) | ⚠️ Confirm analytics endpoints |
| Enterprise partners | Cohort aggregated progress (no personal data unless allowed) | ⚠️ Confirm enterprise API/views |

---

## 4. User Goals & Outcomes — Alignment

| Goal | Implementation | Status |
|------|----------------|--------|
| Understand fundamentals of chosen track | Modules + lessons + quizzes per track | ✅ Aligned |
| Build confidence (quizzes/mini-assessments) | Quiz submission, 70% pass, Tier2 status | ✅ Aligned |
| Prepare for intermediate missions | “Progress to Intermediate” trigger; Tier2 complete → Tier3 unlock | ✅ Aligned |
| First portfolio artifacts | Reflections/mini-missions can feed portfolio; CurriculumActivity | ✅ Aligned |
| Clarity on specializations | Track choice + profiler; no explicit “recommendation” UI in Tier2 | ⚠️ Optional |
| Engage with mentorship | Mentor feedback screen (see §8) | ⚠️ Confirm |

---

## 5. Developer Requirements — Alignment

### Functional Requirements

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Display all modules (videos, text, diagrams) | `CurriculumModule` + `Lesson` (video/quiz/text); module viewer | ✅ Aligned |
| Sequential or flexible (admin-configurable) progression | `order_index`, `is_required`; sequential unlock in UI (previous module complete). No global “flexible mode” flag. | ⚠️ Add admin toggle for “flexible” vs “sequential” if required |
| Track module-level completion | `UserModuleProgress`, `UserTrackProgress` | ✅ Aligned |
| Store quiz results | `UserLessonProgress.quiz_score`, `quiz_attempts`; Tier2 submit-quiz | ✅ Aligned |
| Store short-answer reflection items | `submit-reflection`; count in `tier2_reflections_submitted`; storage in portfolio/activity | ✅ Aligned |
| Submission of beginner mini-missions (optional) | `submit-mini-mission`, `UserMissionProgress`, `tier2_mini_missions_completed` | ✅ Aligned |
| View sample mission reports | Not present in Tier2 UI | ❌ TODO: Add “sample mission report” view |
| Bookmarking or saving lessons | No lesson/bookmark model in curriculum | ❌ TODO: Add lesson bookmark (or “save for later”) |
| “Progress to Intermediate” when completion criteria met | `check_tier2_completion()`; Tier2 complete endpoint; completion screen + redirect | ✅ Aligned |

### Navigation Requirements

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Persistent sidebar with track modules | Tier2 dashboard sidebar (lg+) with modules + Resources + Sample report | ✅ Aligned |
| Return to track dashboard at any time | “Back to Curriculum” + view state `dashboard` | ✅ Aligned |
| Mentor comments on specific tasks (optional) | CurriculumMentorFeedback; GET/POST tier2/tracks/<code>/feedback | ✅ Aligned |
| Smooth handoff to Intermediate (Tier 3) | `tier3_unlocked` in complete response; redirect to curriculum | ✅ Aligned |

### Role-Based Permissions

| Role | Expected | Implementation | Status |
|------|----------|----------------|--------|
| Learner | Full access to track content | Auth + track enrollment; Tier2 views | ✅ Aligned |
| Mentor | View progress, comment on tasks | Tier2 feedback API; mentor POST feedback, GET list | ✅ Aligned |
| Admin | Create/remove modules, track analytics | Django admin (tracks, modules, lessons, bookmarks, feedback); progression_mode in admin | ✅ Aligned |
| Enterprise Partner | Aggregated cohort progress, no personal data unless allowed | GET `/curriculum/tier2/cohort-progress/?cohort_id=` (counts only, no PII) | ✅ Aligned |

---

## 6. Completion Logic — Alignment

Spec: **Beginner Track is complete when**  
- All mandatory modules completed  
- All quizzes passed  
- Minimum number of beginner tasks submitted  
- Mentor approval (optional toggle)

| Criterion | Implementation | Status |
|-----------|----------------|--------|
| All mandatory modules completed | `check_tier2_completion()`: `CurriculumModule` (is_required=True) vs `UserModuleProgress.status='completed'` | ✅ Aligned |
| All quizzes passed | Required quizzes (in required modules) with `quiz_score >= 70` | ✅ Aligned |
| Min beginner tasks (1–2) | `tier2_mini_missions_completed >= min_missions_required`; `min_missions_required = 1` (configurable in code) | ✅ Aligned (make 1–2 configurable in settings) |
| Mentor approval (optional) | `tier2_mentor_approval`; `check_tier2_completion(require_mentor_approval=False)` — toggle not in settings | ⚠️ Add admin/settings toggle for “require_mentor_approval” |

---

## 7. Content Architecture — Alignment

| Content | Implementation | Status |
|---------|----------------|--------|
| ~20 beginner videos, text, diagrams, concept quizzes, reflection prompts, 1–2 mini-missions | Models: CurriculumModule, Lesson (video/quiz), ModuleMission; content is data | ✅ Aligned |
| Portfolio: first artifacts, beginner tasks | Portfolio integration; activity/reflection storage | ✅ Aligned |
| Mentor feedback portal, optional live session | Coaching/sessions exist; Tier2 mentor feedback UI not | ⚠️ Mentor feedback screen |
| Mission prep: preview Intermediate, required recipes list | Recipe recommendations on modules; “Ready for Intermediate” on completion screen | ✅ Aligned |
| Glossary, downloadable cheat sheets, “What to expect next” | Tier2 Resources screen (Glossary, cheat sheets, roadmap) | ✅ Aligned |

---

## 8. Navigation Flow (UX) — Alignment

| Step | Screen / Flow | Status |
|------|----------------|--------|
| 1. Track Dashboard | Tier2 dashboard (modules, progress bar, requirements) | ✅ Aligned |
| 2. Module Viewer | Video + transcript + summary + resources (module viewer) | ✅ Aligned |
| 3. Knowledge Check Quiz | Quiz screen, submit, 70% pass | ✅ Aligned |
| 4. Reflection Submission | Reflection screen, submit, stored | ✅ Aligned |
| 5. Mini-Mission Introduction | Mini-mission preview screen | ✅ Aligned |
| 6. Mini-Mission Submission | Mini-mission submit screen, upload/description | ✅ Aligned |
| 7. Review & Mentor Feedback | Tier2 feedback API; learner GET feedback; mentor POST (feedback on tasks) | ✅ Aligned |
| 8. Beginner Progress Tracker | Dashboard with milestones (requirements cards) | ✅ Aligned |
| 9. Completion → Intermediate | Completion screen; “Ready for Next Level”; complete → Tier3 | ✅ Aligned |

---

## 9. Screens Needed (UI Inventory) — Alignment

| # | Screen | Implementation | Status |
|---|--------|----------------|--------|
| 1 | Beginner Track Landing Page | Tier2 dashboard | ✅ |
| 2 | Module List + Progress Overview | Same (dashboard) | ✅ |
| 3 | Module Viewer (Video + Summary + Resources) | Tier2ModuleViewer | ✅ |
| 4 | Quiz Screen | Tier2QuizScreen | ✅ |
| 5 | Reflection Submission Screen | Tier2ReflectionScreen | ✅ |
| 6 | Mini-Mission Preview Page | Tier2MiniMissionPreview | ✅ |
| 7 | Mini-Mission Submission Page | Tier2MiniMissionSubmit | ✅ |
| 8 | Mentor Feedback Screen | Missing | ❌ TODO |
| 9 | Track Completion Screen | Tier2CompletionScreen | ✅ |
| 10 | Progress Dashboard Screen | Dashboard view | ✅ |
| 11 | Resources/Glossary Screen | Missing | ❌ TODO |
| 12 | “Ready for Intermediate?” Prompt | Completion screen | ✅ |

---

## 10. Data & Telemetry — Alignment

| Metric | Implementation | Status |
|--------|----------------|--------|
| Module completion status | UserModuleProgress, UserTrackProgress | ✅ Aligned |
| Quiz scores | UserLessonProgress.quiz_score | ✅ Aligned |
| Mini-mission attempts | UserMissionProgress.attempts; count in tier2_mini_missions_completed | ✅ Aligned |
| Time spent per module | UserModuleProgress.time_spent_minutes | ✅ Aligned |
| Time spent per lesson | UserLessonProgress.time_spent_minutes | ✅ Aligned |
| Hints/replays | Not stored | ⚠️ Optional |
| Reflection submission | tier2_reflections_submitted + storage | ✅ Aligned |
| Mentor review timestamps | Not on Tier2 mentor feedback | ❌ TODO with mentor feedback |
| Beginner → Intermediate transition | progress.completed_at, CurriculumActivity tier2_completed | ✅ Aligned |
| Video watch % | UserLessonProgress.progress_percentage | ✅ Aligned |
| Quiz retry rate | quiz_attempts | ✅ Aligned |
| Skill mastery (Beginner), drop-off | Analytics/aggregations not fully wired for Tier2 | ⚠️ TODO: Telemetry pipeline for dashboards |

---

## 11. Integration Points — Alignment

| Integration | Implementation | Status |
|-------------|----------------|--------|
| Missions Engine (mini-missions, prepare for Intermediate) | ModuleMission, submit-mini-mission; Tier2 complete unlocks Tier3 | ✅ Aligned |
| Recipe Engine (beginner recipes, required for missions) | CurriculumModule.supporting_recipes; RecipeRecommendation | ✅ Aligned |
| Mentorship (feedback on mini-missions, reflections) | Coaching/reflections; Tier2 mentor feedback not | ❌ TODO |
| Portfolio & Assessment (artifacts, timeline) | Activity/portfolio hooks; Tier2 artifacts stored | ✅ Aligned |
| VIP Leadership Academy (Value → Impact, reflections) | Reflections stored; VIP linkage not explicit in Tier2 | ⚠️ Optional |
| Marketplace Academy (building marketplace-ready artifacts) | Portfolio/artifacts; no Tier2-specific marketplace flag | ✅ Acceptable |
| Enterprise Dashboard (cohort completion, competency) | Cohort/enterprise APIs; Tier2 aggregation not explicit | ❌ TODO |

---

## 12. Success Criteria (Determinants of “Done”)

These criteria determine whether Beginner Tracks are **confirmed and complete**.

### User Experience Success

| Criterion | How to confirm | TODO |
|-----------|----------------|------|
| Learners understand core concepts and enjoy the track | Content quality + UX review; optional post-track survey | Confirm content and flow |
| High completion rate (>75%) | Analytics: track completion_rate per track/cohort | Add Tier2 completion analytics |
| Smooth progression into Intermediate Tracks | E2E: complete Tier2 → Tier3 accessible | Confirm Tier3 gate uses Tier2 completion |
| Increased confidence (post-track self-assessment) | Optional survey/field; not in codebase | Optional: add self-assessment step |

### Platform/Developer Success

| Criterion | How to confirm | TODO |
|-----------|----------------|------|
| All modules load quickly, responsive on all devices | Perf + responsive testing | Confirm in QA |
| Progress data accurately captured | Backend: Tier2 status matches DB; no double-count | Confirm Tier2 status API vs DB |
| Mini-mission submission workflow is solid | Submit mini-mission → count and completion update | Confirm edge cases (duplicate submit, etc.) |
| Mentor feedback loops function reliably | Mentor can see and comment; learner sees comments | Implement mentor feedback loop |
| Track completion triggers Intermediate access automatically | Tier2 complete → tier3_unlocked; curriculum shows Tier3 | Confirm Tier3 unlock in curriculum list |

---

## TODO List (Confirm, Align, Implement)

### Phase 1 — Confirm (verification only)

- [ ] **C1** Confirm Tier2 completion rate is measurable (add or use existing analytics for completion %).
- [ ] **C2** Confirm Tier3 is gated on Tier2 completion in curriculum list and mission eligibility.
- [ ] **C3** Confirm all five track codes (defender, offensive, grc, innovation, leadership) exist for tier=2 and are reachable from curriculum.
- [ ] **C4** Confirm min_missions_required (1 or 2) is documented or configurable (e.g. in settings or per-track).
- [ ] **C5** Confirm mentor approval is not required in production unless product asks (require_mentor_approval=False).

### Phase 2 — Align (config + small changes)

- [x] **A1** Add optional **admin/settings toggle**: “Require mentor approval for Tier2 completion” — **Done**: `CurriculumTrack.tier2_require_mentor_approval` (per-track, admin-configurable).
- [x] **A2** Add optional **admin/settings or per-track**: “Minimum mini-missions required” (1 or 2) — **Done**: `CurriculumTrack.tier2_mini_missions_required` (1 or 2, per-track); Tier2 status API returns `requirements.mini_missions_required` and `requirements.mentor_approval_required`.
- [ ] **A3** Add optional **sequential vs flexible** progression toggle (e.g. when flexible, do not enforce “previous module complete” for unlock).
- [ ] **A4** Ensure **70% quiz pass** threshold is explicit (constant or setting) and consistent in backend and any copy.

### Phase 3 — Implement (missing features)

- [ ] **I1** **Mentor feedback for Tier2**: API for mentor to view Tier2 progress and add comments on tasks/reflections; UI “Mentor Feedback” screen for learner to view comments.
- [ ] **I2** **Enterprise Tier2 aggregation**: Endpoint or dashboard for enterprise partners to see cohort-level Tier2 completion (no PII unless allowed).
- [ ] **I3** **Sample mission report view**: Allow viewing of a sample mission report from Tier2 (link or modal).
- [ ] **I4** **Lesson bookmark / save for later**: Model + API to bookmark or save a lesson; show in Tier2 module viewer.
- [ ] **I5** **Resources/Glossary screen**: Glossary page + optional downloadable cheat sheets + “What to expect next” roadmap for Tier2.
- [ ] **I6** **Telemetry pipeline**: Ensure Tier2 metrics (module time, quiz retries, completion, drop-off) feed learner and enterprise dashboards.

### Phase 4 — Success criteria verification

- [ ] **S1** Run E2E: Foundations → Tier2 track → complete all requirements → complete Tier2 → Tier3 visible and accessible.
- [ ] **S2** Verify Tier2 status API returns correct counts (modules, quizzes, mini-missions, reflections) and `can_progress_to_tier3` matches backend completion logic.
- [ ] **S3** Document or add a simple “Tier2 completion rate” report (by track and optionally by cohort) for >75% success criterion.

---

## Summary

- **Already aligned**: Tier overview, 5 categories, completion logic (mandatory modules, quizzes, min mini-missions, optional mentor approval in DB), navigation flow (dashboard → module → quiz → reflection → mini-mission → completion), most screens, progress and time tracking, Missions/Recipe/Portfolio integration, “Progress to Intermediate” trigger.
- **To confirm**: Tier3 gating, track codes, configurable min missions and mentor approval, analytics for completion rate.
- **To align**: Mentor approval toggle, min missions 1–2 config, optional flexible progression, 70% threshold.
- **To implement**: Mentor feedback loop, enterprise Tier2 aggregation, sample mission report, lesson bookmark, glossary/cheat sheets/roadmap, telemetry for dashboards.

**Success criteria** (high completion rate, accurate progress, solid mini-mission flow, reliable mentor feedback, automatic Intermediate unlock) are the determinants; the TODO list above is ordered to confirm first, then align, then implement, then verify success criteria.
