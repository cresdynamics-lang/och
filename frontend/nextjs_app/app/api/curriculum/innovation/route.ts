import { NextRequest, NextResponse } from 'next/server';

// Mock Innovation curriculum data - replace with database queries
const mockInnovationCurriculum = {
  track: {
    slug: 'innovation',
    title: 'Innovation Track',
    description: 'Build tomorrow\'s cyber tools. Spot emerging threats. Launch secure products for African markets.',
    icon_key: 'innovation'
  },
  levels: [
    {
      slug: 'beginner',
      title: 'Beginner',
      description: 'Innovation foundations and basic cyber creativity',
      order_number: 1,
      estimated_duration_hours: 9,
      modules: [
        {
          slug: 'innovation-mindset-basics',
          title: 'Innovation Mindset Basics',
          description: 'Developing the creative thinking patterns for cyber innovation',
          order_number: 1,
          estimated_duration_minutes: 40,
          content_count: 4
        },
        {
          slug: 'threat-research-basics',
          title: 'Threat Research Basics',
          description: 'Using OSINT and research to understand cyber threats',
          order_number: 2,
          estimated_duration_minutes: 50,
          content_count: 4
        },
        {
          slug: 'tool-prototyping-intro',
          title: 'Tool Prototyping Introduction',
          description: 'Building and validating security tool ideas quickly',
          order_number: 3,
          estimated_duration_minutes: 45,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'innovation-beginner-assessment',
        title: 'Spot the Next Threat Trend',
        description: 'Use OSINT skills to identify an emerging threat that others might be missing.',
        missions: [
          { mission_slug: 'emerging-threats-osint' }
        ],
        recipes: ['innovation-osint-basics', 'innovation-idea-validation', 'innovation-threat-trend-spotting'],
        reflection_prompt: 'In 5–7 sentences, describe the emerging threat you discovered through OSINT research and why African organizations should care about it specifically.'
      }
    },
    {
      slug: 'intermediate',
      title: 'Intermediate',
      description: 'Building and testing security innovations',
      order_number: 2,
      estimated_duration_hours: 11,
      modules: [
        {
          slug: 'security-automation-basics',
          title: 'Security Automation Basics',
          description: 'Automating security tasks with scripts and basic tools',
          order_number: 1,
          estimated_duration_minutes: 60,
          content_count: 4
        },
        {
          slug: 'threat-modeling-innovation',
          title: 'Threat Modeling for Innovation',
          description: 'Using threat modeling frameworks to guide security innovation',
          order_number: 2,
          estimated_duration_minutes: 65,
          content_count: 4
        },
        {
          slug: 'mvp-development-security',
          title: 'Secure MVP Development',
          description: 'Building secure minimum viable products for security tools',
          order_number: 3,
          estimated_duration_minutes: 55,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'innovation-intermediate-assessment',
        title: 'Build Your First Security Tool MVP',
        description: 'Create a working prototype of a security tool using automation and threat modeling.',
        missions: [
          { mission_slug: 'security-tool-mvp-development' }
        ],
        recipes: ['innovation-mvp-security-checklist', 'innovation-threat-model-template', 'innovation-automation-basics'],
        reflection_prompt: 'In 6–8 sentences, describe the security tool MVP you built, the problem it solves, and what you learned about balancing security with innovation speed.'
      }
    },
    {
      slug: 'advanced',
      title: 'Advanced',
      description: 'Scaling security innovations and advanced technologies',
      order_number: 3,
      estimated_duration_hours: 12,
      modules: [
        {
          slug: 'ai-security-innovation',
          title: 'AI for Security Innovation',
          description: 'Using AI to enhance security tools and threat detection',
          order_number: 1,
          estimated_duration_minutes: 70,
          content_count: 4
        },
        {
          slug: 'zero-trust-innovation',
          title: 'Zero Trust Architecture Innovation',
          description: 'Innovative approaches to zero trust implementation',
          order_number: 2,
          estimated_duration_minutes: 75,
          content_count: 4
        },
        {
          slug: 'blockchain-security-innovation',
          title: 'Blockchain Security Innovation',
          description: 'Securing blockchain applications and smart contracts',
          order_number: 3,
          estimated_duration_minutes: 65,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'innovation-advanced-assessment',
        title: 'Design Zero Trust for African Telco',
        description: 'Design and prototype a zero trust architecture for a major African telecommunications provider.',
        missions: [
          { mission_slug: 'zero-trust-architecture-design' }
        ],
        recipes: ['innovation-ztna-blueprint', 'innovation-blockchain-security-basics', 'innovation-ai-security-tools'],
        reflection_prompt: 'In 7–9 sentences, explain your zero trust design for the African telco, including how you addressed local challenges like intermittent connectivity and resource constraints.'
      }
    },
    {
      slug: 'mastery',
      title: 'Mastery',
      description: 'Strategic innovation leadership and cyber entrepreneurship',
      order_number: 4,
      estimated_duration_hours: 14,
      modules: [
        {
          slug: 'cyber-product-strategy',
          title: 'Cyber Product Strategy',
          description: 'Strategic thinking for cyber product development',
          order_number: 1,
          estimated_duration_minutes: 80,
          content_count: 4
        },
        {
          slug: 'venture-building-cyber',
          title: 'Building Cyber Ventures',
          description: 'Entrepreneurship and venture building in cybersecurity',
          order_number: 2,
          estimated_duration_minutes: 85,
          content_count: 4
        },
        {
          slug: 'national-cyber-innovation',
          title: 'National Cyber Innovation Programs',
          description: 'Building national-level cyber innovation initiatives',
          order_number: 3,
          estimated_duration_minutes: 75,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'innovation-mastery-assessment',
        title: 'Pitch Your Cyber Startup to VCs',
        description: 'Develop and present a complete cyber startup pitch for African market opportunities.',
        missions: [
          { mission_slug: 'cyber-startup-pitch-development' }
        ],
        recipes: ['innovation-pitch-deck-template', 'innovation-market-analysis-africa', 'innovation-funding-strategy-guide'],
        reflection_prompt: 'In 8–10 sentences, describe your cyber startup idea, the African market opportunity you identified, and how you would address the unique challenges of building cyber ventures in African markets.'
      }
    }
  ]
};

/**
 * GET /api/curriculum/innovation
 * Returns the complete Innovation track curriculum structure
 */
export async function GET(request: NextRequest) {
  try {
    // In production, this would query the database for Innovation track data
    // const curriculum = await getTrackCurriculum('innovation');

    return NextResponse.json(mockInnovationCurriculum);

  } catch (error: any) {
    console.error('Failed to fetch Innovation curriculum:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Innovation curriculum' },
      { status: 500 }
    );
  }
}
