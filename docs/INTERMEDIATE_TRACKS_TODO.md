# Intermediate Tracks (Tier 3) — Implementation TODO

Use this list to **confirm**, **align**, and **implement** the Intermediate Tracks experience. Check off each item as verified or done.

- **Canonical copy:** `docs/INTERMEDIATE_TRACKS_SPEC.md`
- **Module, navigation, roles & completion:** `docs/INTERMEDIATE_TRACK_REQUIREMENTS.md` (learning units, missions with subtasks, multi-file evidence, mentor scoring, deadlines, recipes, completion logic, navigation, role permissions).

---

## 1. Tier Overview (Copy & Placement)

| # | Item | Spec | Confirm | Align | Implement |
|---|------|------|:------:|:-----:|:---------:|
| 1 | **Tier overview paragraph** | Transition from conceptual (Beginner) to applied capability; deeper exercises, structured missions, recipes, real tools/workflows/casework; bridge to advanced. | ☐ | ☐ | ☐ |
|   | _Notes_ | Same structure as Beginner intro card: one paragraph + bullet list. | | | Add Intermediate intro card on curriculum hub when `tier3_unlocked`. |
| 2 | **Bullet list (5 points)** | applying concepts in deeper exercises; completing more structured missions; utilizing recipes more intentionally; preparing for advanced track missions; discovering early specialization preferences. | ☐ | ☐ | ☐ |
| 3 | **Tagline / bridge** | “Real tools, real workflows, real casework”; “bridge to advanced-level missions and specialization pathways.” | ☐ | ☐ | ☐ |

---

## 2. Five Intermediate Categories (Copy & Data)

| # | Category | One-line description (exact) | Confirm | Align | Implement |
|---|----------|------------------------------|:------:|:-----:|:---------:|
| 1 | Intermediate — Defender | Deeper SOC processes, detection engineering basics, log analysis, triage, and IR fundamentals. | ☐ | ☐ | ☐ |
| 2 | Intermediate — Offensive | Practical recon, enumeration, vulnerability discovery, basic exploitation. | ☐ | ☐ | ☐ |
| 3 | Intermediate — GRC | Risk analysis, policy mapping, maturity assessments, audit workflows. | ☐ | ☐ | ☐ |
| 4 | Intermediate — Innovation | Scripting, cloud security basics, intro to automation, SIEM/content fundamentals. | ☐ | ☐ | ☐ |
| 5 | Intermediate — Leadership | Communication skills, stakeholder engagement, influence, decision clarity. | ☐ | ☐ | ☐ |
|   | _Implementation_ | Backend: seed/store `intermediate_descriptions` per track (or use spec in frontend). Frontend: show on curriculum hub and track landing. | | | |

---

## 3. User Personas (UX Consideration)

| Persona | Consideration | Confirm | Align | Implement |
|---------|---------------|:------:|:-----:|:---------:|
| Intermediate learners (6 mo–2 yr) | Content depth and pacing; “first real missions” messaging. | ☐ | ☐ | ☐ |
| Beginner graduates | Clear “You’re ready for the next level” and visible Tier 3 tracks after completion. | ☐ | ☐ | ☐ |
| Career switchers | Confidence-building copy; optional “Where do I fit?” / specialization teaser. | ☐ | ☐ | ☐ |
| Mentors | Mentor view for Tier 3 progress and feedback (reuse/extend Tier 2 pattern). | ☐ | ☐ | ☐ |
| Admins | Ability to manage Tier 3 tracks, modules, and missions. | ☐ | ☐ | ☐ |
| Enterprise supervisors | Cohort/skill growth for Tier 3 (e.g. tier3 cohort-progress or extend existing). | ☐ | ☐ | ☐ |

---

## 4. User Goals & Outcomes → Features

