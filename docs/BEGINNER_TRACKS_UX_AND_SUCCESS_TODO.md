# Beginner Tracks — Navigation Flow, Screens, Telemetry, Integrations & Success Criteria TODO

Use this list to **confirm**, **align**, and **implement** the full Beginner Track experience. Check off each item as verified or done.

---

## 1. Navigation Flow (UX) — Step-by-Step Beginner Experience

| # | Step | Spec | Confirm | Align | Implement |
|---|------|------|:------:|:-----:|:---------:|
| 1 | **Track Dashboard (Landing Page)** | Shows modules, progress bar, and mentor notes. | ☑ | ☑ | ☑ |
|   | _Notes_ | Tier2Dashboard has modules grid, progress bar, requirement cards. Mentor notes: show in sidebar or on module cards if available. | | | Add mentor notes display if `module.mentor_notes` or track-level notes exist. |
| 2 | **Module Viewer** | Contains video + transcript + summary + resources. | ☑ | ☑ | ☑ |
|   | _Notes_ | Tier2ModuleViewer has video iframe, lesson list, current lesson content. Confirm transcript/summary/resources per lesson (content_url or rich content). | | | Add transcript/summary section and resources list when lesson has them. |
| 3 | **Knowledge Check Quiz** | Simple, reinforcing learning. | ☐ | ☐ | ☐ |
|   | _Notes_ | Tier2QuizScreen exists; submit to submit-quiz API; 70% pass. | | | Confirm quiz questions load from lesson/content; add retry messaging. |
| 4 | **Reflection Submission Page** | Short text responses stored in portfolio. | ☐ | ☐ | ☐ |
|   | _Notes_ | Tier2ReflectionScreen; submit-reflection API; count in tier2_reflections_submitted. | | | Confirm reflection text is stored (portfolio/activity) and visible in portfolio timeline. |
| 5 | **Mini-Mission Introduction Screen** | Context + expected output. | ☑ | ☑ | ☑ |
|   | _Notes_ | Tier2MiniMissionPreview shows mission title/description; “Start” → submission screen. | | | Ensure context and expected output copy are visible (from ModuleMission or content). |
| 6 | **Mini-Mission Submission Screen** | Upload evidence; tagging & description required. | ☑ | ☑ | ☑ |
|   | _Notes_ | Tier2MiniMissionSubmit; submit-mini-mission API with submission_data. | | | Confirm upload (file URL or base64) and description/tagging fields are required and sent. |
| 7 | **Review & Mentor Feedback Screen** | Visible to learner as comments / audio notes. | ☑ | ☑ | ☑ |
|   | _Notes_ | API: GET tier2/tracks/<code>/feedback. Learner view: list feedback by lesson/module. | | | Add “Mentor Feedback” section/screen in Tier2 (e.g. sidebar link or tab) that lists feedback; support audio URL if stored. |
| 8 | **Beginner Progress Tracker** | Visual dashboard with milestones. | ☑ | ☑ | ☑ |
|   | _Notes_ | Dashboard has requirement cards (modules, quizzes, mini-missions, reflections) and progress bar. | | | Optional: add milestone badges or timeline (e.g. “Module 1 done”, “First quiz passed”). |
| 9 | **Completion Screen → Transition to Intermediate** | “Congratulations — You’re Ready for the Next Level” | ☐ | ☐ | ☐ |
|   | _Notes_ | Tier2CompletionScreen; “Complete Tier 2 & Unlock Tier 3” button; redirect to curriculum. | | | Ensure copy includes “Congratulations” and “Ready for the Next Level”; Tier3 visible after complete. |

---

## 2. Screens Needed (UI Inventory)

