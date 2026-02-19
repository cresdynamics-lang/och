"""
AI Coach recommendation generation.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_recommendation(request):
    """
    POST /api/v1/coaching/ai-coach/recommendation
    Generate personalized AI recommendation based on student state.
    """
    user = request.user
    progress = request.data.get('progress', {})
    
    try:
        import os
        from openai import OpenAI
        
        api_key = os.environ.get('CHAT_GPT_API_KEY') or os.environ.get('OPENAI_API_KEY')
        if not api_key:
            raise Exception('OpenAI API key not configured')
        
        client = OpenAI(api_key=api_key)
        
        # Get track info
        track_info = "Not enrolled yet"
        try:
            from curriculum.models import UserTrackEnrollment
            enrollment = UserTrackEnrollment.objects.filter(user=user).first()
            if enrollment and enrollment.track:
                track_info = f"{enrollment.track.name}"
        except:
            pass
        
        prompt = f"""As {user.first_name}'s AI Coach, provide a personalized recommendation.

Student Profile:
- Name: {user.first_name} {user.last_name or ''}
- Track: {track_info}
- Missions Completed: {progress.get('missions_completed', 0)}
- Recipes Completed: {progress.get('recipes_completed', 0)}
- Average Score: {progress.get('average_score', 0)}%
- Learning Streak: {progress.get('current_streak', 0)} days
- Weak Areas: {', '.join(progress.get('weak_areas', [])) or 'None identified'}
- Strengths: {', '.join(progress.get('strengths', [])) or 'Assessment pending'}

Provide:
1. A specific next step (recipe or mission to try)
2. One area to focus on improving
3. A motivational message

Keep it under 100 words. Be specific and actionable."""
        
        response = client.chat.completions.create(
            model='gpt-3.5-turbo',
            messages=[{'role': 'user', 'content': prompt}],
            max_tokens=150,
            temperature=0.7,
        )
        
        recommendation = response.choices[0].message.content.strip()
        
        # Log as AI coach message for usage tracking
        from .models import AICoachSession, AICoachMessage
        session, _ = AICoachSession.objects.get_or_create(
            user=user,
            session_type='recommendation',
            defaults={'prompt_count': 0}
        )
        
        AICoachMessage.objects.create(
            session=session,
            role='assistant',
            content=recommendation,
            context='recommendation',
            metadata={'progress': progress}
        )
        
        session.prompt_count += 1
        session.save()
        
        return Response({'recommendation': recommendation}, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f'Recommendation error: {e}')
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
