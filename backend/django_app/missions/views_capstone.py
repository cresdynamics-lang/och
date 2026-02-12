"""
Capstone Project API Views
Endpoints for Capstone Project CRUD and phase completion.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from .models_capstone import CapstoneProject
from .models import Mission
from users.models import User


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_capstone_project(request):
    """
    POST /api/v1/capstone-projects/
    Create a new capstone project for a mission.
    """
    user = request.user
    mission_id = request.data.get('mission_id')
    
    if not mission_id:
        return Response({'error': 'mission_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        mission = Mission.objects.get(id=mission_id, tier='mastery', is_active=True)
    except Mission.DoesNotExist:
        return Response({'error': 'Mission not found or not a Mastery mission'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if capstone project already exists
    existing = CapstoneProject.objects.filter(user=user, mission=mission).first()
    if existing:
        return Response({
            'error': 'Capstone project already exists',
            'capstone_project_id': str(existing.id)
        }, status=status.HTTP_400_BAD_REQUEST)
    
    with transaction.atomic():
        capstone = CapstoneProject.objects.create(
            user=user,
            mission=mission,
            track=mission.track or 'defender',
            status='not_started',
            started_at=timezone.now()
        )
    
    return Response({
        'id': str(capstone.id),
        'mission_id': str(mission.id),
        'mission_title': mission.title,
        'track': capstone.track,
        'status': capstone.status,
        'current_phase': capstone.get_current_phase(),
        'started_at': capstone.started_at.isoformat() if capstone.started_at else None,
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_capstone_project(request, capstone_id):
    """
    GET /api/v1/capstone-projects/{id}/
    Get capstone project details.
    """
    user = request.user
    capstone = get_object_or_404(CapstoneProject, id=capstone_id)
    
    # Verify user owns this capstone
    if capstone.user != user:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    return Response({
        'id': str(capstone.id),
        'mission_id': str(capstone.mission.id),
        'mission_title': capstone.mission.title,
        'track': capstone.track,
        'status': capstone.status,
        'current_phase': capstone.get_current_phase(),
        'investigation': {
            'findings': capstone.investigation_findings,
            'artifacts': capstone.investigation_artifacts,
            'completed_at': capstone.investigation_completed_at.isoformat() if capstone.investigation_completed_at else None,
        },
        'decision_making': {
            'decisions': capstone.decisions_made,
            'analysis': capstone.decision_analysis,
            'completed_at': capstone.decision_making_completed_at.isoformat() if capstone.decision_making_completed_at else None,
        },
        'design_remediation': {
            'documents': capstone.design_documents,
            'remediation_plan': capstone.remediation_plan,
            'completed_at': capstone.design_remediation_completed_at.isoformat() if capstone.design_remediation_completed_at else None,
        },
        'reporting': {
            'report_url': capstone.report_document_url,
            'summary': capstone.report_summary,
            'key_findings': capstone.report_key_findings,
            'completed_at': capstone.reporting_completed_at.isoformat() if capstone.reporting_completed_at else None,
        },
        'presentation': {
            'presentation_url': capstone.presentation_url,
            'presentation_type': capstone.presentation_type,
            'notes': capstone.presentation_notes,
            'completed_at': capstone.presentation_completed_at.isoformat() if capstone.presentation_completed_at else None,
        },
        'mentor_review': {
            'phases': capstone.mentor_review_phases,
            'audio_feedback_url': capstone.mentor_feedback_audio_url,
            'video_feedback_url': capstone.mentor_feedback_video_url,
            'final_score': float(capstone.mentor_final_score) if capstone.mentor_final_score else None,
            'approved': capstone.mentor_approved,
            'reviewed_at': capstone.mentor_reviewed_at.isoformat() if capstone.mentor_reviewed_at else None,
        },
        'started_at': capstone.started_at.isoformat() if capstone.started_at else None,
        'submitted_at': capstone.submitted_at.isoformat() if capstone.submitted_at else None,
        'completed_at': capstone.completed_at.isoformat() if capstone.completed_at else None,
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_capstone_project(request, capstone_id):
    """
    PUT /api/v1/capstone-projects/{id}/
    Update capstone project data.
    """
    user = request.user
    capstone = get_object_or_404(CapstoneProject, id=capstone_id)
    
    # Verify user owns this capstone
    if capstone.user != user:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    # Update fields based on request data
    if 'investigation_findings' in request.data:
        capstone.investigation_findings = request.data['investigation_findings']
    if 'investigation_artifacts' in request.data:
        capstone.investigation_artifacts = request.data['investigation_artifacts']
    if 'decisions_made' in request.data:
        capstone.decisions_made = request.data['decisions_made']
    if 'decision_analysis' in request.data:
        capstone.decision_analysis = request.data['decision_analysis']
    if 'design_documents' in request.data:
        capstone.design_documents = request.data['design_documents']
    if 'remediation_plan' in request.data:
        capstone.remediation_plan = request.data['remediation_plan']
    if 'report_document_url' in request.data:
        capstone.report_document_url = request.data['report_document_url']
    if 'report_summary' in request.data:
        capstone.report_summary = request.data['report_summary']
    if 'report_key_findings' in request.data:
        capstone.report_key_findings = request.data['report_key_findings']
    if 'presentation_url' in request.data:
        capstone.presentation_url = request.data['presentation_url']
    if 'presentation_type' in request.data:
        capstone.presentation_type = request.data['presentation_type']
    if 'presentation_notes' in request.data:
        capstone.presentation_notes = request.data['presentation_notes']
    
    capstone.save()
    
    return Response({
        'id': str(capstone.id),
        'status': capstone.status,
        'current_phase': capstone.get_current_phase(),
        'message': 'Capstone project updated successfully'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_capstone_phase(request, capstone_id, phase):
    """
    POST /api/v1/capstone-projects/{id}/complete-phase/{phase}/
    Complete a specific phase of the capstone project.
    
    Phases: investigation, decision_making, design_remediation, reporting, presentation
    """
    user = request.user
    capstone = get_object_or_404(CapstoneProject, id=capstone_id)
    
    # Verify user owns this capstone
    if capstone.user != user:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    phase_map = {
        'investigation': ('investigation_completed_at', 'investigation'),
        'decision_making': ('decision_making_completed_at', 'decision_making'),
        'design_remediation': ('design_remediation_completed_at', 'design_remediation'),
        'reporting': ('reporting_completed_at', 'reporting'),
        'presentation': ('presentation_completed_at', 'presentation'),
    }
    
    if phase not in phase_map:
        return Response({'error': f'Invalid phase: {phase}'}, status=status.HTTP_400_BAD_REQUEST)
    
    field_name, phase_status = phase_map[phase]
    
    # Check if previous phases are complete (if required)
    if phase == 'decision_making' and not capstone.investigation_completed_at:
        return Response({'error': 'Investigation phase must be completed first'}, status=status.HTTP_400_BAD_REQUEST)
    if phase == 'design_remediation' and not capstone.decision_making_completed_at:
        return Response({'error': 'Decision-making phase must be completed first'}, status=status.HTTP_400_BAD_REQUEST)
    if phase == 'reporting' and not capstone.design_remediation_completed_at:
        return Response({'error': 'Design/remediation phase must be completed first'}, status=status.HTTP_400_BAD_REQUEST)
    if phase == 'presentation' and not capstone.reporting_completed_at:
        return Response({'error': 'Reporting phase must be completed first'}, status=status.HTTP_400_BAD_REQUEST)
    
    with transaction.atomic():
        setattr(capstone, field_name, timezone.now())
        
        # Update status based on phase
        if phase == 'presentation':
            capstone.status = 'submitted'
            capstone.submitted_at = timezone.now()
        else:
            capstone.status = phase_status
        
        capstone.save()
    
    return Response({
        'id': str(capstone.id),
        'phase': phase,
        'status': capstone.status,
        'current_phase': capstone.get_current_phase(),
        'completed_at': getattr(capstone, field_name).isoformat() if getattr(capstone, field_name) else None,
        'message': f'{phase.replace("_", " ").title()} phase completed successfully'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_capstone_project(request, capstone_id):
    """
    POST /api/v1/capstone-projects/{id}/submit/
    Submit capstone project for mentor review.
    """
    user = request.user
    capstone = get_object_or_404(CapstoneProject, id=capstone_id)
    
    # Verify user owns this capstone
    if capstone.user != user:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    # Verify all phases are complete
    if not capstone.presentation_completed_at:
        return Response({'error': 'Presentation phase must be completed before submission'}, status=status.HTTP_400_BAD_REQUEST)
    
    with transaction.atomic():
        capstone.status = 'submitted'
        capstone.submitted_at = timezone.now()
        capstone.save()
    
    return Response({
        'id': str(capstone.id),
        'status': capstone.status,
        'submitted_at': capstone.submitted_at.isoformat(),
        'message': 'Capstone project submitted for mentor review'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_user_capstone_projects(request):
    """
    GET /api/v1/capstone-projects/
    List all capstone projects for the authenticated user.
    """
    user = request.user
    track = request.query_params.get('track')
    status_filter = request.query_params.get('status')
    
    queryset = CapstoneProject.objects.filter(user=user)
    
    if track:
        queryset = queryset.filter(track=track)
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    
    capstones = queryset.select_related('mission').order_by('-created_at')
    
    return Response({
        'results': [{
            'id': str(c.id),
            'mission_id': str(c.mission.id),
            'mission_title': c.mission.title,
            'track': c.track,
            'status': c.status,
            'current_phase': c.get_current_phase(),
            'mentor_approved': c.mentor_approved,
            'created_at': c.created_at.isoformat(),
        } for c in capstones]
    })