| # | Screen | Spec | Confirm | Align | Implement |
|---|--------|------|:------:|:-----:|:---------:|
| 1 | Beginner Track Landing Page | First screen when entering track. | ☑ | ☑ | ☑ |
|   | _Implementation_ | Tier2Dashboard (track name, progress bar, modules grid). | | | |
| 2 | Module List + Progress Overview | List of modules with overall progress. | ☑ | ☑ | ☑ |
|   | _Implementation_ | Same dashboard: “Track Modules” section + requirement cards. | | | |
| 3 | Module Viewer (Video + Summary + Resources) | Per-module content: video, summary, resources. | ☑ | ☑ | ☑ |
|   | _Implementation_ | Tier2ModuleViewer (lessons list, current lesson video/guide, bookmark). | | | Add explicit “Summary” and “Resources” blocks if not present. |
| 4 | Quiz Screen | Knowledge check after content. | ☐ | ☐ | ☐ |
|   | _Implementation_ | Tier2QuizScreen; submit quiz; show pass/fail. | | | |
| 5 | Reflection Submission Screen | Short text responses. | ☐ | ☐ | ☐ |
|   | _Implementation_ | Tier2ReflectionScreen; submit reflection. | | | |
| 6 | Mini-Mission Preview Page | Context + expected output before starting. | ☑ | ☑ | ☑ |
|   | _Implementation_ | Tier2MiniMissionPreview. | | | |
| 7 | Mini-Mission Submission Page | Upload evidence; tagging & description. | ☑ | ☑ | ☑ |
|   | _Implementation_ | Tier2MiniMissionSubmit. | | | Confirm upload + description required in UI and API. |
| 8 | Mentor Feedback Screen | Learner sees mentor comments / audio notes. | ☑ | ☑ | ☑ |
|   | _Implementation_ | API exists (GET feedback). Add dedicated screen or “Mentor feedback” section in Tier2. | | | Build learner-facing Mentor Feedback screen/tab listing feedback by task. |
| 9 | Track Completion Screen | “Congratulations”, unlock Tier 3. | ☐ | ☐ | ☐ |
|   | _Implementation_ | Tier2CompletionScreen. | | | |
| 10 | Progress Dashboard Screen | Visual progress and milestones. | ☑ | ☑ | ☑ |
|   | _Implementation_ | Dashboard view with requirement cards + progress bar. | | | |
| 11 | Resources/Glossary Screen | Glossary, cheat sheets, “What to expect next”. | ☐ | ☐ | ☐ |
|   | _Implementation_ | Tier2ResourcesScreen (Glossary, cheat sheets note, roadmap). | | | Optional: add downloadable cheat sheet links when available. |
| 12 | “Ready for Intermediate?” Prompt | Clear CTA before/after completion. | ☐ | ☐ | ☐ |
|   | _Implementation_ | Completion screen button: “Complete Tier 2 & Unlock Tier 3”; post-complete redirect. | | | |

---

## 3. Data & Telemetry Requirements

| Metric | Confirm | Align | Implement |
|--------|:------:|:-----:|:---------:|
| Module completion status | ☐ | ☐ | ☐ |
| _Implementation_ | UserModuleProgress.status, UserTrackProgress.modules_completed. | | |
| Quiz scores | ☐ | ☐ | ☐ |
| _Implementation_ | UserLessonProgress.quiz_score, quiz_attempts. | | |
| Number of mini-mission attempts | ☐ | ☐ | ☐ |
| _Implementation_ | UserMissionProgress.attempts; tier2_mini_missions_completed. | | |
| Time spent per module | ☐ | ☐ | ☐ |
| _Implementation_ | UserModuleProgress.time_spent_minutes. | | |
| Number of hints or replays (if available) | ☐ | ☐ | ☐ |
| _Implementation_ | Not stored yet; optional field or event log. | | Add if product requires. |
| Reflection submission | ☐ | ☐ | ☐ |
| _Implementation_ | tier2_reflections_submitted; reflection content in portfolio/activity. | | |
| Mentor review timestamps | ☐ | ☐ | ☐ |
| _Implementation_ | CurriculumMentorFeedback.created_at, updated_at. | | Expose in analytics/API. |
| Beginner → Intermediate transition timestamp | ☐ | ☐ | ☐ |
| _Implementation_ | UserTrackProgress.completed_at; CurriculumActivity tier2_completed. | | |
| Engagement: video watch %, quiz retry rate | ☐ | ☐ | ☐ |
| _Implementation_ | UserLessonProgress.progress_percentage (video); quiz_attempts. | | Ensure frontend sends progress %. |
| Skill mastery indicators (Beginner level) | ☐ | ☐ | ☐ |
| _Implementation_ | Derive from quiz scores, completion; optional skill tag per module. | | Wire to analytics/enterprise dashboard. |
| Drop-off points for UX optimization | ☐ | ☐ | ☐ |
| _Implementation_ | Analytics: last_activity_at per module/lesson; incomplete modules. | | Add aggregation for “drop-off by step”. |
| All metrics feed into learner analytics and enterprise dashboards | ☐ | ☐ | ☐ |
| _Implementation_ | Tier2 cohort-progress API; learner progress API; ensure dashboards consume. | | Confirm learner analytics and enterprise dashboard read Tier2 metrics. |

---

## 4. Integration Points

| Integration | Confirm | Align | Implement |
|-------------|:------:|:-----:|:---------:|
| **Missions Engine** — Mini-missions integrated; prepare for full Intermediate Missions | ☐ | ☐ | ☐ |
| _Implementation_ | ModuleMission; submit-mini-mission; Tier2 complete unlocks Tier3. | | |
| **Recipe Engine** — Beginner recipes (simplest level); list required for upcoming missions | ☐ | ☐ | ☐ |
| _Implementation_ | CurriculumModule.supporting_recipes; RecipeRecommendation; show on module/completion. | | |
| **Mentorship Layer** — Mentors provide feedback on mini-missions and reflections | ☐ | ☐ | ☐ |
| _Implementation_ | CurriculumMentorFeedback; GET/POST tier2/tracks/<code>/feedback. | | Mentor UI to add feedback; learner UI to view. |
| **Portfolio & Assessment Engine** — Beginner artifacts stored; results in portfolio timeline | ☐ | ☐ | ☐ |
| _Implementation_ | Reflection/mini-mission submissions → portfolio entries; CurriculumActivity. | | Confirm portfolio timeline shows Tier2 artifacts. |
| **VIP Leadership Academy** — Value → Impact; reflections as leadership indicators | ☐ | ☐ | ☐ |
| _Implementation_ | Reflections stored; optional link to VIP/leadership scoring. | | Optional: tag reflections for VIP. |
| **Marketplace Academy** — Building marketplace-ready artifacts (user not yet active) | ☐ | ☐ | ☐ |
| _Implementation_ | Portfolio artifacts from Tier2; no marketplace listing until later tier. | | |
| **Enterprise Dashboard** — Tracks completion and competency for enterprise cohorts | ☐ | ☐ | ☐ |
| _Implementation_ | GET curriculum/tier2/cohort-progress/?cohort_id= (aggregate, no PII). | | Confirm enterprise dashboard calls this and shows Tier2 completion. |

