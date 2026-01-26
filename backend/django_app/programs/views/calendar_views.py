"""
Calendar Event ViewSet for managing calendar events (assessment windows).
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import CalendarEvent
from ..serializers import CalendarEventSerializer
from users.models import Role, UserRole


class CalendarEventViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Calendar Event CRUD operations.
    Endpoints:
    - GET /api/v1/cohorts/calendar/ - List calendar events (filtered by cohort)
    - POST /api/v1/cohorts/calendar/ - Create calendar event
    - GET /api/v1/cohorts/calendar/{id}/ - Get calendar event detail
    - PATCH /api/v1/cohorts/calendar/{id}/ - Update calendar event
    - DELETE /api/v1/cohorts/calendar/{id}/ - Delete calendar event
    """
    queryset = CalendarEvent.objects.all()
    serializer_class = CalendarEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter calendar events by cohort if provided."""
        queryset = CalendarEvent.objects.all().order_by('-start_ts')
        
        # Filter by cohort_id if provided
        cohort_id = self.request.query_params.get('cohort_id')
        if cohort_id:
            queryset = queryset.filter(cohort_id=cohort_id)
        
        # Filter by type if provided (for assessment windows)
        event_type = self.request.query_params.get('type')
        if event_type:
            queryset = queryset.filter(type=event_type)
        
        return queryset

    def get_permissions(self):
        """Only allow Program Directors and Admins to manage calendar events."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        """Create a new calendar event (Program Director only)."""
        # Check if user is admin or program_director
        if not request.user.is_staff:
            director_role = Role.objects.filter(name='program_director').first()
            if director_role:
                is_director = UserRole.objects.filter(
                    user=request.user,
                    role=director_role,
                    is_active=True
                ).exists()
                if not is_director:
                    return Response(
                        {'detail': 'Only program directors and administrators can create calendar events'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            else:
                return Response(
                    {'detail': 'Only program directors and administrators can create calendar events'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        """Update a calendar event (Program Director only)."""
        # Check if user is admin or program_director
        if not request.user.is_staff:
            director_role = Role.objects.filter(name='program_director').first()
            if director_role:
                is_director = UserRole.objects.filter(
                    user=request.user,
                    role=director_role,
                    is_active=True
                ).exists()
                if not is_director:
                    return Response(
                        {'detail': 'Only program directors and administrators can update calendar events'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            else:
                return Response(
                    {'detail': 'Only program directors and administrators can update calendar events'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Delete a calendar event (Program Director only)."""
        # Check if user is admin or program_director
        if not request.user.is_staff:
            director_role = Role.objects.filter(name='program_director').first()
            if director_role:
                is_director = UserRole.objects.filter(
                    user=request.user,
                    role=director_role,
                    is_active=True
                ).exists()
                if not is_director:
                    return Response(
                        {'detail': 'Only program directors and administrators can delete calendar events'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            else:
                return Response(
                    {'detail': 'Only program directors and administrators can delete calendar events'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        return super().destroy(request, *args, **kwargs)

