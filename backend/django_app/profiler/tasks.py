"""
Background tasks for Profiler Engine.
"""
import os
import logging
from django.utils import timezone
from django.db import transaction
from .models import ProfilerSession, ProfilerAnswer
from student_dashboard.services import DashboardAggregationService

logger = logging.getLogger(__name__)

try:
    from celery import shared_task
except ImportError:
    # Fallback if Celery not installed
    def shared_task(*args, **kwargs):
        def decorator(func):
            return func
        return decorator


@shared_task(name='profiler.generate_future_you')
def generate_future_you_task(session_id: str):
    """
    Generate Future-You persona using AI.
    """
    try:
        session = ProfilerSession.objects.get(id=session_id)
        answers = ProfilerAnswer.objects.filter(session=session)
        
        # Collect answers
        answers_data = {}
        for answer in answers:
            answers_data[answer.question_key] = answer.answer
        
        # Generate persona using OpenAI or AI Coach API
        openai_key = os.environ.get('OPENAI_API_KEY')
        ai_coach_url = os.environ.get('AI_COACH_API_URL', 'http://localhost:8001/api/v1')
        ai_coach_key = os.environ.get('AI_COACH_API_KEY')
        
        persona = None
        
        # Try AI Coach API first
        if ai_coach_key and ai_coach_url:
            try:
                import requests
                response = requests.post(
                    f"{ai_coach_url}/profiler/generate-persona",
                    json={'answers': answers_data},
                    headers={'Authorization': f'Bearer {ai_coach_key}'},
                    timeout=30
                )
                if response.status_code == 200:
                    persona = response.json()
            except Exception as e:
                logger.error(f"AI Coach API error: {e}")
        
        # Fallback to OpenAI
        if not persona and openai_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=openai_key)
                
                prompt = f"""Generate a Future-You cyber persona based on these assessment answers:
{answers_data}

Return JSON with:
- name: Creative persona name (e.g., "Cyber Sentinel")
- archetype: One of ["Defender", "Hunter", "Analyst", "Architect", "Leader"]
- projected_skills: Array of 5-7 skills they'll master
- track: Recommended career track
- confidence: 0.0-1.0 confidence score
"""
                
                response = client.chat.completions.create(
                    model=os.environ.get('AI_COACH_MODEL', 'gpt-4'),
                    messages=[
                        {'role': 'system', 'content': 'You are a cybersecurity career advisor. Return only valid JSON.'},
                        {'role': 'user', 'content': prompt}
                    ],
                    temperature=0.7,
                    max_tokens=500
                )
                
                import json
                persona = json.loads(response.choices[0].message.content)
            except Exception as e:
                logger.error(f"OpenAI error: {e}")
        
        # Fallback to default persona
        if not persona:
            persona = {
                'name': 'Cyber Sentinel',
                'archetype': 'Defender',
                'projected_skills': ['SIEM', 'Incident Response', 'Threat Hunting'],
                'track': 'SOC Analyst',
                'confidence': 0.75
            }
        
        # Update session
        with transaction.atomic():
            session.futureyou_persona = persona
            session.recommended_track_id = persona.get('track_id')  # Would need track lookup
            session.track_confidence = persona.get('confidence', 0.75)
            session.status = 'finished'
            session.completed_at = timezone.now()
            session.save()
            
            # Update user's futureyou_persona and onboarding status
            session.user.futureyou_persona = persona
            if not session.user.onboarding_complete:
                session.user.onboarding_complete = True
            session.user.save()
        
        # Trigger dashboard refresh
        DashboardAggregationService.queue_update(session.user, 'profiler_complete', 'urgent')
        
        logger.info(f"Generated Future-You persona for session {session_id}")
        return {'status': 'success', 'persona': persona}
        
    except ProfilerSession.DoesNotExist:
        logger.error(f"Session {session_id} not found")
        return {'status': 'error', 'message': 'Session not found'}
    except Exception as e:
        logger.error(f"Error generating persona: {e}", exc_info=True)
        return {'status': 'error', 'message': str(e)}