| Goal / Outcome | Feature / Implementation | Confirm | Align | Implement |
|----------------|--------------------------|:------:|:-----:|:---------:|
| Applied, role-specific skills | Tier 3 modules and lessons aligned to Defender/Offensive/GRC/Innovation/Leadership. | ☐ | ☐ | ☐ |
| First real missions (multi-step) | Full missions (Missions Engine) linked to Tier 3; mission completion counts. | ☐ | ☐ | ☐ |
| Confidence with tools/scripts/workflows | Recipes + labs + mission steps; recipe recommendations per module. | ☐ | ☐ | ☐ |
| Substantial portfolio artifacts | Mission reports, reflections, artifacts stored and visible in portfolio. | ☐ | ☐ | ☐ |
| Where they fit (specialization) | Optional: “Discover your path” or category comparison; future specialization branching. | ☐ | ☐ | ☐ |
| Readiness for Tier 4 (Advanced) | Tier 3 completion unlocks Tier 4; completion screen + next-level CTA. | ☐ | ☐ | ☐ |
| **System:** Capture performance data | UserTrackProgress, UserModuleProgress, mission attempts, recipe usage. | ☐ | ☐ | ☐ |
| **System:** Validate readiness for advanced | Tier 3 completion flag; optional readiness checklist or assessment. | ☐ | ☐ | ☐ |
| **System:** Tailor recipe recommendations | RecipeRecommendation per Tier 3 module; show in module viewer and post-completion. | ☐ | ☐ | ☐ |
| **System:** Specialization branching | Optional future: branch by category or role; not required for MVP. | ☐ | ☐ | ☐ |

---

## 5. Navigation & Screens (Tier 3 in App)

| # | Step / Screen | Spec | Confirm | Align | Implement |
|---|---------------|------|:------:|:-----:|:---------:|
| 1 | **Curriculum hub** | Show “Intermediate Level Tracks” section and 5 categories when `tier3_unlocked`. | ☐ | ☐ | ☐ |
|   | _Notes_ | Filter tracks by `tier === 3`; gate by `tier3_unlocked` from Tier 2 complete. | | | |
| 2 | **Track entry** | Clicking a Tier 3 track opens Tier 3 track page (not tier2). | ☐ | ☐ | ☐ |
|   | _Implementation_ | Route: `/dashboard/student/curriculum/[trackCode]` → if `tier === 3` redirect to `.../tier3` or render tier3 content. | | | Add tier3 route/page. |
| 3 | **Tier 3 track dashboard** | Similar to Tier 2: modules, progress, requirements, sidebar, resources. | ☐ | ☐ | ☐ |
|   | _Notes_ | Reuse or extend Tier 2 dashboard pattern; missions (full) not only mini-missions. | | | |
| 4 | **Module viewer** | Lessons, video/guide, summary, resources, bookmarks (same pattern as Tier 2). | ☐ | ☐ | ☐ |
| 5 | **Missions (full)** | Multi-step missions from Missions Engine; mission list and submission per track. | ☐ | ☐ | ☐ |
| 6 | **Recipes** | Intentional recipe use: list per module, link to recipe engine, completion tracking. | ☐ | ☐ | ☐ |
| 7 | **Completion & Tier 4 unlock** | “Track complete”; “Ready for Advanced”; unlock Tier 4 and show in curriculum. | ☐ | ☐ | ☐ |

---

## 6. Backend & API

| # | Item | Confirm | Align | Implement |
|---|------|:------:|:-----:|:---------:|
| 1 | **Tier 3 track list** | API returns tracks with `tier === 3`; frontend filters or backend filter by tier. | ☐ | ☐ | ☐ |
| 2 | **Gate: tier3_unlocked** | Already from Tier 2 complete; ensure curriculum list only shows Tier 3 tracks when unlocked. | ☐ | ☐ | ☐ |
| 3 | **Tier 3 status API** | GET tier3/tracks/<code>/status — requirements (modules, missions passed, reflections, mentor approval), missing_requirements, can_progress_to_tier4. | ☐ | ☑ | ☑ |
| 4 | **Tier 3 completion** | POST tier3/tracks/<code>/complete; set completed_at, tier4_unlocked; check_tier3_completion() enforces: mandatory modules, all missions passed, reflections, mentor approval if required. | ☐ | ☑ | ☑ |
| 5 | **Missions integration** | Tier 3 tracks link to full missions via ModuleMission; MissionProgress.final_status=pass counts; check_tier3_completion() uses missions.models_mxp.MissionProgress. | ☐ | ☑ | ☑ |
| 6 | **Recipe recommendations** | Already on CurriculumModule and Mission.recipe_recommendations; ensure Tier 3 modules/missions show them in frontend. | ☐ | ☐ | ☐ |

