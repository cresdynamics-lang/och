"""
Coaching OS Background Tasks - AI Coach integration.
"""
from celery import shared_task
from django.conf import settings
from .models import AICoachSession, AICoachMessage
from users.models import User
import logging
import openai

logger = logging.getLogger(__name__)


@shared_task
def generate_ai_coach_response(session_id, user_message_id, context, user_id):
    """
    Generate AI Coach response using OpenAI.
    """
    try:
        session = AICoachSession.objects.get(id=session_id)
        user = User.objects.get(id=user_id)
        user_message = AICoachMessage.objects.get(id=user_message_id)
        
        # Get coaching metrics for context
        from .services import calculate_coaching_metrics
        metrics = calculate_coaching_metrics(user)
        
        # Build system prompt
        system_prompt = _build_system_prompt(context, metrics)
        
        # Get conversation history
        previous_messages = AICoachMessage.objects.filter(
            session=session
        ).order_by('created_at')[:10]  # Last 10 messages
        
        messages = [
            {'role': 'system', 'content': system_prompt}
        ]
        
        for msg in previous_messages:
            messages.append({
                'role': msg.role,
                'content': msg.content
            })
        
        # Call OpenAI
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=messages,
            max_tokens=200,
            temperature=0.7,
        )
        
        ai_content = response.choices[0].message.content
        
        # Save AI response
        ai_message = AICoachMessage.objects.create(
            session=session,
            role='assistant',
            content=ai_content,
            context=context,
        )
        
        return {
            'message_id': str(ai_message.id),
            'content': ai_content,
        }
        
    except Exception as e:
        logger.error(f"Failed to generate AI Coach response: {e}")
        # Create error message
        try:
            error_message = AICoachMessage.objects.create(
                session=session,
                role='assistant',
                content="I'm having trouble processing your request. Please try again later.",
                context=context,
            )
            return {'error': str(e), 'message_id': str(error_message.id)}
        except:
            return {'error': str(e)}


def _build_system_prompt(context, metrics):
    """Build contextual system prompt for AI Coach."""
    base_prompt = f"""
You are OCH AI Coach, a cybersecurity career transformation assistant.

User's current metrics:
- Alignment Score: {metrics.get('alignmentScore', 0)}%
- Total Streak Days: {metrics.get('totalStreakDays', 0)}
- Active Habits: {metrics.get('activeHabits', 0)}
- Completed Goals: {metrics.get('completedGoals', 0)}
- Reflections: {metrics.get('reflectionCount', 0)}

Context: {context}

Rules:
1. Always reference specific habits, goals, or missions when relevant
2. Use motivational cybersecurity professional language
3. Suggest 1-2 specific next actions
4. Tie advice to Future-You alignment score
5. Be concise (max 200 tokens)
6. Encourage daily practice and reflection

Your goal is to help the mentee build consistent habits, achieve goals, and progress toward their Future-You persona.
"""
    
    if context == 'habit':
        base_prompt += "\nFocus: Help with habit tracking, streak maintenance, and building consistency."
    elif context == 'goal':
        base_prompt += "\nFocus: Help with goal setting, progress tracking, and achievement strategies."
    elif context == 'reflection':
        base_prompt += "\nFocus: Provide insights on reflections, identify patterns, and suggest growth areas."
    elif context == 'mission':
        base_prompt += "\nFocus: Connect habits/goals to mission completion, suggest relevant missions."
    
    return base_prompt
