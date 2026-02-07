import { NextRequest, NextResponse } from 'next/server';

interface RecommendationAction {
  type: 'video' | 'quiz' | 'recipe' | 'assessment';
  track_slug?: string;
  level_slug?: string;
  module_slug?: string;
  content_slug?: string;
  recipe_slug?: string;
  title: string;
  description: string;
  reason: string;
  priority: number;
  estimated_duration_minutes?: number;
  skill_codes?: string[];
  cohort_completion_rate?: number;
}

/**
 * GET /api/users/:userId/coaching/recommendations?track_slug=defender
 * Returns personalized coaching recommendations based on user progress and track focus
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const trackSlug = searchParams.get('track_slug');

    // Mock user progress data - in production this would come from database
    const mockUserProgress = {
      completed_content: [
        'defender-beginner-log-analysis-fundamentals-what-are-logs-video',
        'defender-beginner-log-analysis-fundamentals-common-security-event-ids-video',
        'defender-beginner-siem-searching-basics-basic-search-syntax-video'
      ],
      quiz_scores: {
        'defender-beginner-log-analysis-fundamentals-log-basics-quiz': 78
      },
      current_track: trackSlug || 'defender',
      completed_modules: ['log-analysis-fundamentals'],
      weak_areas: ['log_correlation', 'threat_detection']
    };

    // Generate recommendations based on track and user progress
    const recommendations = generateRecommendations(mockUserProgress, trackSlug);

    // Sort by priority and return top recommendations
    const sortedRecommendations = recommendations
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 5); // Return top 5 recommendations

    return NextResponse.json({
      user_id: userId,
      track_slug: trackSlug,
      recommendations: sortedRecommendations,
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Failed to generate coaching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

/**
 * Generate personalized recommendations based on user progress and track focus
 */
function generateRecommendations(userProgress: any, trackSlug?: string | null): RecommendationAction[] {
  const recommendations: RecommendationAction[] = [];

  // Track-specific recommendation logic
  switch (trackSlug) {
    case 'defender':
      recommendations.push(...generateDefenderRecommendations(userProgress));
      break;
    case 'grc':
      recommendations.push(...generateGrcRecommendations(userProgress));
      break;
    case 'innovation':
      recommendations.push(...generateInnovationRecommendations(userProgress));
      break;
    case 'leadership':
      recommendations.push(...generateLeadershipRecommendations(userProgress));
      break;
    case 'offensive':
      recommendations.push(...generateOffensiveRecommendations(userProgress));
      break;
    default:
      // Cross-track recommendations when no specific track is requested
      recommendations.push(...generateCrossTrackRecommendations(userProgress));
  }

  return recommendations;
}

/**
 * Generate Defender track recommendations
 */
function generateDefenderRecommendations(userProgress: any): RecommendationAction[] {
  const recommendations: RecommendationAction[] = [];

  // Check if user struggled with log basics quiz
  if (userProgress.quiz_scores['defender-beginner-log-analysis-fundamentals-log-basics-quiz'] < 85) {
    recommendations.push({
      type: 'video',
      track_slug: 'defender',
      level_slug: 'beginner',
      module_slug: 'log-analysis-fundamentals',
      content_slug: 'event-viewer-basics',
      title: 'Event Viewer Basics',
      description: 'Master Windows Event Viewer for log analysis',
      reason: 'You scored 78% on logs quiz. This video teaches Event Viewer filtering techniques.',
      priority: 1,
      estimated_duration_minutes: 8,
      skill_codes: ['log_parsing', 'event_analysis', 'windows_logging'],
      cohort_completion_rate: 87
    });
  }

  // Recommend next module content
  if (!userProgress.completed_modules.includes('siem-searching-basics')) {
    recommendations.push({
      type: 'video',
      track_slug: 'defender',
      level_slug: 'beginner',
      module_slug: 'siem-searching-basics',
      content_slug: 'advanced-search-operators',
      title: 'Advanced SIEM Search Operators',
      description: 'Learn complex query operators for threat hunting',
      reason: 'Build on your basic SIEM knowledge with advanced search techniques.',
      priority: 2,
      estimated_duration_minutes: 12,
      skill_codes: ['siem_queries', 'threat_hunting', 'log_correlation'],
      cohort_completion_rate: 73
    });
  }

  // Recipe recommendation
  recommendations.push({
    type: 'recipe',
    recipe_slug: 'defender-log-parsing-basics',
    track_slug: 'defender',
    title: 'Log Parsing Basics',
    description: 'Hands-on log parsing techniques',
    reason: 'Strengthen your log analysis skills with practical exercises.',
    priority: 3,
    estimated_duration_minutes: 18,
    skill_codes: ['log_parsing', 'regex_patterns', 'data_extraction'],
    cohort_completion_rate: 92
  });

  // Assessment preparation
  recommendations.push({
    type: 'quiz',
    track_slug: 'defender',
    level_slug: 'beginner',
    module_slug: 'alert-triage-intro',
    content_slug: 'alert-triage-basics-quiz',
    title: 'Alert Triage Quiz',
    description: 'Test your alert analysis and prioritization skills',
    reason: 'Prepare for the beginner assessment with this practice quiz.',
    priority: 4,
    skill_codes: ['alert_analysis', 'threat_prioritization', 'incident_response']
  });

  return recommendations;
}