---

## 7. Data & Telemetry

| Metric | Confirm | Align | Implement |
|--------|:------:|:-----:|:---------:|
| Tier 3 track/module completion | ☐ | ☐ | ☐ |
| Mission attempts and completions (Tier 3) | ☐ | ☐ | ☐ |
| Recipe usage per module | ☐ | ☐ | ☐ |
| Time spent per Tier 3 module | ☐ | ☐ | ☐ |
| Tier 3 → Tier 4 transition timestamp | ☐ | ☐ | ☐ |
| Learner performance data for enterprise | ☐ | ☐ | ☐ |

---

## 8. Implementation Priority (Suggested Order)

1. **Spec & copy** — Lock INTERMEDIATE_TRACKS_SPEC.md; add `intermediate_descriptions` to seed or frontend.
2. **Gate & list** — Ensure `tier3_unlocked` is used; show Tier 3 tracks on curriculum hub when unlocked.
3. **Tier 3 route and page** — Add `/curriculum/[trackCode]/tier3` (or equivalent); redirect `tier === 3` from `[trackCode]` to tier3.
4. **Tier 3 dashboard** — Reuse/adapt Tier 2 dashboard (modules, progress, sidebar, resources).
5. **Module viewer & recipes** — Same pattern as Tier 2; ensure recipe recommendations visible.
6. **Missions** — Wire Tier 3 tracks to full missions; mission completion and progress.
7. **Tier 3 completion** — Completion API and “Ready for Advanced” screen; set tier4_unlocked.
8. **Telemetry & personas** — Performance data, enterprise cohort view; copy for career switchers and mentors.

---

## 9. Quick Reference — Where It Lives (or Will Live)

| Item | Backend | Frontend |
|------|---------|----------|
| Tier overview copy | — | Curriculum hub (new section when tier3_unlocked); `lib/intermediateTracksSpec.ts`. |
| Five categories | Seed: `seed_all_tracks` (tier 3); optional `intermediate_descriptions`. | Curriculum hub; track landing. |
| Track list (Tier 3) | Curriculum API (tier filter); enrollment. | `curriculum/page.tsx` — filter by tier, gate by tier3_unlocked. |
| Track entry | `[trackCode]/page.tsx` redirects tier 2 → tier2. | Add tier 3 → tier3 redirect and `[trackCode]/tier3/page.tsx`. |
| Tier 3 dashboard | Track detail, module list, progress APIs (reuse). | `tier3/page.tsx` (new, pattern from tier2). |
| Missions (subtasks, multi-file) | missions.Mission (subtasks); MissionProgress; MissionFile; ModuleMission. | Mission list + mission detail with subtasks; multi-file evidence. |
| Tier 3 status/completion | GET/POST tier3/tracks/<code>/status and complete; check_tier3_completion(). | Tier3 status API; Tier3CompletionScreen; tier4_unlocked. |
| Recipe recommendations | CurriculumModule.recipe_recommendations; Mission.recipe_recommendations | Module viewer; mission detail. |
| Full requirements | See INTERMEDIATE_TRACK_REQUIREMENTS.md | Modules, nav, roles, completion logic. |

---

_Update this doc as you confirm, align, and implement. Use with `docs/INTERMEDIATE_TRACKS_SPEC.md`._
