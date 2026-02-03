import { NextRequest, NextResponse } from 'next/server';

// Mock Offensive curriculum data - replace with database queries
const mockOffensiveCurriculum = {
  track: {
    slug: 'offensive',
    title: 'Offensive Track',
    description: 'Penetration testing, red teaming, and adversary emulation for African enterprise targets.',
    icon_key: 'offensive'
  },
  levels: [
    {
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
          content_count: 4
        },
        {
          slug: 'port-scanning-nmap',
          title: 'Port Scanning with Nmap',
          description: 'Mastering Nmap for network reconnaissance',
          order_number: 2,
          estimated_duration_minutes: 55,
          content_count: 4
        },
        {
          slug: 'web-recon-basics',
          title: 'Web Reconnaissance Basics',
          description: 'Web application reconnaissance techniques',
          order_number: 3,
          estimated_duration_minutes: 45,
          content_count: 4
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
    },
    {
      slug: 'intermediate',
      title: 'Intermediate',
      description: 'Exploitation fundamentals and vulnerability assessment',
      order_number: 2,
      estimated_duration_hours: 12,
      modules: [
        {
          slug: 'vulnerability-scanning',
          title: 'Vulnerability Scanning',
          description: 'Using automated tools to identify vulnerabilities',
          order_number: 1,
          estimated_duration_minutes: 65,
          content_count: 4
        },
        {
          slug: 'web-app-exploitation',
          title: 'Web Application Exploitation',
          description: 'Common web application vulnerabilities and exploitation',
          order_number: 2,
          estimated_duration_minutes: 70,
          content_count: 4
        },
        {
          slug: 'password-attacks',
          title: 'Password Attacks',
          description: 'Cracking and attacking password security',
          order_number: 3,
          estimated_duration_minutes: 55,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'offensive-intermediate-assessment',
        title: 'Exploit a Vulnerable Web Application',
        description: 'Identify and exploit vulnerabilities in a deliberately vulnerable web application.',
        missions: [
          { mission_slug: 'web-app-exploitation-exercise' }
        ],
        recipes: ['offensive-sql-injection-guide', 'offensive-xss-exploitation', 'offensive-password-cracking-basics'],
        reflection_prompt: 'Describe the vulnerabilities you found and exploited. What was your methodology and what lessons did you learn?'
      }
    },
    {
      slug: 'advanced',
      title: 'Advanced',
      description: 'Post-exploitation and evasion techniques',
      order_number: 3,
      estimated_duration_hours: 13,
      modules: [
        {
          slug: 'post-exploitation',
          title: 'Post-Exploitation Techniques',
          description: 'Maintaining access and privilege escalation after initial compromise',
          order_number: 1,
          estimated_duration_minutes: 75,
          content_count: 4
        },
        {
          slug: 'evasion-detection',
          title: 'Evasion and Detection Avoidance',
          description: 'Bypassing security controls and avoiding detection',
          order_number: 2,
          estimated_duration_minutes: 70,
          content_count: 4
        },
        {
          slug: 'wireless-attacks',
          title: 'Wireless Network Attacks',
          description: 'Attacking WiFi networks and wireless protocols',
          order_number: 3,
          estimated_duration_minutes: 65,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'offensive-advanced-assessment',
        title: 'Red Team Engagement Simulation',
        description: 'Simulate a red team engagement including initial access, privilege escalation, and persistence.',
        missions: [
          { mission_slug: 'red-team-simulation' }
        ],
        recipes: ['offensive-post-exploitation-guide', 'offensive-evasion-techniques', 'offensive-wireless-pentesting'],
        reflection_prompt: 'Describe your red team simulation approach. What techniques worked well and what challenges did you encounter?'
      }
    },
    {
      slug: 'mastery',
      title: 'Mastery',
      description: 'Red team operations and advanced adversary emulation',
      order_number: 4,
      estimated_duration_hours: 15,
      modules: [
        {
          slug: 'red-team-methodology',
          title: 'Red Team Methodology',
          description: 'Structured approach to red team operations',
          order_number: 1,
          estimated_duration_minutes: 80,
          content_count: 4
        },
        {
          slug: 'advanced-exploitation',
          title: 'Advanced Exploitation Techniques',
          description: '0-day exploits, custom weaponization, and advanced techniques',
          order_number: 2,
          estimated_duration_minutes: 85,
          content_count: 4
        },
        {
          slug: 'adversary-emulation',
          title: 'Adversary Emulation',
          description: 'Emulating real-world threat actors and techniques',
          order_number: 3,
          estimated_duration_minutes: 75,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'offensive-mastery-assessment',
        title: 'Full Red Team Operation Report',
        description: 'Execute a complete red team engagement and deliver a professional report with findings and recommendations.',
        missions: [
          { mission_slug: 'complete-red-team-operation' }
        ],
        recipes: ['offensive-red-team-methodology', 'offensive-advanced-exploitation', 'offensive-adversary-emulation'],
        reflection_prompt: 'Describe your complete red team operation. What was your most sophisticated technique and how would you improve it for future engagements?'
      }
    }
  ]
};

/**
 * GET /api/curriculum/offensive
 * Returns the complete Offensive track curriculum structure
 */
export async function GET(request: NextRequest) {
  try {
    // In production, this would query the database for Offensive track data
    // const curriculum = await getTrackCurriculum('offensive');

    return NextResponse.json(mockOffensiveCurriculum);

  } catch (error: any) {
    console.error('Failed to fetch Offensive curriculum:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Offensive curriculum' },
      { status: 500 }
    );
  }
}
