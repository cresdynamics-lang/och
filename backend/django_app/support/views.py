from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from users.permissions import IsSupportOrDirectorOrAdmin
from .models import ProblemCode, SupportTicket
from .serializers import (
    ProblemCodeSerializer,
    SupportTicketListSerializer,
    SupportTicketDetailSerializer,
    SupportTicketCreateUpdateSerializer,
)


class ProblemCodeViewSet(viewsets.ModelViewSet):
    """
    CRUD for problem tracking codes. List is available to support/director/admin.
    Create/update/delete typically for director/admin only; support can list and use.
    """
    queryset = ProblemCode.objects.all()
    serializer_class = ProblemCodeSerializer
    permission_classes = [IsSupportOrDirectorOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['code', 'category', 'created_at']
    ordering = ['category', 'code']


class SupportTicketViewSet(viewsets.ModelViewSet):
    """
    Support tickets with problem code tracking.
    List/retrieve: support, director, admin. Create: support, director, admin.
    Update (assign, status, resolution): support, director, admin.
    """
    permission_classes = [IsSupportOrDirectorOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'assigned_to', 'problem_code']
    search_fields = ['subject', 'description', 'reporter_email', 'reporter_name']
    ordering_fields = ['created_at', 'updated_at', 'priority', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        return SupportTicket.objects.select_related('problem_code', 'assigned_to', 'created_by').all()

    def get_serializer_class(self):
        if self.action == 'list':
            return SupportTicketListSerializer
        if self.action in ('retrieve',):
            return SupportTicketDetailSerializer
        return SupportTicketCreateUpdateSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign ticket to a user (support agent)."""
        ticket = self.get_object()
        user_id = request.data.get('assigned_to_id')
        if user_id is not None:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                user = User.objects.get(id=user_id)
                ticket.assigned_to = user
                ticket.save(update_fields=['assigned_to', 'updated_at'])
                return Response(SupportTicketDetailSerializer(ticket).data)
            except User.DoesNotExist:
                return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        ticket.assigned_to = None
        ticket.save(update_fields=['assigned_to', 'updated_at'])
        return Response(SupportTicketDetailSerializer(ticket).data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Dashboard stats: counts by status and priority."""
        qs = SupportTicket.objects.all()
        by_status = {}
        for s in SupportTicket.STATUS_CHOICES:
            by_status[s[0]] = qs.filter(status=s[0]).count()
        by_priority = {}
        for p in SupportTicket.PRIORITY_CHOICES:
            by_priority[p[0]] = qs.filter(priority=p[0]).count()
        open_count = qs.filter(status__in=['open', 'in_progress', 'pending_customer']).count()
        return Response({
            'by_status': by_status,
            'by_priority': by_priority,
            'open_count': open_count,
            'total': qs.count(),
        })
