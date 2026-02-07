import { NextRequest, NextResponse } from 'next/server';

// Mock GRC level data - replace with database queries
const mockGrcLevels = {
  'beginner': {
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
        content_items: [
          {
            id: 'grc-foundations-what-is-grc',
            slug: 'what-is-grc',
            title: 'What is GRC in Cybersecurity?',
            content_type: 'video',
            video_url: 'https://videos.och.local/grc/beginner/what-is-grc.mp4',
            duration_seconds: 360,
            order_number: 1
          },
          {
            id: 'grc-foundations-governance-risk-compliance-differences',
            slug: 'governance-risk-compliance-differences',
            title: 'Governance vs Risk vs Compliance',
            content_type: 'video',
            video_url: 'https://videos.och.local/grc/beginner/governance-risk-compliance-differences.mp4',
            duration_seconds: 420,
            order_number: 2
          },
          {
            id: 'grc-foundations-grc-roles-in-organizations',
            slug: 'grc-roles-in-organizations',
            title: 'Who Does What in GRC?',
            content_type: 'video',
            video_url: 'https://videos.och.local/grc/beginner/grc-roles-in-organizations.mp4',
            duration_seconds: 300,
            order_number: 3
          },
          {
            id: 'grc-foundations-quiz',
            slug: 'grc-foundations-quiz',
            title: 'GRC Foundations Quiz',
            content_type: 'quiz',
            quiz_data: {
              questions: [
                {
                  id: 'q1',
                  type: 'mcq',
                  prompt: 'What does GRC stand for?',
                  choices: [
                    'Governance, Risk, and Compliance',
                    'Governance, Reporting, and Controls',
                    'General Risk and Compliance',
                    'Global Regulatory Compliance'
                  ],
                  correctIndex: 0
                },
                {
                  id: 'q2',
                  type: 'mcq',
                  prompt: 'Which of the following is primarily concerned with setting policies and ensuring organizational objectives are met?',
                  choices: [
                    'Risk Management',
                    'Compliance',
                    'Governance',
                    'Auditing'
                  ],
                  correctIndex: 2
                }
              ]
            },
            order_number: 4
          }
        ]
      },
      {
        slug: 'policies-and-standards-intro',
        title: 'Policies, Standards & Frameworks',
        description: 'Introduction to policies, standards, procedures and common frameworks',
        order_number: 2,
        estimated_duration_minutes: 50,
        content_items: [
          {
            id: 'policies-standards-policies-vs-standards-vs-procedures',
            slug: 'policies-vs-standards-vs-procedures',
            title: 'Policies vs Standards vs Procedures',
            content_type: 'video',
            video_url: 'https://videos.och.local/grc/beginner/policies-vs-standards-vs-procedures.mp4',
            duration_seconds: 480,
            order_number: 1
          },
          {
            id: 'policies-standards-common-frameworks-overview',
            slug: 'common-frameworks-overview',
            title: 'Common Frameworks: ISO 27001, NIST CSF',
            content_type: 'video',
            video_url: 'https://videos.och.local/grc/beginner/common-frameworks-overview.mp4',
            duration_seconds: 540,
            order_number: 2
          },
          {
            id: 'policies-standards-african-context-frameworks',
            slug: 'african-context-frameworks',
            title: 'Frameworks in African Context (AFRINIC, etc.)',
            content_type: 'video',
            video_url: 'https://videos.och.local/grc/beginner/african-context-frameworks.mp4',
            duration_seconds: 360,
            order_number: 3
          },
          {
            id: 'policies-standards-quiz',
            slug: 'policies-standards-quiz',
            title: 'Policies & Standards Quiz',
            content_type: 'quiz',
            quiz_data: { questions: [] },
            order_number: 4
          }
        ]
      },
      {
        slug: 'risk-assessment-basics',
        title: 'Risk Assessment Fundamentals',
        description: 'Basic concepts of risk identification, assessment, and management',
        order_number: 3,
        estimated_duration_minutes: 40,
        content_items: [
          {
            id: 'risk-assessment-risk-register-basics',
            slug: 'risk-register-basics',
            title: 'What is a Risk Register?',
            content_type: 'video',
            video_url: 'https://videos.och.local/grc/beginner/risk-register-basics.mp4',
            duration_seconds: 300,
            order_number: 1
          },
          {
            id: 'risk-assessment-impact-vs-likelihood',
            slug: 'impact-vs-likelihood',
            title: 'Impact vs Likelihood Assessment',
            content_type: 'video',
            video_url: 'https://videos.och.local/grc/beginner/impact-vs-likelihood.mp4',
            duration_seconds: 420,
            order_number: 2
          },
          {
            id: 'risk-assessment-basic-controls-examples',
            slug: 'basic-controls-examples',
            title: 'Basic Control Examples & Categories',
            content_type: 'video',
            video_url: 'https://videos.och.local/grc/beginner/basic-controls-examples.mp4',
            duration_seconds: 360,
            order_number: 3
          },
          {
            id: 'risk-assessment-quiz',
            slug: 'risk-assessment-quiz',
            title: 'Risk Assessment Quiz',
            content_type: 'quiz',
            quiz_data: { questions: [] },
            order_number: 4
          }
        ]
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
  }
};

/**
 * GET /api/curriculum/grc/[levelSlug]
 * Returns detailed information for a specific GRC level including modules and content
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ levelSlug: string }> }
) {
  try {
    const { levelSlug } = await params;
    const level = mockGrcLevels[levelSlug as keyof typeof mockGrcLevels];

    if (!level) {
      return NextResponse.json(
        { error: 'GRC level not found' },
        { status: 404 }
      );
    }

    // In production, this would query the database for the specific level
    // const level = await getGrcLevel(levelSlug);

    return NextResponse.json({
      level: {
        ...level,
        track_slug: 'grc'
      }
    });

  } catch (error: any) {
    console.error('Failed to fetch GRC level:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GRC level' },
      { status: 500 }
    );
  }
}
