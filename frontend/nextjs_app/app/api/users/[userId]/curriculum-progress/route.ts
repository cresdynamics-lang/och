import { NextRequest, NextResponse } from 'next/server';
import { emitCurriculumVideoCompleted, emitCurriculumQuizCompleted, emitCoachingEvent } from '@/lib/coaching-events';

interface CurriculumProgressUpdate {
  content_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  quiz_score?: number;
  video_progress_seconds?: number;
  video_duration_seconds?: number;
  last_position_resume?: boolean;
}

/**
 * POST /api/users/:userId/curriculum-progress
 * Update curriculum content progress and emit coaching events
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body: CurriculumProgressUpdate = await request.json();

    const {
      content_id,
      status,
      quiz_score,
      video_progress_seconds,
      video_duration_seconds,
      last_position_resume
    } = body;

    if (!content_id || !status) {
      return NextResponse.json(
        { error: 'content_id and status are required' },
        { status: 400 }
      );
    }

    // For now, we'll mock the database update since the backend isn't running
    // In production, this would update the user_content_progress table
    console.log(`Updating curriculum progress for user ${userId}:`, {
      content_id,
      status,
      quiz_score,
      video_progress_seconds,
      video_duration_seconds,
      last_position_resume
    });

    // Mock successful database update
    const mockUpdateResult = {
      user_id: userId,
      content_id,
      status,
      quiz_score,
      video_progress_seconds,
      video_duration_seconds,
      last_position_resume,
      updated_at: new Date().toISOString()
    };

    // Emit coaching events based on completion type
    if (status === 'completed') {
      // Parse content_id to extract metadata (in production this would come from DB)
      // For now, we'll use mock data to demonstrate the concept
      const mockContentMetadata = parseContentIdForMetadata(content_id);

      if (mockContentMetadata) {
        const skillCodes = getSkillCodesForContent(mockContentMetadata);

        if (mockContentMetadata.type === 'video') {
          await emitCoachingEvent({
            user_id: userId,
            event_type: 'curriculum_video_completed',
            payload: {
              track_slug: mockContentMetadata.track_slug,
              level_slug: mockContentMetadata.level_slug,
              module_slug: mockContentMetadata.module_slug,
              content_slug: mockContentMetadata.content_slug,
              skill_codes: skillCodes,
              video_duration_seconds: video_duration_seconds || 0,
              completion_percentage: 100
            }
          });

          // Also emit the legacy event for backward compatibility
          await emitCurriculumVideoCompleted(
            userId,
            mockContentMetadata.track_slug,
            mockContentMetadata.level_slug,
            mockContentMetadata.module_slug,
            mockContentMetadata.content_slug
          );
        } else if (mockContentMetadata.type === 'quiz' && quiz_score !== undefined) {
          await emitCoachingEvent({
            user_id: userId,
            event_type: 'curriculum_quiz_completed',
            payload: {
              track_slug: mockContentMetadata.track_slug,
              level_slug: mockContentMetadata.level_slug,
              module_slug: mockContentMetadata.module_slug,
              content_slug: mockContentMetadata.content_slug,
              skill_codes: skillCodes,
              quiz_score: quiz_score,
              quiz_score_percentage: (quiz_score / 100) * 100, // Assuming score is out of 100
              passed: quiz_score >= 70 // Assuming 70% is passing
            }
          });

          // Also emit the legacy event for backward compatibility
          await emitCurriculumQuizCompleted(
            userId,
            mockContentMetadata.track_slug,
            mockContentMetadata.level_slug,
            mockContentMetadata.module_slug,
            mockContentMetadata.content_slug,
            quiz_score
          );
        }
      }
    }

    // Emit assessment completion events
    if (content_id.includes('assessment') && status === 'completed') {
      const mockContentMetadata = parseContentIdForMetadata(content_id);
      if (mockContentMetadata) {
        await emitCoachingEvent({
          user_id: userId,
          event_type: 'curriculum_assessment_completed',
          payload: {
            track_slug: mockContentMetadata.track_slug,
            level_slug: mockContentMetadata.level_slug,
            assessment_slug: mockContentMetadata.content_slug,
            skill_codes: getSkillCodesForContent(mockContentMetadata),
            assessment_type: 'level_assessment',
            completion_score: quiz_score || 100
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      progress: mockUpdateResult
    });

  } catch (error: any) {
    console.error('Curriculum progress update failed:', error);
    return NextResponse.json(
      { error: 'Failed to update curriculum progress' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to parse content_id and extract metadata
 * In production, this information would be retrieved from the database
 */
