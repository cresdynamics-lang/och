"""
AI Coach welcome message generation.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_welcome_message(request):
    """
    POST /api/v1/coaching/ai-coach/welcome
    Generate personalized AI welcome message based on user progress.
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
        
        # Get track info (UserTrackEnrollment, user.track_key, programs.Enrollment, ProfilerSession)
        from .services import get_user_track_info
        track_info, _, _ = get_user_track_info(user)
        if track_info == "Not enrolled in any track yet":
            track_info = "Not enrolled yet"
        
        prompt = f"""Generate a welcoming, encouraging message for {user.first_name or 'this student'} from their AI Coach.

Their progress:
- Track: {track_info}
- Missions: {progress.get('missions_completed', 0)} completed
- Recipes: {progress.get('recipes_completed', 0)} completed
- Streak: {progress.get('current_streak', 0)} days
- Avg Score: {progress.get('average_score', 0)}%

If they haven't started (0 missions, 0 recipes):
- Start with "Hi there {user.first_name}! Oh no, I see you haven't started your journey yet..."
- Be encouraging: "Worry less! As your AI Coach, I'll guide you through every step."
- End with: "Chat with me or get my recommendation to begin!"

If they have progress:
- Acknowledge their achievements specifically
- Be motivating and personal
- Encourage them to chat for more guidance

Keep it under 40 words. Be warm and supportive."""
        
        response = client.chat.completions.create(
            model='gpt-3.5-turbo',
            messages=[{'role': 'user', 'content': prompt}],
            max_tokens=80,
            temperature=0.9,
        )
        
        message = response.choices[0].message.content.strip()
        
        return Response({'message': message}, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f'Welcome message error: {e}')
        # Fallback message
        return Response({
            'message': f"Hey {user.first_name or 'there'}! Ready to level up your cybersecurity skills? Let's chat!"
        }, status=status.HTTP_200_OK)