---

## 5. Success Criteria

### User Experience Success

| Criterion | Confirm | Align | Implement |
|-----------|:------:|:-----:|:---------:|
| Learners understand core concepts clearly and enjoy the track. | ☐ | ☐ | ☐ |
| _How_ | Content review; optional post-track survey or NPS. | | |
| High completion rate (>75%). | ☐ | ☐ | ☐ |
| _How_ | Analytics: completion_rate per track/cohort; target >75%. | | Add report or dashboard widget. |
| Smooth progression into Intermediate Tracks. | ☐ | ☐ | ☐ |
| _How_ | E2E: complete Tier2 → Tier3 visible and accessible; no dead ends. | | |
| Increased confidence (post-track self-assessment). | ☐ | ☐ | ☐ |
| _How_ | Optional: 1–3 question self-assessment after completion. | | Add optional survey step. |

### Platform/Developer Success

| Criterion | Confirm | Align | Implement |
|-----------|:------:|:-----:|:---------:|
| All modules load quickly, responsive on all devices. | ☐ | ☐ | ☐ |
| _How_ | Perf budget; responsive layout (sidebar collapse, touch). | | |
| Progress data accurately captured. | ☐ | ☐ | ☐ |
| _How_ | Tier2 status API vs DB; no double-count; idempotent submit. | | |
| Mini-mission submission workflow is solid. | ☐ | ☐ | ☐ |
| _How_ | Submit → count update; completion check; duplicate handling. | | |
| Mentor feedback loops function reliably. | ☐ | ☐ | ☐ |
| _How_ | Mentor POST → stored; learner GET → visible; timestamps. | | |
| Track completion triggers Intermediate access automatically. | ☐ | ☐ | ☐ |
| _How_ | Tier2 complete → tier3_unlocked; curriculum list shows Tier3. | | |

---

## 6. Implementation Priority (Suggested Order)

1. **Confirm** — Run through each Navigation step and Screen; mark what exists and what’s missing.
2. **Mentor Feedback Screen** — Add learner-facing screen/tab that lists GET feedback; ensure mentor can POST from mentor dashboard.
3. **Module Viewer** — Add transcript + summary + resources where content supports it; mentor notes on dashboard/sidebar.
4. **Mini-Mission Submission** — Confirm upload + description required in UI and validated in API.
5. **Telemetry** — Mentor review timestamps in API; video watch % and quiz retry in progress API; drop-off aggregation if needed.
6. **Integrations** — Confirm portfolio timeline shows Tier2 artifacts; enterprise dashboard uses cohort-progress.
7. **Success criteria** — Add Tier2 completion rate report; optional post-track self-assessment; E2E test for Tier2 → Tier3.

---

## 7. Quick Reference — Where It Lives in Code

| Item | Backend | Frontend |
|------|---------|----------|
| Track dashboard | Tier2 status, progress APIs | `tier2/page.tsx` → Tier2Dashboard |
| Module viewer | Modules, lessons, bookmark API | Tier2ModuleViewer |
| Quiz | submit-quiz | Tier2QuizScreen |
| Reflection | submit-reflection | Tier2ReflectionScreen |
| Mini-mission preview/submit | submit-mini-mission | Tier2MiniMissionPreview, Tier2MiniMissionSubmit |
| Mentor feedback | GET/POST tier2/.../feedback | Tier2MentorFeedbackScreen + sidebar; mentor: use API |
| Completion | tier2/complete | Tier2CompletionScreen |
| Resources/Glossary | — | Tier2ResourcesScreen |
| Sample report | tier2/.../sample-report | Tier2SampleReportScreen |
| Progress/telemetry | UserTrackProgress, UserModuleProgress, UserLessonProgress, CurriculumMentorFeedback | Status API, progress bar, requirement cards |
| Cohort progress | tier2/cohort-progress | Enterprise dashboard (consumer) |

---

_Update this doc as you confirm, align, and implement each item. Use with `BEGINNER_TRACKS_ALIGNMENT_AND_TODO.md` and `docs/BEGINNER_TRACKS_SPEC.md`._
