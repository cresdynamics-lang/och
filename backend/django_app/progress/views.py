"""
Progress views for DRF.
"""
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Progress
from .serializers import ProgressSerializer


class ProgressViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Progress model.
    """
    queryset = Progress.objects.all()
    serializer_class = ProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['content_type', 'status', 'user']
    search_fields = ['content_id']
    ordering_fields = ['created_at', 'updated_at', 'completion_percentage']
    ordering = ['-updated_at']
    
    def get_queryset(self):
        """
        Filter progress by current user unless admin.
        """
        user = self.request.user
        if user.is_staff:
            return Progress.objects.all()
        return Progress.objects.filter(user=user)


