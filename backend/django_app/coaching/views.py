"""
Coaching OS API Views - Full behavioral transformation engine.
Habits, Goals, Reflections, AI Coach with platform integrations.
"""
from datetime import date, timedelta
from django.utils import timezone
from django.db.models import Q, Count, Sum, Avg
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from users.models import User
from .models import (
    Habit, HabitLog, Goal, Reflection, AICoachSession, AICoachMessage,
    StudentAnalytics, UserRecipeProgress, UserTrackProgress, UserMissionProgress,
    CommunityActivitySummary, MentorshipSession, CoachingSession
)
from .serializers import (
    HabitSerializer, HabitLogSerializer, GoalSerializer,
    ReflectionSerializer, AICoachSessionSerializer, AICoachMessageSerializer,
    StudentAnalyticsSerializer, UserRecipeProgressSerializer, UserTrackProgressSerializer,
    UserMissionProgressSerializer, CommunityActivitySummarySerializer,
    MentorshipSessionSerializer, CoachingSessionSerializer
)
from .services import (
    update_habit_streak, calculate_coaching_metrics,
    check_coaching_entitlement, emit_coaching_event
)
from subscriptions.utils import get_user_tier
from talentscope.models import BehaviorSignal
import logging

logger = logging.getLogger(__name__)


