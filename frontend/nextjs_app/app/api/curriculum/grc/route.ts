import { NextRequest, NextResponse } from 'next/server';

// Mock GRC curriculum data - replace with database queries
const mockGrcCurriculum = {
  track: {
    slug: 'grc',
    title: 'GRC Track',
    description: 'Governance, Risk, and Compliance for modern cyber programs.',
    icon_key: 'grc'
  },
  levels: [
    {
      slug: 'beginner',
      title: 'Beginner',
      description: 'GRC fundamentals and basic concepts',
      order_number: 1,
      estimated_duration_hours: 10,
      modules: [
        {
          slug: 'grc-foundations',
          title: 'GRC Foundations & Key Terms',
          description: 'Understanding the core concepts of Governance, Risk, and Compliance',
          order_number: 1,
          estimated_duration_minutes: 45,
          content_count: 4 // 3 videos + 1 quiz
        },
        {
          slug: 'policies-and-standards-intro',
          title: 'Policies, Standards & Frameworks',
          description: 'Introduction to policies, standards, procedures and common frameworks',
          order_number: 2,
          estimated_duration_minutes: 50,
          content_count: 4
        },
        {
          slug: 'risk-assessment-basics',
          title: 'Risk Assessment Fundamentals',
          description: 'Basic concepts of risk identification, assessment, and management',
          order_number: 3,
          estimated_duration_minutes: 40,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'grc-beginner-assessment',
        title: 'GRC Beginner Assessment',
        description: 'Mini case study to apply GRC basics to a small African fintech scenario.',
        missions: [
          { mission_slug: 'sample-risk-register-exercise' },
          { mission_slug: 'policy-review-mini-case' }
        ],
        recipes: ['grc-risk-register-basics', 'grc-policy-reading-checklist'],
        reflection_prompt: 'In 5–7 sentences, explain why a small African fintech must care about GRC.'
      }
    },
    {
      slug: 'intermediate',
      title: 'Intermediate',
      description: 'Operational GRC practices and implementation',
      order_number: 2,
      estimated_duration_hours: 12,
      modules: [
        {
          slug: 'risk-register-operations',
          title: 'Risk Register Operations',
          description: 'Managing and maintaining risk registers in operational environments',
          order_number: 1,
          estimated_duration_minutes: 55,
          content_count: 4
        },
        {
          slug: 'control-mapping-fundamentals',
          title: 'Control Mapping Fundamentals',
          description: 'Mapping controls to requirements and frameworks',
          order_number: 2,
          estimated_duration_minutes: 60,
          content_count: 4
        },
        {
          slug: 'policy-gap-analysis',
          title: 'Policy Gap Analysis',
          description: 'Identifying and addressing gaps in policy frameworks',
          order_number: 3,
          estimated_duration_minutes: 45,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'grc-intermediate-assessment',
        title: 'GRC Intermediate Assessment',
        description: 'Operational case study: As GRC analyst at a Telco, prioritize and treat 5 identified risks.',
        missions: [
          { mission_slug: 'telco-risk-prioritization-case' },
          { mission_slug: 'control-mapping-exercise' }
        ],
        recipes: ['grc-control-mapping-iso-nist', 'grc-vendor-risk-review-checklist'],
        reflection_prompt: 'In 6–8 sentences, describe how you would implement a risk management process for a growing African startup.'
      }
    },
    {
      slug: 'advanced',
      title: 'Advanced',
      description: 'Advanced GRC practices including audits and metrics',
      order_number: 3,
      estimated_duration_hours: 12,
      modules: [
        {
          slug: 'audit-preparation-and-evidence',
          title: 'Audit Preparation & Evidence Collection',
          description: 'Preparing for audits and managing evidence effectively',
          order_number: 1,
          estimated_duration_minutes: 65,
          content_count: 4
        },
        {
          slug: 'advanced-risk-treatment',
          title: 'Advanced Risk Treatment Strategies',
          description: 'Sophisticated approaches to risk mitigation and treatment',
          order_number: 2,
          estimated_duration_minutes: 70,
          content_count: 4
        },
        {
          slug: 'metrics-and-kpis-for-grc',
          title: 'GRC Metrics & KPIs',
          description: 'Measuring and reporting GRC program effectiveness',
          order_number: 3,
          estimated_duration_minutes: 55,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'grc-advanced-assessment',
        title: 'GRC Advanced Assessment',
        description: 'Mini internal audit simulation: Prepare evidence and respond to audit findings.',
        missions: [
          { mission_slug: 'internal-audit-simulation' },
          { mission_slug: 'evidence-collection-case' }
        ],
        recipes: ['grc-audit-evidence-management', 'grc-metrics-dashboard-basics'],
        reflection_prompt: 'In 7–9 sentences, explain how you would design and implement a metrics program to demonstrate GRC program value to executive leadership.'
      }
    },
    {
      slug: 'mastery',
      title: 'Mastery',
      description: 'Strategic GRC leadership and board-level practices',
      order_number: 4,
      estimated_duration_hours: 14,
      modules: [
        {
          slug: 'grc-program-design',
          title: 'GRC Program Design & Strategy',
          description: 'Designing comprehensive GRC programs from the ground up',
          order_number: 1,
          estimated_duration_minutes: 75,
          content_count: 4
        },
        {
          slug: 'regulatory-landscape-africa',
          title: 'Regulatory Landscape in Africa',
          description: 'Understanding African regulatory requirements and compliance frameworks',
          order_number: 2,
          estimated_duration_minutes: 80,
          content_count: 4
        },
        {
          slug: 'board-reporting-and-risk-appetite',
          title: 'Board Reporting & Risk Appetite',
          description: 'Communicating GRC matters to board level and defining risk appetite',
          order_number: 3,
          estimated_duration_minutes: 70,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'grc-mastery-assessment',
        title: 'GRC Mastery Assessment',
        description: 'Strategic case study: Build and present a high-level GRC program pitch for an African financial institution.',
        missions: [
          { mission_slug: 'grc-program-pitch-development' },
          { mission_slug: 'board-presentation-simulation' }
        ],
        recipes: ['grc-program-roadmap-template', 'grc-board-reporting-framework'],
        reflection_prompt: 'In 8–10 sentences, describe how you would establish and lead a world-class GRC program in an African context, considering cultural, regulatory, and resource challenges.'
      }
    }
  ]
};

/**
 * GET /api/curriculum/grc
 * Returns the complete GRC track curriculum structure
 */
export async function GET(request: NextRequest) {
  try {
    // In production, this would query the database for GRC track data
    // const curriculum = await getTrackCurriculum('grc');

    return NextResponse.json(mockGrcCurriculum);

  } catch (error: any) {
    console.error('Failed to fetch GRC curriculum:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GRC curriculum' },
      { status: 500 }
    );
  }
}
