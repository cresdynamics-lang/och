# Intermediate Tracks — Content Architecture & Navigation Flow TODO

Confirm / Align / Implement checklist for **content architecture** and **step-by-step navigation (UX)**. Use with `INTERMEDIATE_TRACKS_SPEC.md` and `INTERMEDIATE_TRACK_REQUIREMENTS.md`.

---

## 1. Content Architecture

### 1.1 Core Learning Content

| # | Item | Spec | Confirm | Align | Implement |
|---|------|------|:------:|:-----:|:---------:|
| 1 | **20 intermediate-level videos per track** | Each Intermediate track has ~20 video lessons. | ☑ | ☑ | ☑ |
|   | _Notes_ | seed_all_tracks: Tier 3 gets 4 modules × 5 video lessons = 20 videos per track. Run seed_placeholder_videos to set content_url. | | | Done. |
| 2 | **Hands-on tutorials** | Lesson type or content: hands-on tutorial. | ☐ | ☐ | ☐ |
| 3 | **Tool usage demonstrations** | Video or guide demonstrating tool usage. | ☐ | ☐ | ☐ |
| 4 | **Playbook walkthroughs** | Playbook-style step-by-step content. | ☐ | ☐ | ☐ |
| 5 | **Step-by-step guides** | Guide/reading lessons with clear steps. | ☐ | ☐ | ☐ |
|   | _Implementation_ | Lesson types: video, guide, lab; content_url and description per lesson. Tier 3 modules include mix of video + guide + lab. | | | |

### 1.2 Assessments

| # | Item | Spec | Confirm | Align | Implement |
|---|------|------|:------:|:-----:|:---------:|
| 1 | **Multi-step scenario quizzes** | Quizzes with multiple steps or scenario-based questions. | ☐ | ☐ | ☐ |
| 2 | **Hands-on practice tasks** | Lab or task lessons; completion tracked. | ☐ | ☐ | ☐ |
| 3 | **Peer or mentor-reviewed assignments (optional)** | Optional assignments with review workflow. | ☐ | ☐ | ☐ |
|   | _Implementation_ | Lesson type quiz + assessment; MissionProgress.mentor_score and review flow for missions. | | | |

### 1.3 Missions

| # | Item | Spec | Confirm | Align | Implement |
|---|------|------|:------:|:-----:|:---------:|
| 1 | **3–5 full intermediate missions per track** | Each Tier 3 track has 3–5 full missions (Missions Engine). | ☐ | ☐ | ☐ |
| 2 | **Story context** | Mission has story/narrative. | ☐ | ☐ | ☐ |
| 3 | **Objectives** | Mission has objectives list. | ☐ | ☐ | ☐ |
| 4 | **Subtasks** | Mission has subtasks (multiple steps). | ☐ | ☐ | ☐ |
| 5 | **Evidence deliverables** | Subtasks require evidence (multi-file). | ☐ | ☐ | ☐ |
| 6 | **Success criteria** | Mission has success criteria. | ☐ | ☐ | ☐ |
| 7 | **Recipes support list** | Mission has recipe_recommendations; displayed on mission screens. | ☐ | ☐ | ☐ |
|   | _Implementation_ | Mission model: story, objectives, subtasks, success_criteria, recipe_recommendations; MissionProgress.subtasks_progress (evidence). | | | |

### 1.4 Recipes

| # | Item | Spec | Confirm | Align | Implement |
|---|------|------|:------:|:-----:|:---------:|
| 1 | **Highlighted recipes for each mission** | Each mission shows recommended recipes. | ☐ | ☐ | ☐ |
| 2 | **Recipes embedded into mission screens** | Recipe list/links on mission dashboard and subtask screens. | ☐ | ☐ | ☐ |
|   | _Implementation_ | Mission.recipe_recommendations; frontend mission dashboard and subtask UI show recipes. | | | |

### 1.5 Reflections

| # | Item | Spec | Confirm | Align | Implement |
|---|------|------|:------:|:-----:|:---------:|
| 1 | **Track-level reflection** | One or more reflection prompts at track level. | ☐ | ☐ | ☐ |
| 2 | **Mission reflection** | Reflection per mission (MissionProgress.reflection, reflection_required). | ☐ | ☐ | ☐ |
| 3 | **Mid-track self-assessment** | Optional self-assessment at mid-point. | ☐ | ☐ | ☐ |
|   | _Implementation_ | Curriculum reflection submission (Tier 2 pattern); MissionProgress.reflection_submitted; optional mid-track activity. | | | |

### 1.6 Portfolio Integration

| # | Item | Spec | Confirm | Align | Implement |
|---|------|------|:------:|:-----:|:---------:|
| 1 | **Mission reports saved automatically** | Completed mission reports appear in portfolio. | ☐ | ☐ | ☐ |
| 2 | **Task outputs attached to learner's portfolio timeline** | Evidence and outputs linked to portfolio timeline. | ☐ | ☐ | ☐ |
|   | _Implementation_ | Portfolio/activity model stores mission completion and evidence; timeline API returns Tier 3 artifacts. | | | |

