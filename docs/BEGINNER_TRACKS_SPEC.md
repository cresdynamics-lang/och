# Beginner Tracks — Canonical Spec (Exact Wording)

This document is the **single source of truth** for Beginner Tracks (Tier 2). The product and codebase must align to this wording.

---

## 1. Tier Overview

**Beginner Tracks** form the **first structured learning pathway inside OCH after Foundations**. This tier moves the learner from **orientation → competence-building**.

Each beginner track introduces **core concepts**, **foundational skills**, and **early-stage mission readiness**. These tracks must be **simple**, **confidence-building**, **structured**, **interactive**, and designed to bring learners to an **intermediate professional level**.

**Beginner Tracks must feel like:**

> **"I can do this. I understand cyber. I can contribute."**

This tier is essential to **build belief**, **competence**, and the **minimum technical literacy** required for missions.

---

## 2. Category Breakdown (5 Beginner Categories)

| # | Category | Description |
|---|----------|-------------|
| 1 | **Beginner — Defender Track** | Introductory SOC, monitoring, basic detection concepts. |
| 2 | **Beginner — Offensive Track** | Ethical hacking fundamentals, reconnaissance, attacker mindset. |
| 3 | **Beginner — GRC Track** | Governance, compliance basics, documentation, risk principles. |
| 4 | **Beginner — Innovation Track** | Cloud basics, scripting fundamentals, intro to automation. |
| 5 | **Beginner — Leadership Track** | Professional identity, VIP foundation, communication, decision basics. |

**Content per category:** ~20 beginner videos plus quizzes, simple tasks, and 1–2 soft missions.

---

## 3. User Personas

**Primary**

- Beginner Learners (0–1 year exposure).
- Career Switchers entering cybersecurity.
- Intermediate learners seeking structured grounding.

**Secondary**

- Mentors (for guidance & review).
- Administrators (for tracking user progress).
- Enterprise partners (for entry-level upskilling).

---

## 4. User Goals & Outcomes

**Learner goals:**

- Understand the fundamentals of their chosen track.
- Build confidence in technical or governance concepts.
- Prepare for intermediate missions.
- Produce first portfolio artifacts.
- Demonstrate early competence through quizzes/mini-assessments.
- Gain clarity on which specializations appeal to them.
- Engage early with mentorship guidance.

**Platform outcomes:**

- Move learners from basic understanding → mission readiness.
- Build track-level progress data.
- Enable smooth transition into Tier 3 (Intermediate Tracks).

---

## Confirmation in Codebase

- **Tier position:** Tier 2 follows Tier 1 (Foundations) in `CurriculumTrack.TIER_CHOICES` and in flow (Foundations completion → Tier 2 access).
- **Five categories:** Tracks with slugs/codes `defender`, `offensive`, `grc`, `innovation`, `leadership`; descriptions aligned in seed and frontend content.
- **Completion logic:** Mandatory modules, quizzes passed, 1–2 mini-missions, optional mentor approval; completion unlocks Tier 3.
- **Personas, goals, outcomes:** Supported by learner/mentor/admin/enterprise roles, progress APIs, and Tier 2 → Tier 3 transition.

See `BEGINNER_TRACKS_ALIGNMENT_AND_TODO.md` for detailed alignment and implementation TODOs.