/**
 * Generate GRC track recommendations
 */
function generateGrcRecommendations(userProgress: any): RecommendationAction[] {
  return [
    {
      type: 'video',
      track_slug: 'grc',
      level_slug: 'beginner',
      module_slug: 'risk-assessment-basics',
      content_slug: 'risk-register-creation',
      title: 'Risk Register Creation',
      description: 'Learn to build and maintain risk registers',
      reason: 'Essential skill for compliance and risk management roles.',
      priority: 1,
      estimated_duration_minutes: 15,
      skill_codes: ['risk_assessment', 'register_management', 'compliance_basics'],
      cohort_completion_rate: 81
    },
    {
      type: 'recipe',
      recipe_slug: 'grc-risk-register-basics',
      track_slug: 'grc',
      title: 'Risk Register Template',
      description: 'Practical risk register implementation',
      reason: 'Apply risk assessment concepts with this hands-on exercise.',
      priority: 2,
      estimated_duration_minutes: 22,
      skill_codes: ['risk_identification', 'impact_analysis', 'control_evaluation'],
      cohort_completion_rate: 76
    }
  ];
}

/**
 * Generate Innovation track recommendations
 */
function generateInnovationRecommendations(userProgress: any): RecommendationAction[] {
  return [
    {
      type: 'video',
      track_slug: 'innovation',
      level_slug: 'beginner',
      module_slug: 'threat-research-basics',
      content_slug: 'osint-methodology',
      title: 'OSINT Methodology',
      description: 'Systematic approach to open source intelligence gathering',
      reason: 'Build threat research skills for innovative security solutions.',
      priority: 1,
      estimated_duration_minutes: 14,
      skill_codes: ['osint_analysis', 'threat_intelligence', 'research_methodology'],
      cohort_completion_rate: 69
    },
    {
      type: 'recipe',
      recipe_slug: 'innovation-osint-basics',
      track_slug: 'innovation',
      title: 'OSINT Tool Setup',
      description: 'Configure and use OSINT tools effectively',
      reason: 'Practical application of threat research techniques.',
      priority: 2,
      estimated_duration_minutes: 25,
      skill_codes: ['tool_configuration', 'intelligence_collection', 'data_analysis'],
      cohort_completion_rate: 58
    }
  ];
}

/**
 * Generate Leadership track recommendations
 */
