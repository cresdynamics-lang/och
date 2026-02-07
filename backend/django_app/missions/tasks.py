"""
Background tasks for Missions MXP.
"""
import os
import logging
from django.utils import timezone
from django.db import transaction
from .models import MissionSubmission, MissionArtifact, AIFeedback
from student_dashboard.services import DashboardAggregationService
from subscriptions.utils import get_user_tier

logger = logging.getLogger(__name__)

try:
    from celery import shared_task
except ImportError:
    def shared_task(*args, **kwargs):
        def decorator(func):
            return func
        return decorator


@shared_task(name='missions.process_ai_review')
def process_mission_ai_review(submission_id: str):
    """
    AI review of mission submission.
    """
    try:
        submission = MissionSubmission.objects.get(id=submission_id)
        
        if submission.status != 'submitted':
            return {'status': 'skipped', 'message': 'Submission not in submitted status'}
        
        artifacts = MissionArtifact.objects.filter(submission=submission)
        
        openai_key = os.environ.get('CHAT_GPT_API_KEY') or os.environ.get('OPENAI_API_KEY')
        ai_coach_url = os.environ.get('AI_COACH_API_URL', 'http://localhost:8001/api/v1')
        ai_coach_key = os.environ.get('AI_COACH_API_KEY')
        
        ai_score = None
        strengths = []
        gaps = []
        suggestions = []
        competencies_detected = []
        full_feedback = {}
        
        # Try AI Coach API
        if ai_coach_key and ai_coach_url:
            try:
                import requests
                artifact_data = [
                    {'type': a.file_type, 'url': a.file_url, 'filename': a.file_name}
                    for a in artifacts
                ]
                mission = submission.assignment.mission
                response = requests.post(
                    f"{ai_coach_url}/missions/review",
                    json={
                        'mission_id': str(mission.id),
                        'mission_title': mission.title,
                        'mission_description': mission.description,
                        'mission_skills': mission.skills_tags,
                        'notes': submission.content,
                        'artifacts': artifact_data
                    },
                    headers={'Authorization': f'Bearer {ai_coach_key}'},
                    timeout=60
                )
                if response.status_code == 200:
                    data = response.json()
                    ai_score = data.get('score')
                    strengths = data.get('strengths', [])
                    gaps = data.get('gaps', [])
                    suggestions = data.get('suggestions', [])
                    competencies_detected = data.get('competencies_detected', [])
                    full_feedback = data.get('full_feedback', {})
            except Exception as e:
                logger.error(f"AI Coach API error: {e}")
        
        # Fallback to OpenAI GPT-4o-mini
        if ai_score is None and openai_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=openai_key)
                
                mission = submission.assignment.mission
                prompt = f"""Review this cybersecurity mission submission and return JSON:
{{
  "score": 0-100,
  "strengths": ["list of strengths"],
  "gaps": ["list of gaps"],
  "suggestions": ["list of improvements"],
  "competencies_detected": [{{"name": "SIEM", "level": 3}}],
  "full_feedback": {{
    "correctness": "assessment",
    "missed_requirements": ["list"],
    "suggested_improvements": ["list"]
  }}
}}

Mission: {mission.title}
Description: {mission.description}
Skills: {mission.skills_tags}
Notes: {submission.content}
Artifacts: {[f"{a.file_type}: {a.file_name or a.file_url}" for a in artifacts]}
"""
                
                response = client.chat.completions.create(
                    model=os.environ.get('AI_COACH_MODEL', 'gpt-4o-mini'),
                    messages=[
                        {'role': 'system', 'content': 'You are a cybersecurity mission reviewer. Return only valid JSON.'},
                        {'role': 'user', 'content': prompt}
                    ],
                    temperature=0.3,
                    max_tokens=1000
                )
                
                import json
                data = json.loads(response.choices[0].message.content)
                ai_score = data.get('score', 75)
                strengths = data.get('strengths', [])
                gaps = data.get('gaps', [])
                suggestions = data.get('suggestions', [])
                competencies_detected = data.get('competencies_detected', [])
                full_feedback = data.get('full_feedback', {})
            except Exception as e:
                logger.error(f"OpenAI error: {e}")
        
        # Default if AI unavailable
        if ai_score is None:
            ai_score = 75
            strengths = ['Submission received']
            gaps = []
            suggestions = ['Review pending']
        
        # Update submission and create AI feedback
        with transaction.atomic():
            submission.ai_score = ai_score
            submission.ai_reviewed_at = timezone.now()
            
            # Create or update AI feedback
            ai_feedback, created = AIFeedback.objects.get_or_create(
                submission=submission,
                defaults={
                    'score': ai_score,
                    'strengths': strengths,
                    'gaps': gaps,
                    'suggestions': suggestions,
                    'competencies_detected': competencies_detected,
                    'full_feedback': full_feedback,
                }
            )
            if not created:
                ai_feedback.score = ai_score
                ai_feedback.strengths = strengths
                ai_feedback.gaps = gaps
                ai_feedback.suggestions = suggestions
                ai_feedback.competencies_detected = competencies_detected
                ai_feedback.full_feedback = full_feedback
                ai_feedback.save()
            
            # Update status to ai_reviewed (ready for mentor review if tier 7)
            submission.status = 'ai_reviewed'
            submission.save()
            
            # Auto-link to portfolio if approved (for non-tier-7 auto-approval)
            user_tier = get_user_tier(submission.student)
            mission = submission.assignment.mission
            if user_tier == 'professional_7':
                # Tier 7 waits for mentor review
                pass
            elif submission.status == 'approved':
                try:
                    from portfolio.models import PortfolioItem
                    portfolio_item, created = PortfolioItem.objects.get_or_create(
                        user=submission.student,
                        source_type='mission',
                        source_id=str(mission.id),
                        defaults={
                            'title': f"Mission: {mission.title}",
                            'description': mission.description,
                            'skills': mission.skills_tags,
                        }
                    )
                    submission.portfolio_item_id = portfolio_item.id
                    submission.save()

                    # Update TalentScope readiness
                    try:
                        from talentscope.services import TalentScopeService
                        TalentScopeService.update_readiness_from_mission(
                            submission.student.uuid_id,
                            mission.id,
                            float(ai_score)
                        )
                    except Exception:
                        pass
                except Exception:
                    pass

        # Trigger dashboard refresh
        try:
            DashboardAggregationService.queue_update(submission.student, 'mission_reviewed', 'high')
        except Exception as e:
            logger.warning(f"Dashboard update failed: {e}")
        
        logger.info(f"AI reviewed mission submission {submission_id}: score={ai_score}")
        return {'status': 'success', 'score': ai_score}
        
    except MissionSubmission.DoesNotExist:
        logger.error(f"Submission {submission_id} not found")
        return {'status': 'error', 'message': 'Submission not found'}
    except Exception as e:
        logger.error(f"Error reviewing mission: {e}", exc_info=True)
        return {'status': 'error', 'message': str(e)}



