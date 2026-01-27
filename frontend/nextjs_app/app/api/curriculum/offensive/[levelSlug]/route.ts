import { NextRequest, NextResponse } from 'next/server';

// Mock Offensive level data - replace with database queries
const mockOffensiveLevels = {
  'beginner': {
    slug: 'beginner',
    title: 'Beginner',
    description: 'Reconnaissance and enumeration fundamentals',
    order_number: 1,
    estimated_duration_hours: 10,
    modules: [
      {
        slug: 'recon-fundamentals',
        title: 'Reconnaissance Fundamentals',
        description: 'Active and passive reconnaissance techniques',
        order_number: 1,
        estimated_duration_minutes: 50,
        content_items: [
          {
            id: 'recon-fundamentals-active-vs-passive-recon',
            slug: 'active-vs-passive-recon',
            title: 'Active vs Passive Reconnaissance',
            content_type: 'video',
            video_url: 'https://videos.och.local/offensive/beginner/active-vs-passive-recon.mp4',
            duration_seconds: 360,
            order_number: 1,
            completed: false
          },
          {
            id: 'recon-fundamentals-dns-enumeration-techniques',
            slug: 'dns-enumeration-techniques',
            title: 'DNS Enumeration Techniques',
            content_type: 'video',
            video_url: 'https://videos.och.local/offensive/beginner/dns-enumeration-techniques.mp4',
            duration_seconds: 420,
            order_number: 2,
            completed: false
          },
          {
            id: 'recon-fundamentals-whois-and-asn-lookup',
            slug: 'whois-and-asn-lookup',
            title: 'WHOIS and ASN Lookup',
            content_type: 'video',
            video_url: 'https://videos.och.local/offensive/beginner/whois-and-asn-lookup.mp4',
            duration_seconds: 300,
            order_number: 3,
            completed: false
          },
          {
            id: 'recon-fundamentals-quiz',
            slug: 'reconnaissance-basics-quiz',
            title: 'Reconnaissance Basics Quiz',
            content_type: 'quiz',
            quiz_data: {
              questions: [
                {
                  id: 'q1',
                  type: 'mcq',
                  prompt: 'Which type of reconnaissance involves directly interacting with the target?',
                  choices: [
                    'Passive reconnaissance',
                    'Active reconnaissance',
                    'Internal reconnaissance',
                    'External reconnaissance'
                  ],
                  correctIndex: 1
                },
                {
                  id: 'q2',
                  type: 'mcq',
                  prompt: 'What information can be gathered from a WHOIS lookup?',
                  choices: [
                    'Domain registration details and contact information',
                    'Internal network topology',
                    'User passwords',
                    'Database contents'
                  ],
                  correctIndex: 0
                }
              ]
            },
            order_number: 4,
            completed: false,
            score: null
          }
        ]
      },
      {
        slug: 'port-scanning-nmap',
        title: 'Port Scanning with Nmap',
        description: 'Mastering Nmap for network reconnaissance',
        order_number: 2,
        estimated_duration_minutes: 55,
        content_items: [
          {
            id: 'port-scanning-nmap-scan-types-explained',
            slug: 'nmap-scan-types-explained',
            title: 'Nmap Scan Types Explained',
            content_type: 'video',
            video_url: 'https://videos.och.local/offensive/beginner/nmap-scan-types-explained.mp4',
            duration_seconds: 480,
            order_number: 1,
            completed: false
          },
          {
            id: 'port-scanning-nmap-scripting-engine-nse',
            slug: 'nmap-scripting-engine-nse',
            title: 'Nmap Scripting Engine (NSE)',
            content_type: 'video',
            video_url: 'https://videos.och.local/offensive/beginner/nmap-scripting-engine-nse.mp4',
            duration_seconds: 420,
            order_number: 2,
            completed: false
          },
          {
            id: 'port-scanning-scan-evasion-techniques',
            slug: 'scan-evasion-techniques',
            title: 'Scan Evasion Techniques',
            content_type: 'video',
            video_url: 'https://videos.och.local/offensive/beginner/scan-evasion-techniques.mp4',
            duration_seconds: 360,
            order_number: 3,
            completed: false
          },
          {
            id: 'port-scanning-quiz',
            slug: 'nmap-fundamentals-quiz',
            title: 'Nmap Fundamentals Quiz',
            content_type: 'quiz',
            quiz_data: { questions: [] },
            order_number: 4,
            completed: false,
            score: null
          }
        ]
      },
      {
        slug: 'web-recon-basics',
        title: 'Web Reconnaissance Basics',
        description: 'Web application reconnaissance techniques',
        order_number: 3,
        estimated_duration_minutes: 45,
        content_items: [
          {
            id: 'web-recon-basics-directory-busting-gobuster',
            slug: 'directory-busting-gobuster',
            title: 'Directory Busting with Gobuster',
            content_type: 'video',
            video_url: 'https://videos.och.local/offensive/beginner/directory-busting-gobuster.mp4',
            duration_seconds: 360,
            order_number: 1,
            completed: false
          },
          {
            id: 'web-recon-basics-subdomain-enumeration',
            slug: 'subdomain-enumeration',
            title: 'Subdomain Enumeration',
            content_type: 'video',
            video_url: 'https://videos.och.local/offensive/beginner/subdomain-enumeration.mp4',
            duration_seconds: 480,
            order_number: 2,
            completed: false
          },
          {
            id: 'web-recon-basics-technology-fingerprinting',
            slug: 'technology-fingerprinting',
            title: 'Technology Fingerprinting',
            content_type: 'video',
            video_url: 'https://videos.och.local/offensive/beginner/technology-fingerprinting.mp4',
            duration_seconds: 300,
            order_number: 3,
            completed: false
          },
          {
            id: 'web-recon-basics-quiz',
            slug: 'web-reconnaissance-quiz',
            title: 'Web Reconnaissance Quiz',
            content_type: 'quiz',
            quiz_data: { questions: [] },
            order_number: 4,
            completed: false,
            score: null
          }
        ]
      }
    ],
    assessment_block: {
      slug: 'offensive-beginner-assessment',
      title: 'Complete Reconnaissance Assessment',
      description: 'Conduct full reconnaissance on a target following proper methodology.',
      missions: [
        { mission_slug: 'full-recon-exercise' }
      ],
      recipes: ['offensive-nmap-basics', 'offensive-osint-recon', 'offensive-web-recon-checklist'],
      reflection_prompt: 'Document your reconnaissance methodology and explain what information you were able to gather about the target.'
    }
  }
};

/**
 * GET /api/curriculum/offensive/[levelSlug]
 * Returns detailed information for a specific Offensive level including modules and content
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { levelSlug: string } }
) {
  try {
    const levelSlug = params.levelSlug;
    const level = mockOffensiveLevels[levelSlug as keyof typeof mockOffensiveLevels];

    if (!level) {
      return NextResponse.json(
        { error: 'Offensive level not found' },
        { status: 404 }
      );
    }

    // In production, this would query the database for the specific level
    // const level = await getOffensiveLevel(levelSlug);

    return NextResponse.json({
      level: {
        ...level,
        track_slug: 'offensive'
      }
    });

  } catch (error: any) {
    console.error('Failed to fetch Offensive level:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Offensive level' },
      { status: 500 }
    );
  }
}