function generateLeadershipRecommendations(userProgress: any): RecommendationAction[] {
  return [
    {
      type: 'video',
      track_slug: 'leadership',
      level_slug: 'beginner',
      module_slug: 'communication-security',
      content_slug: 'explaining-risk-to-executives',
      title: 'Explaining Risk to Executives',
      description: 'Master the art of communicating technical risk to business leaders',
      reason: 'Critical leadership skill for CISO and security management roles.',
      priority: 1,
      estimated_duration_minutes: 18,
      skill_codes: ['executive_communication', 'risk_explanation', 'stakeholder_management'],
      cohort_completion_rate: 84
    },
    {
      type: 'recipe',
      recipe_slug: 'leadership-risk-communication',
      track_slug: 'leadership',
      title: 'Risk Communication Framework',
      description: 'Structured approach to explaining security concepts',
      reason: 'Practice executive communication with real-world scenarios.',
      priority: 2,
      estimated_duration_minutes: 20,
      skill_codes: ['communication_frameworks', 'executive_briefing', 'risk_presentation'],
      cohort_completion_rate: 91
    }
  ];
}

/**
 * Generate Offensive track recommendations
 */
function generateOffensiveRecommendations(userProgress: any): RecommendationAction[] {
  return [
    {
      type: 'video',
      track_slug: 'offensive',
      level_slug: 'beginner',
      module_slug: 'port-scanning-nmap',
      content_slug: 'nmap-scripting-engine-nse',
      title: 'Nmap Scripting Engine (NSE)',
      description: 'Automate complex scanning tasks with NSE scripts',
      reason: 'Enhance your reconnaissance capabilities with advanced Nmap features.',
      priority: 1,
      estimated_duration_minutes: 16,
      skill_codes: ['network_scanning', 'scripting_automation', 'vulnerability_detection'],
      cohort_completion_rate: 72
    },
    {
      type: 'recipe',
      recipe_slug: 'offensive-nmap-basics',
      track_slug: 'offensive',
      title: 'Nmap Scanning Labs',
      description: 'Practice Nmap techniques in safe environments',
      reason: 'Apply scanning concepts with hands-on exercises.',
      priority: 2,
      estimated_duration_minutes: 30,
      skill_codes: ['practical_scanning', 'network_enumeration', 'scan_analysis'],
      cohort_completion_rate: 65
    }
  ];
}

/**
 * Generate cross-track recommendations when no specific track is requested
 */
function generateCrossTrackRecommendations(userProgress: any): RecommendationAction[] {
  const recommendations: RecommendationAction[] = [];

  // If user is strong in defensive skills, recommend offensive reconnaissance
  if (userProgress.completed_modules.includes('log-analysis-fundamentals')) {
    recommendations.push({
      type: 'video',
      track_slug: 'offensive',
      level_slug: 'beginner',
      module_slug: 'recon-fundamentals',
      content_slug: 'active-vs-passive-recon',
      title: 'Active vs Passive Reconnaissance',
      description: 'Learn offensive reconnaissance techniques',
      reason: 'Your defensive log analysis skills make you ready for offensive reconnaissance.',
      priority: 1,
      estimated_duration_minutes: 12,
      skill_codes: ['passive_recon', 'active_scanning', 'osint_collection'],
      cohort_completion_rate: 78
    });
  }

  // If user struggles with technical concepts, recommend leadership communication
  const quizScores = Object.values(userProgress.quiz_scores) as number[];
  if (quizScores.length > 0 && Math.max(...quizScores) < 80) {
    recommendations.push({
      type: 'video',
      track_slug: 'leadership',
      level_slug: 'beginner',
      module_slug: 'communication-security',
      content_slug: 'explaining-risk-non-tech-executives',
      title: 'Explaining Risk to Executives',
      description: 'Bridge technical and business understanding',
      reason: 'Strengthen your communication skills to explain technical concepts clearly.',
      priority: 2,
      estimated_duration_minutes: 18,
      skill_codes: ['executive_communication', 'risk_explanation', 'stakeholder_management'],
      cohort_completion_rate: 84
    });
  }

  // Innovation recommendation for creative problem-solving
  recommendations.push({
    type: 'recipe',
    recipe_slug: 'innovation-idea-validation',
    track_slug: 'innovation',
    title: 'Security Solution Ideation',
    description: 'Brainstorm innovative security solutions',
    reason: 'Apply your technical knowledge to create innovative security approaches.',
    priority: 3,
    estimated_duration_minutes: 16,
    skill_codes: ['creative_thinking', 'problem_solving', 'solution_design'],
    cohort_completion_rate: 61
  });

  return recommendations;
}