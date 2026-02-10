# Intermediate Track — Module, Navigation, Roles & Completion Requirements

Canonical checklist for Intermediate Track behaviour. Use **Confirm** when behaviour matches spec, **Align** when the plan is clear, **Implement** when done.

---

## 1. Intermediate Track Module Requirements

| # | Requirement | Spec | Confirm | Align | Implement |
|---|-------------|------|:------:|:-----:|:---------:|
| 1 | Display all learning units | Videos, labs, tasks. | ☐ | ☐ | ☐ |
| 2 | Structured missions | Introduce missions with **multiple subtasks**. | ☐ | ☐ | ☐ |
| 3 | Multi-file mission evidence | Support submission of **multi-file** mission evidence. | ☐ | ☐ | ☐ |
| 4 | Mentor scoring and comments | Allow mentor **scoring** and **comments**. | ☐ | ☐ | ☐ |
| 5 | Multi-day mission deadlines | **Configurable** mission deadlines (multi-day). | ☐ | ☐ | ☐ |
| 6 | Recommended recipes per mission | Display **recommended recipes** for each mission. | ☐ | ☐ | ☐ |
| 7 | Completion tracking | Track completion at **unit**, **module**, and **mission** levels. | ☐ | ☐ | ☐ |
| 8 | Tool guides / integrations | Provide tool guides or integrations (sandbox, cloud, etc.). | ☐ | ☐ | ☐ |
| 9 | Progression flow | **Seamless progression**: module → mission → reflection. | ☐ | ☐ | ☐ |

_Backend alignment: Mission has `subtasks`, `recipe_recommendations`, `time_constraint_hours`; MissionAssignment has `due_date`; MissionProgress has `subtasks_progress` (evidence), `mentor_score`, `final_status`; MissionFile for multi-file evidence. Curriculum ModuleMission links module to Mission._

---

## 2. Navigation Requirements

| # | Requirement | Spec | Confirm | Align | Implement |
|---|-------------|------|:------:|:-----:|:---------:|
| 1 | Persistent left navigation | Modules & missions in **persistent left** nav. | ☐ | ☐ | ☐ |
| 2 | Mission subtasks and progress | Mission nav shows **subtasks** and **progress**. | ☐ | ☐ | ☐ |
| 3 | Jump between content and mission | Learners can jump between **content** and **mission instructions** easily. | ☐ | ☐ | ☐ |
| 4 | Mentor messages prominent | **Display mentor messages prominently**. | ☐ | ☐ | ☐ |

_Implementation: Tier 3 page reuses Tier 2 sidebar pattern; add missions list and mission detail with subtask list; mentor feedback section/sidebar link._

---

## 3. Role-Based Permissions

| Role | Permissions | Confirm | Align | Implement |
|------|-------------|:------:|:-----:|:---------:|
| **Learner** | Submit missions, run practice tasks, view recipes, track progress. | ☐ | ☐ | ☐ |
| **Mentor** | Review missions, score, comment, approve. | ☐ | ☐ | ☐ |
| **Admin** | Manage missions, track analytics, edit content. | ☐ | ☐ | ☐ |
| **Enterprise Supervisor** | View cohort mission completion and skill development. | ☐ | ☐ | ☐ |

_Backend: Mission progress APIs scoped by user/role; mentor review endpoints; cohort-progress API for enterprise (extend tier2 cohort-progress for tier3)._

---

## 4. Completion Logic (Intermediate Track Complete When)

| # | Condition | Confirm | Align | Implement |
|---|-----------|:------:|:-----:|:---------:|
| 1 | **Mandatory modules** completed | ☑ | ☑ | ☑ |
| 2 | **All Intermediate missions** for the track submitted and **passed** | ☑ | ☑ | ☑ |
| 3 | **Reflections** completed (per mission or per track as configured) | ☑ | ☑ | ☑ |
| 4 | **Mentor approval** (if required for the track) | ☑ | ☑ | ☑ |

_Implementation: CurriculumTrack.tier3_require_mentor_approval; UserTrackProgress.tier3_mentor_approval, tier3_completion_requirements_met, tier4_unlocked; check_tier3_completion() in curriculum/models.py; GET tier3/tracks/<code>/status and POST tier3/tracks/<code>/complete._

---

## 5. Quick Reference — Where It Lives

| Item | Backend | Frontend |
|------|---------|----------|
| Learning units (videos, labs, tasks) | Lesson types; CurriculumModule lessons | Tier 3 module viewer (same as Tier 2) |
| Missions with subtasks | missions.Mission (subtasks JSON); MissionProgress (subtasks_progress) | Tier 3 mission list + mission detail with subtasks |
| Multi-file evidence | MissionFile; MissionProgress.subtasks_progress[].evidence | Mission submit UI: upload per subtask |
| Mentor scoring/comments | MissionProgress.mentor_score; CurriculumMentorFeedback or mission feedback | Mentor dashboard; learner “Mentor feedback” view |
| Mission deadlines | MissionAssignment.due_date; Mission.time_constraint_hours | Mission card / detail: show due date |
| Recipes per mission | Mission.recipe_recommendations | Mission detail: “Recommended recipes” |
| Unit/module/mission completion | UserLessonProgress; UserModuleProgress; MissionProgress.final_status | Progress bar; requirement cards; mission status |
| Tool guides / sandbox | Optional: link to lab or external URL on lesson/mission | Link or embed in lesson/mission view |
| Progression module → mission → reflection | Module order; ModuleMission; reflection on MissionProgress | Dashboard flow; “Next: Mission X” / “Reflect” CTA |
| Persistent left nav | — | Tier 3 page: sidebar with modules + missions |
| Mentor messages prominent | GET feedback API | Sidebar “Mentor feedback”; highlight on dashboard |
| Completion logic | UserTrackProgress; check_tier3_completion() | Tier 3 status API; “Complete track” when all met |

---

_Use with `docs/INTERMEDIATE_TRACKS_SPEC.md` and `docs/INTERMEDIATE_TRACKS_TODO.md`._