# ==================== HABITS API ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def habits_list(request):
    """
    GET /api/v1/coaching/habits
    POST /api/v1/coaching/habits
    List or create habits.
    """
    user = request.user
    
    if request.method == 'GET':
        habits = Habit.objects.filter(user=user, is_active=True).order_by('-created_at')
        serializer = HabitSerializer(habits, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    # POST - Create habit
    serializer = HabitSerializer(data=request.data)
    if serializer.is_valid():
        # Check entitlement for custom habits
        if serializer.validated_data.get('type') == 'custom':
            if not check_coaching_entitlement(user, 'custom_habits'):
                return Response(
                    {'error': 'Custom habits require subscription upgrade'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        habit = serializer.save(user=user)
        
        # Emit event
        emit_coaching_event('habit.created', {
            'user_id': str(user.id),
            'habit_id': str(habit.id),
            'type': habit.type,
        })
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def habit_detail(request, habit_id):
    """Get, update, or delete a habit."""
    try:
        habit = Habit.objects.get(id=habit_id, user=request.user)
    except Habit.DoesNotExist:
        return Response(
            {'error': 'Habit not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = HabitSerializer(habit)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        serializer = HabitSerializer(habit, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        habit.is_active = False
        habit.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_habit(request):
    """
    POST /api/v1/coaching/habits/log
    Log habit completion/skip/miss.
    """
    user = request.user
    habit_id = request.data.get('habit_id')
    status_value = request.data.get('status', 'completed')
    notes = request.data.get('notes', '')
    log_date = request.data.get('date', date.today().isoformat())
    
    if not habit_id:
        return Response(
            {'error': 'habit_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        habit = Habit.objects.get(id=habit_id, user=user)
    except Habit.DoesNotExist:
        return Response(
            {'error': 'Habit not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    with transaction.atomic():
        # Upsert habit log
        log, created = HabitLog.objects.update_or_create(
            habit=habit,
            user=user,
            date=log_date,
            defaults={
                'status': status_value,
                'notes': notes,
            }
        )
        
        # Update streak
        update_habit_streak(habit.id)
        habit.refresh_from_db()
        
        # Emit event for platform integrations
        emit_coaching_event('habit.logged', {
            'user_id': str(user.id),
            'habit_id': str(habit.id),
            'status': status_value,
            'date': log_date,
        })
        
        # Create TalentScope behavior signal
        if status_value == 'completed':
            BehaviorSignal.objects.create(
                mentee=user,
                behavior_type='study_consistency',
                value=1,
                source='habit_log',
                source_id=habit.id,
                metadata={'habit_name': habit.name, 'streak': habit.streak}
            )
    
    serializer = HabitLogSerializer(log)
    return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def habit_logs(request, habit_id):
    """Get logs for a habit."""
    try:
        habit = Habit.objects.get(id=habit_id, user=request.user)
    except Habit.DoesNotExist:
        return Response(
            {'error': 'Habit not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    logs = HabitLog.objects.filter(habit=habit)
    
    if start_date:
        logs = logs.filter(date__gte=start_date)
    if end_date:
        logs = logs.filter(date__lte=end_date)
    
    serializer = HabitLogSerializer(logs.order_by('-date'), many=True)
    return Response(serializer.data)


# ==================== GOALS API ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def goals_list(request):
    """List or create goals."""
    user = request.user
    
    if request.method == 'GET':
        goal_type = request.query_params.get('type')
        goals = Goal.objects.filter(user=user, status='active')
        
        if goal_type:
            goals = goals.filter(type=goal_type)
        
        serializer = GoalSerializer(goals.order_by('-created_at'), many=True)
        return Response(serializer.data)
    
    # POST - Create goal
    serializer = GoalSerializer(data=request.data)
    if serializer.is_valid():
        user_tier = get_user_tier(user.id)
        goal = serializer.save(
            user=user,
            subscription_tier=user_tier
        )
        
        emit_coaching_event('goal.created', {
            'user_id': str(user.id),
            'goal_id': str(goal.id),
            'type': goal.type,
        })
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def goal_detail(request, goal_id):
    """Get or update a goal."""
    try:
        goal = Goal.objects.get(id=goal_id, user=request.user)
    except Goal.DoesNotExist:
        return Response(
            {'error': 'Goal not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = GoalSerializer(goal)
        return Response(serializer.data)
    
    # PATCH - Update goal
    serializer = GoalSerializer(goal, data=request.data, partial=True)
    if serializer.is_valid():
        old_status = goal.status
        goal = serializer.save()
        
        # Check if goal was completed
        if old_status != 'completed' and goal.status == 'completed':
            emit_coaching_event('goal.completed', {
                'user_id': str(request.user.id),
                'goal_id': str(goal.id),
                'type': goal.type,
            })
            
            # TalentScope signal
            BehaviorSignal.objects.create(
                mentee=request.user,
                behavior_type='mission_completion',
                value=goal.progress,
                source='goal',
                source_id=goal.id,
                metadata={'goal_type': goal.type, 'title': goal.title}
            )
        
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================== REFLECTIONS API ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def reflections_list(request):
    """List or create reflections."""
    user = request.user
    
    if request.method == 'GET':
        reflections = Reflection.objects.filter(user=user).order_by('-date')
        serializer = ReflectionSerializer(reflections, many=True)
        return Response(serializer.data)
    
    # POST - Create reflection
    serializer = ReflectionSerializer(data=request.data)
    if serializer.is_valid():
        reflection_date = serializer.validated_data.get('date', date.today())
        content = serializer.validated_data.get('content', '')
        
        # Calculate word count
        word_count = len(content.split())
        
        reflection = serializer.save(
            user=user,
            date=reflection_date,
            word_count=word_count
        )
        
        # Emit event
        emit_coaching_event('reflection.saved', {
            'user_id': str(user.id),
            'reflection_id': str(reflection.id),
            'sentiment': reflection.sentiment,
            'word_count': word_count,
        })
        
        # TalentScope signal
        BehaviorSignal.objects.create(
            mentee=user,
            behavior_type='reflection_frequency',
            value=1,
            source='reflection',
            source_id=reflection.id,
            metadata={
                'sentiment': reflection.sentiment,
                'word_count': word_count
            }
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reflection_detail(request, reflection_id):
    """Get a reflection."""
    try:
        reflection = Reflection.objects.get(id=reflection_id, user=request.user)
    except Reflection.DoesNotExist:
        return Response(
            {'error': 'Reflection not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = ReflectionSerializer(reflection)
    return Response(serializer.data)


# ==================== AI COACH API ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_coach_message(request):
    """
    POST /api/v1/coaching/ai-coach/message
    Send message to AI Coach.
    """
    user = request.user
    
    # Check entitlement
    if not check_coaching_entitlement(user, 'ai_coach_full'):
        return Response(
            {'error': 'AI Coach requires subscription upgrade'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    message = request.data.get('message')
    context = request.data.get('context', 'general')
    metadata = request.data.get('metadata', {})
    
    if not message:
        return Response(
            {'error': 'message is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get or create session
    session, _ = AICoachSession.objects.get_or_create(
        user=user,
        session_type=context,
        defaults={'prompt_count': 0}
    )
    
    # Check rate limiting
    from .services import check_ai_coach_rate_limit
    if not check_ai_coach_rate_limit(user, session):
        return Response(
            {'error': 'Rate limit exceeded. Please upgrade for unlimited access.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )
    
    # Create user message
    user_msg = AICoachMessage.objects.create(
        session=session,
        role='user',
        content=message,
        context=context,
        metadata=metadata
    )
    
    # Generate AI response (async)
    try:
        from .tasks import generate_ai_coach_response
        ai_response_task = generate_ai_coach_response.delay(
            session_id=str(session.id),
            user_message_id=str(user_msg.id),
            context=context,
            user_id=str(user.id)
        )
    except Exception as e:
        logger.error(f"Failed to queue AI response task: {e}")
        # Create a mock task object for compatibility
        class MockTask:
            id = f"mock-{session.id}"
        ai_response_task = MockTask()

        # Create a fallback AI response immediately
        try:
            AICoachMessage.objects.create(
                session=session,
                role='assistant',
                content="I'm currently experiencing some technical difficulties. Please try again in a moment, or contact support if the issue persists.",
                context=context,
            )
        except Exception as fallback_error:
            logger.error(f"Failed to create fallback response: {fallback_error}")
    
    # Increment prompt count
    session.prompt_count += 1
    session.save()
    
    # Emit event
    emit_coaching_event('ai_coach.session', {
        'user_id': str(user.id),
        'session_id': str(session.id),
        'context': context,
    })
    
    return Response({
        'session_id': str(session.id),
        'user_message_id': str(user_msg.id),
        'task_id': str(ai_response_task.id),
        'status': 'processing'
    }, status=status.HTTP_202_ACCEPTED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ai_coach_history(request):
    """Get AI Coach conversation history."""
    user = request.user
    limit = int(request.query_params.get('limit', 50))
    
    sessions = AICoachSession.objects.filter(user=user).order_by('-created_at')[:limit]
    serializer = AICoachSessionSerializer(sessions, many=True)
    return Response(serializer.data)


# ==================== METRICS API ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def coaching_metrics(request):
    """
    GET /api/v1/coaching/metrics
    Get coaching metrics (alignment score, streaks, etc.)
    """
    user = request.user
    metrics = calculate_coaching_metrics(user)
    return Response(metrics, status=status.HTTP_200_OK)


# ==================== STUDENT ANALYTICS API ====================

@api_view(['GET', 'POST', 'PUT'])
@permission_classes([IsAuthenticated])
def student_analytics(request):
    """
    GET /api/v1/coaching/student-analytics
    POST /api/v1/coaching/student-analytics (create)
    PUT /api/v1/coaching/student-analytics (update)
    """
    user = request.user

    if request.method == 'GET':
        try:
            analytics = StudentAnalytics.objects.get(user=user)
            serializer = StudentAnalyticsSerializer(analytics)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except StudentAnalytics.DoesNotExist:
            return Response({'message': 'Student analytics not found'}, status=status.HTTP_404_NOT_FOUND)

    elif request.method in ['POST', 'PUT']:
        analytics, created = StudentAnalytics.objects.get_or_create(user=user)
        serializer = StudentAnalyticsSerializer(analytics, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================== RECIPE PROGRESS API ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def user_recipe_progress(request):
    """
    GET /api/v1/coaching/recipe-progress
    POST /api/v1/coaching/recipe-progress (bulk create/update)
    """
    user = request.user

    if request.method == 'GET':
        progress = UserRecipeProgress.objects.filter(user=user)
        serializer = UserRecipeProgressSerializer(progress, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        data = request.data
        if isinstance(data, list):
            # Bulk create/update
            created_items = []
            for item_data in data:
                item_data['user_id'] = str(user.id)
                progress, created = UserRecipeProgress.objects.get_or_create(
                    user=user,
                    recipe_id=item_data['recipe_id'],
                    defaults=item_data
                )
                if not created:
                    for key, value in item_data.items():
                        setattr(progress, key, value)
                    progress.save()
                serializer = UserRecipeProgressSerializer(progress)
                created_items.append(serializer.data)
            return Response(created_items, status=status.HTTP_201_CREATED)
        else:
            # Single item
            data['user_id'] = str(user.id)
            serializer = UserRecipeProgressSerializer(data=data)
            if serializer.is_valid():
                serializer.save(user=user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================== TRACK PROGRESS API ====================

@api_view(['GET', 'POST', 'PUT'])
@permission_classes([IsAuthenticated])
def user_track_progress(request):
    """
    GET /api/v1/coaching/track-progress
    POST /api/v1/coaching/track-progress (create)
    PUT /api/v1/coaching/track-progress (update)
    """
    user = request.user

    if request.method == 'GET':
        try:
            progress = UserTrackProgress.objects.get(user=user)
            serializer = UserTrackProgressSerializer(progress)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except UserTrackProgress.DoesNotExist:
            return Response({'message': 'Track progress not found'}, status=status.HTTP_404_NOT_FOUND)

    elif request.method in ['POST', 'PUT']:
        progress, created = UserTrackProgress.objects.get_or_create(user=user)
        serializer = UserTrackProgressSerializer(progress, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================== MISSION PROGRESS API ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def user_mission_progress(request):
    """
    GET /api/v1/coaching/mission-progress
    POST /api/v1/coaching/mission-progress (bulk create/update)
    """
    user = request.user

    if request.method == 'GET':
        progress = UserMissionProgress.objects.filter(user=user)
        serializer = UserMissionProgressSerializer(progress, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        data = request.data
        if isinstance(data, list):
            # Bulk create/update
            created_items = []
            for item_data in data:
                item_data['user_id'] = str(user.id)
                progress, created = UserMissionProgress.objects.get_or_create(
                    user=user,
                    mission_id=item_data['mission_id'],
                    defaults=item_data
                )
                if not created:
                    for key, value in item_data.items():
                        setattr(progress, key, value)
                    progress.save()
                serializer = UserMissionProgressSerializer(progress)
                created_items.append(serializer.data)
            return Response(created_items, status=status.HTTP_201_CREATED)
        else:
            # Single item
            data['user_id'] = str(user.id)
            serializer = UserMissionProgressSerializer(data=data)
            if serializer.is_valid():
                serializer.save(user=user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================== COMMUNITY ACTIVITY API ====================

@api_view(['GET', 'POST', 'PUT'])
@permission_classes([IsAuthenticated])
def community_activity(request):
    """
    GET /api/v1/coaching/community-activity
    POST /api/v1/coaching/community-activity (create)
    PUT /api/v1/coaching/community-activity (update)
    """
    user = request.user

    if request.method == 'GET':
        try:
            activity = CommunityActivitySummary.objects.get(user=user)
            serializer = CommunityActivitySummarySerializer(activity)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except CommunityActivitySummary.DoesNotExist:
            return Response({'message': 'Community activity not found'}, status=status.HTTP_404_NOT_FOUND)

    elif request.method in ['POST', 'PUT']:
        activity, created = CommunityActivitySummary.objects.get_or_create(user=user)
        serializer = CommunityActivitySummarySerializer(activity, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================== MENTORSHIP SESSIONS API ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def mentorship_sessions(request):
    """
    GET /api/v1/coaching/mentorship-sessions
    POST /api/v1/coaching/mentorship-sessions (create)
    """
    user = request.user

    if request.method == 'GET':
        sessions = MentorshipSession.objects.filter(user=user).order_by('-scheduled_at')
        serializer = MentorshipSessionSerializer(sessions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        data = request.data.copy()
        data['user_id'] = str(user.id)
        serializer = MentorshipSessionSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================== COACHING SESSIONS API ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def coaching_sessions_api(request):
    """
    GET /api/v1/coaching/sessions
    POST /api/v1/coaching/sessions (create)
    """
    user = request.user

    if request.method == 'GET':
        sessions = CoachingSession.objects.filter(user=user).order_by('-created_at')
        serializer = CoachingSessionSerializer(sessions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        data = request.data.copy()
        data['user_id'] = str(user.id)
        serializer = CoachingSessionSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
