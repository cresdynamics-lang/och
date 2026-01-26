from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from .models import (
    ReadinessScore, CohortProgress, PortfolioItem, MentorshipSession,
    GamificationPoints, DashboardEvent, CommunityActivity
)
from missions.models import Mission, MissionSubmission
from coaching.models import Habit, HabitLog
from curriculum.models import CurriculumModule, UserModuleProgress
import json


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_overview(request):
    """Get dashboard overview: readiness, cohort progress, subscription, quick stats."""
    user = request.user
    
    readiness = ReadinessScore.objects.filter(user=user).first()
    if not readiness:
        readiness = ReadinessScore.objects.create(
            user=user,
            score=0,
            max_score=100,
            trend=0,
            trend_direction='stable',
            countdown_days=0,
            countdown_label=''
        )
    
    cohort_progress = CohortProgress.objects.filter(user=user).first()
    if not cohort_progress:
        cohort_progress = CohortProgress.objects.create(
            user=user,
            percentage=0,
            current_module='',
            total_modules=0,
            completed_modules=0,
            estimated_time_remaining=0
        )
    
    gamification = GamificationPoints.objects.filter(user=user).first()
    if not gamification:
        gamification = GamificationPoints.objects.create(
            user=user,
            points=0,
            streak=0,
            badges=0,
            rank='',
            level=''
        )
    
    subscription_tier = getattr(user, 'subscription_tier', 'free')
    subscription_expiry = getattr(user, 'subscription_expiry', None)
    subscription_days_left = None
    if subscription_expiry:
        days = (subscription_expiry - timezone.now().date()).days
        subscription_days_left = max(0, days)
    
    return Response({
        'readiness': {
            'score': readiness.score,
            'max_score': readiness.max_score,
            'trend': readiness.trend,
            'trend_direction': readiness.trend_direction,
            'countdown_days': readiness.countdown_days,
            'countdown_label': readiness.countdown_label,
        },
        'cohort_progress': {
            'percentage': cohort_progress.percentage,
            'current_module': cohort_progress.current_module,
            'total_modules': cohort_progress.total_modules,
            'completed_modules': cohort_progress.completed_modules,
            'estimated_time_remaining': cohort_progress.estimated_time_remaining,
            'graduation_date': cohort_progress.graduation_date.isoformat() if cohort_progress.graduation_date else None,
        },
        'subscription': {
            'tier': subscription_tier,
            'expiry': subscription_expiry.isoformat() if subscription_expiry else None,
            'days_left': subscription_days_left,
        },
        'quick_stats': {
            'points': gamification.points,
            'streak': gamification.streak,
            'badges': gamification.badges,
            'mentor_rating': 4.8,
        },
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_metrics(request):
    """Get dashboard metrics: learning %, portfolio, mentorship, gamification."""
    user = request.user
    
    modules = CurriculumModule.objects.filter(track_key=getattr(user, 'track_key', 'builder'))
    total_modules = modules.count()
    completed_modules = UserModuleProgress.objects.filter(
        user=user,
        status='completed'
    ).count()
    learning_percentage = (completed_modules / total_modules * 100) if total_modules > 0 else 0
    
    portfolio_items = PortfolioItem.objects.filter(user=user)
    portfolio_total = portfolio_items.count()
    portfolio_approved = portfolio_items.filter(status='approved').count()
    portfolio_pending = portfolio_items.filter(status='pending').count()
    portfolio_rejected = portfolio_items.filter(status='rejected').count()
    portfolio_percentage = (portfolio_approved / portfolio_total * 100) if portfolio_total > 0 else 0
    
    mentorship = MentorshipSession.objects.filter(user=user).order_by('next_session_date').first()
    if not mentorship:
        mentorship = MentorshipSession.objects.create(
            user=user,
            mentor_name='TBD',
            next_session_date=timezone.now().date() + timedelta(days=7),
            next_session_time=timezone.now().time(),
            status='pending'
        )
    
    gamification = GamificationPoints.objects.filter(user=user).first()
    if not gamification:
        gamification = GamificationPoints.objects.create(
            user=user,
            points=0,
            streak=0,
            badges=0,
            rank='Beginner',
            level='Level 1'
        )
    
    return Response({
        'learning_percentage': round(learning_percentage, 2),
        'portfolio': {
            'total': portfolio_total,
            'approved': portfolio_approved,
            'pending': portfolio_pending,
            'rejected': portfolio_rejected,
            'percentage': round(portfolio_percentage, 2),
        },
        'mentorship': {
            'next_session_date': mentorship.next_session_date.isoformat(),
            'next_session_time': mentorship.next_session_time.strftime('%I:%M %p') if mentorship.next_session_time else '',
            'mentor_name': mentorship.mentor_name,
            'mentor_avatar': mentorship.mentor_avatar,
            'session_type': mentorship.session_type,
            'status': mentorship.status,
        },
        'gamification': {
            'points': gamification.points,
            'streak': gamification.streak,
            'badges': gamification.badges,
            'rank': gamification.rank,
            'level': gamification.level,
        },
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def next_actions(request):
    """Get prioritized next actions for the student."""
    user = request.user
    actions = []
    
    pending_missions = MissionSubmission.objects.filter(
        user=user,
        status__in=['not_started', 'in_progress', 'draft']
    ).order_by('mission__estimated_time_minutes')[:3]
    
    for submission in pending_missions:
        actions.append({
            'id': str(submission.id),
            'title': f'Complete {submission.mission.title}',
            'description': f'Mission {submission.mission.code}',
            'type': 'mission',
            'urgency': 'high' if submission.status == 'in_progress' else 'medium',
            'progress': 0,
            'due_date': None,
            'action_url': f'/dashboard/student/missions?mission={submission.mission.id}',
        })
    
    habits = Habit.objects.filter(user=user, type='core')
    today_logged = HabitLog.objects.filter(
        user=user,
        log_date=timezone.now().date()
    ).values_list('habit_id', flat=True)
    
    for habit in habits:
        if habit.id not in today_logged:
            actions.append({
                'id': str(habit.id),
                'title': f'Log {habit.name} habit',
                'description': 'Track your daily habits',
                'type': 'habit',
                'urgency': 'medium',
                'progress': 0,
                'action_url': '/dashboard/student/coaching',
            })
    
    return Response(actions[:5])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_events(request):
    """Get upcoming events timeline with RSVP status."""
    user = request.user
    events = DashboardEvent.objects.filter(
        user=user
    ).filter(
        date__gte=timezone.now().date()
    ).order_by('date', 'time')[:10]
    
    event_list = []
    for event in events:
        event_list.append({
            'id': str(event.id),
            'title': event.title,
            'date': event.date.isoformat(),
            'time': event.time.strftime('%I:%M %p') if event.time else None,
            'type': event.event_type,
            'urgency': event.urgency,
            'rsvp_required': event.rsvp_required,
            'rsvp_status': event.rsvp_status,
            'action_url': event.action_url,
        })
    
    return Response(event_list)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def track_overview(request):
    """Get track progress with milestone completion."""
    user = request.user
    track_key = getattr(user, 'track_key', 'builder')
    
    modules = CurriculumModule.objects.filter(track_key=track_key).order_by('order_index')
    milestones = []
    completed_count = 0
    
    for module in modules:
        progress = UserModuleProgress.objects.filter(user=user, module=module).first()
        progress_percentage = 0
        status = 'not_started'
        
        if progress:
            if progress.status == 'completed':
                progress_percentage = 100
                status = 'completed'
                completed_count += 1
            elif progress.status == 'in_progress':
                progress_percentage = 50
                status = 'in_progress'
        
        missions = Mission.objects.filter(module_id=module.id)
        if missions.exists():
            mission_submissions = MissionSubmission.objects.filter(
                user=user,
                mission__in=missions,
                status='approved'
            )
            if mission_submissions.exists():
                progress_percentage = max(progress_percentage, 75)
        
        milestones.append({
            'id': str(module.id),
            'code': f'MOD-{module.order_index}',
            'title': module.title,
            'progress': progress_percentage,
            'status': status,
        })
    
    return Response({
        'track_name': f'{track_key.title()} Track',
        'track_key': track_key,
        'milestones': milestones,
        'completed_milestones': completed_count,
        'total_milestones': len(milestones),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def community_feed(request):
    """Get latest community activities."""
    activities = CommunityActivity.objects.all().order_by('-created_at')[:10]
    
    activity_list = []
    for activity in activities:
        time_ago = timezone.now() - activity.created_at
        if time_ago.days > 0:
            timestamp = f'{time_ago.days} day{"s" if time_ago.days > 1 else ""} ago'
        elif time_ago.seconds > 3600:
            hours = time_ago.seconds // 3600
            timestamp = f'{hours} hour{"s" if hours > 1 else ""} ago'
        else:
            minutes = time_ago.seconds // 60
            timestamp = f'{minutes} minute{"s" if minutes > 1 else ""} ago'
        
        activity_list.append({
            'id': str(activity.id),
            'user': activity.user_display_name,
            'action': activity.action,
            'timestamp': timestamp,
            'likes': activity.likes,
            'type': activity.activity_type,
            'action_url': activity.action_url,
        })
    
    return Response(activity_list)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leaderboard(request):
    """Get cohort top performers."""
    user = request.user
    cohort_id = getattr(user, 'cohort_id', None)
    
    gamification_scores = GamificationPoints.objects.all().order_by('-points')[:10]
    
    leaderboard_list = []
    user_rank = None
    
    for idx, score in enumerate(gamification_scores, 1):
        is_current_user = score.user.id == user.id
        if is_current_user:
            user_rank = idx
        
        leaderboard_list.append({
            'rank': idx,
            'user_id': str(score.user.id),
            'user_name': score.user.first_name or score.user.email.split('@')[0],
            'points': score.points,
            'avatar': None,
            'is_current_user': is_current_user,
        })
    
    if user_rank is None:
        user_gamification = GamificationPoints.objects.filter(user=user).first()
        if user_gamification:
            leaderboard_list.append({
                'rank': len(leaderboard_list) + 1,
                'user_id': str(user.id),
                'user_name': user.first_name or user.email.split('@')[0],
                'points': user_gamification.points,
                'avatar': None,
                'is_current_user': True,
            })
    
    return Response(leaderboard_list[:3])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_habits(request):
    """Get daily habit tracking status."""
    user = request.user
    
    habits = Habit.objects.filter(user=user, type='core')
    today = timezone.now().date()
    today_logs = HabitLog.objects.filter(user=user, log_date=today)
    logged_habit_ids = set(today_logs.values_list('habit_id', flat=True))
    
    habit_list = []
    for habit in habits:
        logs = HabitLog.objects.filter(habit=habit, status='done').order_by('-log_date')
        streak = 0
        if logs.exists():
            current_date = today
            for log in logs:
                if log.log_date == current_date:
                    streak += 1
                    current_date -= timedelta(days=1)
                else:
                    break
        
        habit_list.append({
            'id': str(habit.id),
            'name': habit.name,
            'category': getattr(habit, 'category', 'learn'),
            'completed': habit.id in logged_habit_ids,
            'streak': streak,
            'today_logged': habit.id in logged_habit_ids,
        })
    
    return Response(habit_list)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_coach_nudge(request):
    """Get personalized AI recommendations."""
    user = request.user
    
    return Response({
        'id': '1',
        'message': 'DFIR gap detected',
        'recommendation': 'Try THM SOC Room L1?',
        'action_url': '/dashboard/student/curriculum?module=dfir-advanced',
        'action_label': 'Start Lab',
        'dismissible': True,
    })

