"""
Simple API endpoint to return tracks for profiler GPT analysis.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from programs.models import Track, Program

@api_view(['GET'])
@permission_classes([AllowAny])
def get_tracks_for_profiler(request):
    """Return all active tracks for profiler analysis."""
    try:
        # Get Cyber Security Foundations program
        program = Program.objects.filter(name='Cyber Security Foundations').first()
        
        if not program:
            # Fallback to any program
            program = Program.objects.first()
        
        if not program:
            return Response([])
        
        # Get all primary tracks
        tracks = Track.objects.filter(
            program=program,
            track_type='primary'
        ).values('id', 'key', 'name', 'description')
        
        return Response(list(tracks))
    except Exception as e:
        return Response([], status=500)
