from django.http import StreamingHttpResponse
from django.utils import timezone
import json
import time
from .models import GamificationPoints, ReadinessScore, DashboardEvent
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_sse(request):
    """
    Server-Sent Events endpoint for real-time dashboard updates.
    Streams updates for points, readiness changes, and new events.
    """
    user = request.user
    
    def event_stream():
        last_points = None
        last_readiness = None
        last_event_count = None
        
        while True:
            try:
                gamification = GamificationPoints.objects.filter(user=user).first()
                readiness = ReadinessScore.objects.filter(user=user).first()
                events = DashboardEvent.objects.filter(
                    user=user,
                    date__gte=timezone.now().date()
                ).count()
                
                current_points = gamification.points if gamification else 0
                current_readiness = readiness.score if readiness else 0
                
                updates = {}
                
                if last_points is not None and current_points != last_points:
                    updates['points'] = current_points
                    updates['points_delta'] = current_points - last_points
                
                if last_readiness is not None and current_readiness != last_readiness:
                    updates['readiness'] = current_readiness
                    updates['readiness_delta'] = current_readiness - last_readiness
                
                if last_event_count is not None and events != last_event_count:
                    updates['new_events'] = events - last_event_count
                
                if updates:
                    yield f"data: {json.dumps(updates)}\n\n"
                
                last_points = current_points
                last_readiness = current_readiness
                last_event_count = events
                
                time.sleep(5)
                
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                time.sleep(10)
    
    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response