function parseContentIdForMetadata(contentId: string) {
  // Mock parsing logic - in production this would query the curriculum_content table
  // to get track_slug, level_slug, module_slug, content_slug, and type

  // Example content_id format: "defender-beginner-log-analysis-fundamentals-what-are-logs-video"
  const parts = contentId.split('-');

  if (parts.length >= 6) {
    const [track_slug, level_slug, ...rest] = parts;
    const content_slug = rest.slice(-2, -1)[0]; // Second to last part
    const type = rest.slice(-1)[0]; // Last part (video/quiz)

    // Find module_slug (everything between level_slug and content_slug)
    const moduleParts = rest.slice(0, -2);
    const module_slug = moduleParts.join('-');

    return {
      track_slug,
      level_slug,
      module_slug,
      content_slug,
      type: type === 'video' ? 'video' : 'quiz'
    };
  }

  return null;
}

/**
 * Get skill codes associated with content based on track/module
 * In production, this would be stored in the database with content metadata
 */
function getSkillCodesForContent(metadata: any): string[] {
  const { track_slug, module_slug, type } = metadata;

  // Skill code mappings by track and module
  const skillMappings: Record<string, Record<string, string[]>> = {
    defender: {
      'log-analysis-fundamentals': ['log_parsing', 'event_analysis', 'security_monitoring'],
      'siem-searching-basics': ['siem_queries', 'log_correlation', 'threat_detection'],
      'alert-triage-intro': ['alert_analysis', 'threat_prioritization', 'incident_response']
    },
    grc: {
      'grc-foundations': ['risk_assessment', 'compliance_basics', 'policy_understanding'],
      'policies-and-standards-intro': ['policy_analysis', 'standards_compliance', 'governance_basics'],
      'risk-assessment-basics': ['risk_identification', 'impact_analysis', 'control_evaluation']
    },
    innovation: {
      'innovation-mindset-basics': ['problem_identification', 'creative_thinking', 'solution_design'],
      'threat-research-basics': ['threat_intelligence', 'osint_analysis', 'trend_identification'],
      'tool-prototyping-intro': ['rapid_prototyping', 'tool_development', 'user_testing']
    },
    leadership: {
      'leadership-mindset-cyber': ['team_leadership', 'executive_communication', 'technical_management'],
      'communication-security': ['stakeholder_communication', 'risk_explanation', 'crisis_communication'],
      'team-dynamics-cyber': ['team_motivation', 'conflict_resolution', 'performance_management']
    },
    offensive: {
      'recon-fundamentals': ['passive_recon', 'active_scanning', 'osint_collection'],
      'port-scanning-nmap': ['network_scanning', 'service_enumeration', 'evasion_techniques'],
      'web-recon-basics': ['web_fingerprinting', 'directory_enumeration', 'subdomain_discovery']
    }
  };

  // Get skills for this track/module combination
  const trackSkills = skillMappings[track_slug] || {};
  const moduleSkills = trackSkills[module_slug] || [];

  // Add type-specific skills
  if (type === 'video') {
    moduleSkills.push('video_learning', 'conceptual_understanding');
  } else if (type === 'quiz') {
    moduleSkills.push('knowledge_assessment', 'skill_validation');
  }

  return moduleSkills;
}
