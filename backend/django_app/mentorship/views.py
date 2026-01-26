"""
API views for mentorship chat and file uploads.
"""
import os
from django.http import JsonResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from users.models import User
from .models import ChatMessage, ChatAttachment
from .serializers import ChatMessageSerializer, ChatMessageCreateSerializer, ChatAttachmentSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chat_messages(request, mentee_id):
    """
    GET /api/v1/mentorships/{mentee_id}/chat
    
    Get chat messages for a mentee.
    Query params:
    - mentor_id: UUID (optional, filter by mentor)
    """
    user = request.user
    
    # Check if user is the mentee or a mentor
    try:
        from uuid import UUID
        mentee_uuid = UUID(str(mentee_id))
        user_uuid = UUID(str(user.id))
    except (ValueError, AttributeError):
        return Response(
            {'error': 'Invalid user ID'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if user_uuid != mentee_uuid and not user.user_roles.filter(role__name='mentor', is_active=True).exists():
        return Response(
            {'error': 'Access denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    mentor_id = request.query_params.get('mentor_id')
    
    queryset = ChatMessage.objects.filter(mentee_id=mentee_uuid)
    if mentor_id:
        try:
            mentor_uuid = UUID(str(mentor_id))
            queryset = queryset.filter(mentor_id=mentor_uuid)
        except ValueError:
            return Response(
                {'error': 'Invalid mentor ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    queryset = queryset.select_related('mentee', 'mentor').prefetch_related('attachments')[:50]
    
    messages = queryset
    serializer = ChatMessageSerializer(messages, many=True, context={'request': request})
    
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def send_chat_message(request, mentee_id):
    """
    POST /api/v1/mentorships/{mentee_id}/chat
    
    Send a chat message with optional file attachments.
    Accepts multipart/form-data.
    """
    user = request.user
    
    # Check if user is the mentee
    try:
        from uuid import UUID
        mentee_uuid = UUID(str(mentee_id))
        user_uuid = UUID(str(user.id))
    except (ValueError, AttributeError):
        return Response(
            {'error': 'Invalid user ID'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if user_uuid != mentee_uuid:
        return Response(
            {'error': 'Access denied. You can only send messages as yourself.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Parse form data
    message_text = request.data.get('message', '').strip()
    mentor_id = request.data.get('mentor_id')
    files = request.FILES.getlist('attachments', [])
    
    if not message_text and not files:
        return Response(
            {'error': 'Message or attachment required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file sizes (10MB max per file)
    max_file_size = 10 * 1024 * 1024  # 10MB
    for file in files:
        if file.size > max_file_size:
            return Response(
                {'error': f'File {file.name} exceeds 10MB limit'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Create message
    mentor = None
    if mentor_id:
        try:
            mentor_uuid = UUID(str(mentor_id))
            mentor = User.objects.get(id=mentor_uuid)
            if not mentor.user_roles.filter(role__name='mentor', is_active=True).exists():
                return Response(
                    {'error': 'Invalid mentor ID'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, User.DoesNotExist):
            return Response(
                {'error': 'Mentor not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    chat_message = ChatMessage.objects.create(
        mentee=user,
        mentor=mentor,
        message=message_text or '(file attachment)',
        sender_type='mentee'
    )
    
    # Create attachments
    attachments = []
    for file in files:
        attachment = ChatAttachment.objects.create(
            message=chat_message,
            file=file,
            filename=file.name,
            file_size=file.size,
            content_type=file.content_type or 'application/octet-stream'
        )
        attachments.append(attachment)
    
    serializer = ChatMessageSerializer(chat_message, context={'request': request})
    
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mentor_presence(request, mentee_id):
    """
    GET /api/v1/mentorships/{mentee_id}/presence
    
    Get mentor presence status.
    """
    user = request.user
    
    try:
        from uuid import UUID
        mentee_uuid = UUID(str(mentee_id))
        user_uuid = UUID(str(user.id))
    except (ValueError, AttributeError):
        return Response(
            {'error': 'Invalid user ID'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if user_uuid != mentee_uuid:
        return Response(
            {'error': 'Access denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get mentors assigned to this mentee (mock for now)
    mentors = User.objects.filter(
        user_roles__role__name='mentor',
        user_roles__is_active=True
    ).distinct()[:10]
    
    presence_data = []
    for mentor in mentors:
        # Check last activity (mock - should come from presence service)
        presence_data.append({
            'mentor_id': str(mentor.id),
            'mentor_name': mentor.get_full_name() or mentor.email,
            'online': True,  # Mock
            'last_seen': timezone.now().isoformat(),
        })
    
    return Response(presence_data, status=status.HTTP_200_OK)

