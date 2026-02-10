"""
Mentorship Interaction API Views
Endpoints for mentorship interactions including multi-phase reviews, audio/video feedback, and scoring meetings.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from .models_mentorship_interaction import MentorshipInteraction
from .models_capstone import CapstoneProject
from .models import Mission
from users.models import User


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_mentorship_interaction(request):
    """
    POST /api/v1/mentorship-interactions/
    Create a new mentorship interaction.
    """
    user = request.user
    
    # Verify user is a mentor
    user_roles = [ur.role.name for ur in user.user_roles.filter(is_active=True)] if hasattr(user, 'user_roles') else []
    if 'mentor' not in user_roles and not user.is_staff:
        return Response({'error': 'Only mentors can create interactions'}, status=status.HTTP_403_FORBIDDEN)
    
    mentee_id = request.data.get('mentee_id')
    mission_id = request.data.get('mission_id')
    capstone_project_id = request.data.get('capstone_project_id')
    interaction_type = request.data.get('interaction_type')
    phase = request.data.get('phase')
    
    if not mentee_id:
        return Response({'error': 'mentee_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not interaction_type:
        return Response({'error': 'interaction_type is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        mentee = User.objects.get(uuid_id=mentee_id)
    except User.DoesNotExist:
        return Response({'error': 'Mentee not found'}, status=status.HTTP_404_NOT_FOUND)
    
    mission = None
    if mission_id:
        try:
            mission = Mission.objects.get(id=mission_id)
        except Mission.DoesNotExist:
            return Response({'error': 'Mission not found'}, status=status.HTTP_404_NOT_FOUND)
    
    capstone_project = None
    if capstone_project_id:
        try:
            capstone_project = CapstoneProject.objects.get(id=capstone_project_id)
        except CapstoneProject.DoesNotExist:
            return Response({'error': 'Capstone project not found'}, status=status.HTTP_404_NOT_FOUND)
    
    with transaction.atomic():
        interaction = MentorshipInteraction.objects.create(
            mentor=user,
            mentee=mentee,
            mission=mission,
            capstone_project=capstone_project,
            interaction_type=interaction_type,
            phase=phase,
            review_phase=request.data.get('review_phase', 1),
            total_phases=request.data.get('total_phases', 1),
            scheduled_at=timezone.now() if request.data.get('scheduled_at') else None,
        )
    
    return Response({
        'id': str(interaction.id),
        'mentor_id': str(interaction.mentor.uuid_id),
        'mentee_id': str(interaction.mentee.uuid_id),
        'interaction_type': interaction.interaction_type,
        'phase': interaction.phase,
        'status': interaction.status,
        'created_at': interaction.created_at.isoformat(),
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mentorship_interaction(request, interaction_id):
    """
    GET /api/v1/mentorship-interactions/{id}/
    Get mentorship interaction details.
    """
    user = request.user
    interaction = get_object_or_404(MentorshipInteraction, id=interaction_id)
    
    # Verify user is mentor or mentee
    if interaction.mentor != user and interaction.mentee != user:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    return Response({
        'id': str(interaction.id),
        'mentor_id': str(interaction.mentor.uuid_id),
        'mentor_name': interaction.mentor.get_full_name() or interaction.mentor.email,
        'mentee_id': str(interaction.mentee.uuid_id),
        'mentee_name': interaction.mentee.get_full_name() or interaction.mentee.email,
        'mission_id': str(interaction.mission.id) if interaction.mission else None,
        'capstone_project_id': str(interaction.capstone_project.id) if interaction.capstone_project else None,
        'interaction_type': interaction.interaction_type,
        'phase': interaction.phase,
        'status': interaction.status,
        'review_phase': interaction.review_phase,
        'total_phases': interaction.total_phases,
        'is_multi_phase': interaction.is_multi_phase(),
        'written_feedback': interaction.written_feedback,
        'feedback_per_subtask': interaction.feedback_per_subtask,
        'feedback_per_decision': interaction.feedback_per_decision,
        'audio_feedback_url': interaction.audio_feedback_url,
        'video_feedback_url': interaction.video_feedback_url,
        'audio_duration_seconds': interaction.audio_duration_seconds,
        'video_duration_seconds': interaction.video_duration_seconds,
        'rubric_scores': interaction.rubric_scores,
        'subtask_scores': interaction.subtask_scores,
        'overall_score': float(interaction.overall_score) if interaction.overall_score else None,
        'is_scoring_meeting': interaction.is_scoring_meeting,
        'meeting_notes': interaction.meeting_notes,
        'meeting_duration_minutes': interaction.meeting_duration_minutes,
        'recommended_next_steps': interaction.recommended_next_steps,
        'recommended_recipes': interaction.recommended_recipes,
        'scheduled_at': interaction.scheduled_at.isoformat() if interaction.scheduled_at else None,
        'started_at': interaction.started_at.isoformat() if interaction.started_at else None,
        'completed_at': interaction.completed_at.isoformat() if interaction.completed_at else None,
        'created_at': interaction.created_at.isoformat(),
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_mentorship_interaction(request, interaction_id):
    """
    PUT /api/v1/mentorship-interactions/{id}/
    Update mentorship interaction.
    """
    user = request.user
    interaction = get_object_or_404(MentorshipInteraction, id=interaction_id)
    
    # Verify user is the mentor
    if interaction.mentor != user:
        return Response({'error': 'Only the assigned mentor can update interactions'}, status=status.HTTP_403_FORBIDDEN)
    
    # Update fields
    if 'written_feedback' in request.data:
        interaction.written_feedback = request.data['written_feedback']
    if 'feedback_per_subtask' in request.data:
        interaction.feedback_per_subtask = request.data['feedback_per_subtask']
    if 'feedback_per_decision' in request.data:
        interaction.feedback_per_decision = request.data['feedback_per_decision']
    if 'audio_feedback_url' in request.data:
        interaction.audio_feedback_url = request.data['audio_feedback_url']
    if 'video_feedback_url' in request.data:
        interaction.video_feedback_url = request.data['video_feedback_url']
    if 'audio_duration_seconds' in request.data:
        interaction.audio_duration_seconds = request.data['audio_duration_seconds']
    if 'video_duration_seconds' in request.data:
        interaction.video_duration_seconds = request.data['video_duration_seconds']
    if 'rubric_scores' in request.data:
        interaction.rubric_scores = request.data['rubric_scores']
    if 'subtask_scores' in request.data:
        interaction.subtask_scores = request.data['subtask_scores']
    if 'overall_score' in request.data:
        interaction.overall_score = request.data['overall_score']
    if 'is_scoring_meeting' in request.data:
        interaction.is_scoring_meeting = request.data['is_scoring_meeting']
    if 'meeting_notes' in request.data:
        interaction.meeting_notes = request.data['meeting_notes']
    if 'meeting_duration_minutes' in request.data:
        interaction.meeting_duration_minutes = request.data['meeting_duration_minutes']
    if 'recommended_next_steps' in request.data:
        interaction.recommended_next_steps = request.data['recommended_next_steps']
    if 'recommended_recipes' in request.data:
        interaction.recommended_recipes = request.data['recommended_recipes']
    if 'status' in request.data:
        interaction.status = request.data['status']
        if request.data['status'] == 'completed':
            interaction.completed_at = timezone.now()
        elif request.data['status'] == 'in_progress' and not interaction.started_at:
            interaction.started_at = timezone.now()
    
    interaction.save()
    
    return Response({
        'id': str(interaction.id),
        'status': interaction.status,
        'message': 'Mentorship interaction updated successfully'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_review_phase(request, interaction_id):
    """
    POST /api/v1/mentorship-interactions/{id}/complete-phase/
    Complete a review phase in a multi-phase review.
    """
    user = request.user
    interaction = get_object_or_404(MentorshipInteraction, id=interaction_id)
    
    # Verify user is the mentor
    if interaction.mentor != user:
        return Response({'error': 'Only the assigned mentor can complete review phases'}, status=status.HTTP_403_FORBIDDEN)
    
    if not interaction.is_multi_phase():
        return Response({'error': 'This interaction is not a multi-phase review'}, status=status.HTTP_400_BAD_REQUEST)
    
    next_phase = interaction.get_next_phase()
    if not next_phase:
        return Response({'error': 'All phases are already complete'}, status=status.HTTP_400_BAD_REQUEST)
    
    with transaction.atomic():
        # Record current phase completion
        if not interaction.mentor_review_phases:
            interaction.mentor_review_phases = []
        
        interaction.mentor_review_phases.append({
            'phase': interaction.review_phase,
            'feedback': interaction.written_feedback,
            'score': float(interaction.overall_score) if interaction.overall_score else None,
            'reviewed_at': timezone.now().isoformat(),
        })
        
        # Move to next phase
        interaction.review_phase = next_phase
        
        # If this is the last phase, mark as completed
        if next_phase > interaction.total_phases:
            interaction.status = 'completed'
            interaction.completed_at = timezone.now()
        
        interaction.save()
    
    return Response({
        'id': str(interaction.id),
        'current_phase': interaction.review_phase,
        'total_phases': interaction.total_phases,
        'status': interaction.status,
        'message': f'Review phase {interaction.review_phase - 1} completed'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_feedback_media(request, interaction_id):
    """
    POST /api/v1/mentorship-interactions/{id}/upload-feedback/
    Upload audio or video feedback for a mentorship interaction.
    
    Expects: file (audio/video file) and media_type ('audio' or 'video')
    """
    user = request.user
    interaction = get_object_or_404(MentorshipInteraction, id=interaction_id)
    
    # Verify user is the mentor
    if interaction.mentor != user:
        return Response({'error': 'Only the assigned mentor can upload feedback'}, status=status.HTTP_403_FORBIDDEN)
    
    media_type = request.data.get('media_type')
    file_url = request.data.get('file_url')  # URL to uploaded file
    duration_seconds = request.data.get('duration_seconds')
    
    if not media_type or media_type not in ['audio', 'video']:
        return Response({'error': 'media_type must be "audio" or "video"'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not file_url:
        return Response({'error': 'file_url is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    with transaction.atomic():
        if media_type == 'audio':
            interaction.audio_feedback_url = file_url
            if duration_seconds:
                interaction.audio_duration_seconds = duration_seconds
        else:
            interaction.video_feedback_url = file_url
            if duration_seconds:
                interaction.video_duration_seconds = duration_seconds
        
        interaction.save()
    
    return Response({
        'id': str(interaction.id),
        'media_type': media_type,
        'file_url': file_url,
        'duration_seconds': duration_seconds,
        'message': f'{media_type.title()} feedback uploaded successfully'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_mentorship_interactions(request):
    """
    GET /api/v1/mentorship-interactions/
    List mentorship interactions.
    
    Query params:
    - role: 'mentor' or 'mentee' (default: based on user role)
    - mission_id: Filter by mission
    - capstone_project_id: Filter by capstone project
    - interaction_type: Filter by type
    - status: Filter by status
    """
    user = request.user
    
    # Determine role
    user_roles = [ur.role.name for ur in user.user_roles.filter(is_active=True)] if hasattr(user, 'user_roles') else []
    is_mentor = 'mentor' in user_roles or user.is_staff
    
    role = request.query_params.get('role')
    if role == 'mentor':
        queryset = MentorshipInteraction.objects.filter(mentor=user)
    elif role == 'mentee':
        queryset = MentorshipInteraction.objects.filter(mentee=user)
    elif is_mentor:
        queryset = MentorshipInteraction.objects.filter(mentor=user)
    else:
        queryset = MentorshipInteraction.objects.filter(mentee=user)
    
    # Apply filters
    mission_id = request.query_params.get('mission_id')
    if mission_id:
        queryset = queryset.filter(mission_id=mission_id)
    
    capstone_project_id = request.query_params.get('capstone_project_id')
    if capstone_project_id:
        queryset = queryset.filter(capstone_project_id=capstone_project_id)
    
    interaction_type = request.query_params.get('interaction_type')
    if interaction_type:
        queryset = queryset.filter(interaction_type=interaction_type)
    
    status_filter = request.query_params.get('status')
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    
    interactions = queryset.select_related('mentor', 'mentee', 'mission', 'capstone_project').order_by('-created_at')
    
    return Response({
        'results': [{
            'id': str(i.id),
            'mentor_id': str(i.mentor.uuid_id),
            'mentor_name': i.mentor.get_full_name() or i.mentor.email,
            'mentee_id': str(i.mentee.uuid_id),
            'mentee_name': i.mentee.get_full_name() or i.mentee.email,
            'mission_id': str(i.mission.id) if i.mission else None,
            'capstone_project_id': str(i.capstone_project.id) if i.capstone_project else None,
            'interaction_type': i.interaction_type,
            'phase': i.phase,
            'status': i.status,
            'review_phase': i.review_phase,
            'total_phases': i.total_phases,
            'overall_score': float(i.overall_score) if i.overall_score else None,
            'has_audio_feedback': bool(i.audio_feedback_url),
            'has_video_feedback': bool(i.video_feedback_url),
            'is_scoring_meeting': i.is_scoring_meeting,
            'created_at': i.created_at.isoformat(),
            'completed_at': i.completed_at.isoformat() if i.completed_at else None,
        } for i in interactions]
    })
