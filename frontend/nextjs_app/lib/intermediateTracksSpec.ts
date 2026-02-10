/**
 * Intermediate Tracks — canonical copy from spec.
 * Single source of truth for UI; must match docs/INTERMEDIATE_TRACKS_SPEC.md.
 */

export const INTERMEDIATE_TRACKS_OVERVIEW = {
  /** Position: transition from Beginner to applied capability */
  transition:
    'Intermediate Tracks represent the learner’s transition from conceptual understanding (Beginner Tier) to applied capability.',
  /** What learners start doing here */
  bullets: [
    'applying concepts in deeper exercises',
    'completing more structured missions',
    'utilizing recipes more intentionally',
    'preparing for advanced track missions',
    'discovering early specialization preferences',
  ],
  /** Real tools / bridge message */
  realTools:
    'The Intermediate tier introduces real tools, real workflows, real casework, and begins forming professional competence.',
  /** Bridge to advanced */
  bridge: 'It acts as the “bridge” to advanced-level missions and specialization pathways.',
  /** Tagline / short descriptor */
  tagline: 'Real tools. Real workflows. Real casework.',
} as const

/** Five Intermediate categories — exact spec descriptions */
export const INTERMEDIATE_TRACK_CATEGORIES = [
  {
    key: 'defender',
    name: 'Intermediate — Defender Track',
    description:
      'Deeper SOC processes, detection engineering basics, log analysis, triage, and IR fundamentals.',
  },
  {
    key: 'offensive',
    name: 'Intermediate — Offensive Track',
    description: 'Practical recon, enumeration, vulnerability discovery, basic exploitation.',
  },
  {
    key: 'grc',
    name: 'Intermediate — GRC Track',
    description: 'Risk analysis, policy mapping, maturity assessments, audit workflows.',
  },
  {
    key: 'innovation',
    name: 'Intermediate — Innovation Track',
    description:
      'Scripting, cloud security basics, intro to automation, SIEM/content fundamentals.',
  },
  {
    key: 'leadership',
    name: 'Intermediate — Leadership Track',
    description: 'Communication skills, stakeholder engagement, influence, decision clarity.',
  },
] as const

/** User personas (spec) */
export const INTERMEDIATE_TRACK_PERSONAS = {
  primary: [
    'Intermediate Learners (6 months–2 years experience).',
    'Beginner graduates transitioning upward.',
    'Career switchers still building confidence but ready for real practice.',
  ],
  secondary: ['Mentors', 'Admins', 'Enterprise supervisors tracking skill growth'],
} as const

/** Learner goals (spec) */
export const INTERMEDIATE_TRACK_LEARNER_GOALS = [
  'Develop applied, role-specific skills.',
  'Complete their first real missions requiring multiple steps.',
  'Build confidence with tools, scripts, or workflows.',
  'Produce substantial portfolio artifacts.',
  'Understand where they fit within specialization options.',
  'Achieve readiness for Advanced Tracks.',
] as const

/** System outcomes (spec) */
export const INTERMEDIATE_TRACK_SYSTEM_OUTCOMES = [
  'Capture learner performance data.',
  'Validate user readiness for advanced missions.',
  'Tailor recipe recommendations.',
  'Enable specialization branching (optional future feature).',
] as const
