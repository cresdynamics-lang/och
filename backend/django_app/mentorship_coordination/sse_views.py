"""
Server-Sent Events (SSE) stream for real-time mentor dashboard updates.
"""
from django.http import StreamingHttpResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
import json
import time

from .models import MentorWorkQueue, MentorSession, MentorFlag


def get_current_mentor(user):
    """Verify user is a mentor."""
    if not user.is_mentor:
        raise Exception("User is not a mentor")
    return user


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_dashboard_stream(request):
    """
    GET /api/v1/mentor/dashboard/stream
    SSE stream for real-time mentor dashboard updates.
    """
    mentor = get_current_mentor(request.user)
    
    def event_stream():
        """Generate SSE events."""
        last_work_queue_count = 0
        last_session_count = 0
        last_flag_count = 0
        
        while True:
            try:
                # Work queue updates
                work_queue_count = MentorWorkQueue.objects.filter(
                    mentor=mentor,
                    status__in=['pending', 'in_progress', 'overdue']
                ).count()
                
                if work_queue_count != last_work_queue_count:
                    overdue = MentorWorkQueue.objects.filter(
                        mentor=mentor,
                        status='overdue'
                    ).count()
                    today_items = MentorWorkQueue.objects.filter(
                        mentor=mentor,
                        due_at__date=timezone.now().date(),
                        status__in=['pending', 'in_progress']
                    ).count()
                    
                    yield f"data: {json.dumps({'work_queue': {'overdue': overdue, 'today': today_items, 'total_pending': work_queue_count}})}\n\n"
                    last_work_queue_count = work_queue_count
                
                # New sessions
                today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
                session_count = MentorSession.objects.filter(
                    mentor=mentor,
                    start_time__gte=today_start,
                    created_at__gte=timezone.now() - timezone.timedelta(minutes=5)
                ).count()
                
                if session_count > last_session_count:
                    new_sessions = MentorSession.objects.filter(
                        mentor=mentor,
                        start_time__gte=today_start
                    ).order_by('-created_at')[:1]
                    
                    for session in new_sessions:
                        yield f"data: {json.dumps({'new_session': {'mentee': session.mentee.get_full_name() or session.mentee.email, 'title': session.title, 'time': session.start_time.isoformat()}})}\n\n"
                    last_session_count = session_count
                
                # Risk alerts
                flag_count = MentorFlag.objects.filter(
                    mentee__mentee_assignments__mentor=mentor,
                    resolved=False,
                    created_at__gte=timezone.now() - timezone.timedelta(minutes=5)
                ).count()
                
                if flag_count > last_flag_count:
                    new_flags = MentorFlag.objects.filter(
                        mentee__mentee_assignments__mentor=mentor,
                        resolved=False
                    ).order_by('-created_at')[:1]
                    
                    for flag in new_flags:
                        yield f"data: {json.dumps({'risk_alert': {'mentee': flag.mentee.get_full_name() or flag.mentee.email, 'reason': flag.reason[:100], 'severity': flag.severity}})}\n\n"
                    last_flag_count = flag_count
                
                # Keep-alive ping every 30 seconds
                yield ": keepalive\n\n"
                time.sleep(5)  # Check every 5 seconds
                
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                time.sleep(5)
    
    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response