---

## 2. Placeholder Videos (Interim)

| # | Task | Confirm | Align | Implement |
|---|------|:------:|:-----:|:---------:|
| 1 | **Placeholder video URLs for Intermediate lessons** | Use stable public sample video URL(s) for video lessons until final assets. | ☑ | ☑ | ☑ |
| 2 | **Seed Tier 3 modules with ~20 video lessons per track** | Either extend seed_all_tracks or dedicated command: Tier 3 tracks get enough modules/lessons to reach ~20 videos. | ☑ | ☑ | ☑ |
| 3 | **Replace placeholders with final videos** | When content is ready, replace content_url (bulk or admin). | ☐ | ☐ | ☐ |
|   | _Implementation_ | **Done:** Management command `seed_placeholder_videos`: sets `Lesson.content_url` for `lesson_type=video` (and optional `--guide`) for Tier 2 and Tier 3. Uses public sample video URLs (e.g. gtv-videos-bucket/sample/). Run: `python manage.py seed_placeholder_videos` (optional: `--tier 3`, `--dry-run`, `--guide`). | | | |

---

## 3. Navigation Flow (UX) — Step-by-Step Intermediate Experience

| # | Step | Spec | Confirm | Align | Implement |
|---|------|------|:------:|:-----:|:---------:|
| 1 | **Intermediate Track Landing Page** | Visual progress + mission readiness display. | ☐ | ☐ | ☐ |
|   | _Implementation_ | Tier 3 dashboard: progress bar, requirement cards (modules, missions, reflections), mission readiness. | | | |
| 2 | **Module Viewer** | Deeper videos + transcripts + diagrams. | ☐ | ☐ | ☐ |
|   | _Implementation_ | Tier 3 module viewer: video iframe/player, transcript section, summary, diagrams (lesson type diagram or inline). | | | |
| 3 | **Practice Lab / Tool-Use Screens** | Guided interaction or external links (sandbox, cloud labs). | ☐ | ☐ | ☐ |
|   | _Implementation_ | Lab lesson type; content_url to external lab or embedded guide; link to sandbox/cloud from mission or module. | | | |
| 4 | **Intermediate Mission Dashboard** | Mission name; story context; subtasks listed; recipes referenced; mentor comments section. | ☐ | ☐ | ☐ |
|   | _Implementation_ | Mission detail screen: title, story, objectives, subtask list with progress, recipe list, mentor feedback block. | | | |
| 5 | **Subtask Submission Screen** | Upload multiple files; text-based answers; screenshots; script uploads. | ☐ | ☐ | ☐ |
|   | _Implementation_ | Per-subtask form: file upload (multi), text area, evidence types; POST to mission progress/evidence API. | | | |
| 6 | **Mission Review & Scoring Screen** | Mentor feedback; score breakdown; resubmission if required (admin-configurable). | ☐ | ☐ | ☐ |
|   | _Implementation_ | Learner view: mentor feedback, score, pass/fail; “Resubmit” if revision_requested; admin flag for allowing resubmission. | | | |
| 7 | **Track Progress Dashboard** | Shows learning progress, mission completion, recipe mastery. | ☐ | ☐ | ☐ |
|   | _Implementation_ | Same as step 1 or dedicated view: modules completed, missions passed, recipes completed (if tracked). | | | |
| 8 | **Intermediate Completion Screen** | Trigger transition to Advanced Tracks. | ☐ | ☐ | ☐ |
|   | _Implementation_ | Tier 3 completion screen; “Complete & Unlock Advanced”; POST tier3/complete; tier4_unlocked. | | | |

---

## 4. Quick Reference — Where It Lives

| Item | Backend | Frontend |
|------|---------|----------|
| 20 videos per track | Lesson (video type), content_url; seed or seed_placeholder_videos | Tier 3 module viewer |
| Missions 3–5, story/objectives/subtasks | Mission, ModuleMission | Mission dashboard + subtask submission |
| Recipes on mission | Mission.recipe_recommendations | Mission dashboard + mission screens |
| Reflections | MissionProgress.reflection; track-level reflection API | Reflection form; portfolio timeline |
| Portfolio | CurriculumActivity; portfolio item with evidence_files | Portfolio timeline |
| Landing | Tier 3 status API | tier3/page.tsx dashboard |
| Module viewer | Module + Lesson APIs | Tier 3 module viewer (videos, transcripts, diagrams) |
| Practice lab | Lesson type lab; content_url | Lab screen or external link |
| Mission dashboard | Mission + progress API | Mission detail (story, subtasks, recipes, mentor comments) |
| Subtask submission | MissionProgress subtasks_progress; file upload API | Multi-file + text submission UI |
| Review & scoring | MissionProgress.mentor_score, final_status | Review screen; resubmit if needed |
| Completion | tier3/complete | Tier 3 completion screen |

---

_Update this doc as you confirm, align, and implement. Use with `INTERMEDIATE_TRACKS_SPEC.md`, `INTERMEDIATE_TRACK_REQUIREMENTS.md`, and `INTERMEDIATE_TRACKS_TODO.md`._
