/**
 * Beginner Tracks — canonical copy from spec.
 * Single source of truth for UI; must match docs/BEGINNER_TRACKS_SPEC.md.
 */

export const BEGINNER_TRACKS_OVERVIEW = {
  /** First sentence: position in OCH */
  firstPathwayAfterFoundations:
    'Beginner Tracks form the first structured learning pathway inside OCH after Foundations.',
  /** Movement: orientation → competence-building */
  movement: 'This tier moves the learner from orientation → competence-building.',
  /** What each track introduces */
  introduces: 'Each beginner track introduces core concepts, foundational skills, and early-stage mission readiness.',
  /** Design principles */
  designPrinciples:
    'These tracks are simple, confidence-building, structured, interactive, and designed to bring learners to an intermediate professional level.',
  /** Tagline learners should feel */
  tagline: 'I can do this. I understand cyber. I can contribute.',
  /** Why this tier matters */
  purpose:
    'This tier is essential to build belief, competence, and the minimum technical literacy required for missions.',
} as const

/** Five Beginner categories — exact spec descriptions */
export const BEGINNER_TRACK_CATEGORIES = [
  {
    key: 'defender',
    name: 'Beginner — Defender Track',
    description: 'Introductory SOC, monitoring, basic detection concepts.',
  },
  {
    key: 'offensive',
    name: 'Beginner — Offensive Track',
    description: 'Ethical hacking fundamentals, reconnaissance, attacker mindset.',
  },
  {
    key: 'grc',
    name: 'Beginner — GRC Track',
    description: 'Governance, compliance basics, documentation, risk principles.',
  },
  {
    key: 'innovation',
    name: 'Beginner — Innovation Track',
    description: 'Cloud basics, scripting fundamentals, intro to automation.',
  },
  {
    key: 'leadership',
    name: 'Beginner — Leadership Track',
    description: 'Professional identity, VIP foundation, communication, decision basics.',
  },
] as const

/** Content scale per category (spec) */
export const BEGINNER_TRACK_CONTENT_PER_CATEGORY =
  '~20 beginner videos plus quizzes, simple tasks, and 1–2 soft missions per category.'

/** User personas (spec) */
export const BEGINNER_TRACK_PERSONAS = {
  primary: [
    'Beginner Learners (0–1 year exposure).',
    'Career Switchers entering cybersecurity.',
    'Intermediate learners seeking structured grounding.',
  ],
  secondary: [
    'Mentors (for guidance & review).',
    'Administrators (for tracking user progress).',
    'Enterprise partners (for entry-level upskilling).',
  ],
} as const

/** Learner goals (spec) */
export const BEGINNER_TRACK_LEARNER_GOALS = [
  'Understand the fundamentals of their chosen track.',
  'Build confidence in technical or governance concepts.',
  'Prepare for intermediate missions.',
  'Produce first portfolio artifacts.',
  'Demonstrate early competence through quizzes/mini-assessments.',
  'Gain clarity on which specializations appeal to them.',
  'Engage early with mentorship guidance.',
] as const

/** Platform outcomes (spec) */
export const BEGINNER_TRACK_PLATFORM_OUTCOMES = [
  'Move learners from basic understanding → mission readiness.',
  'Build track-level progress data.',
  'Enable smooth transition into Intermediate Tracks.',
] as const
