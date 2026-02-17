"""
Views for updating enrollment details (organization, etc.)
"""
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsAdminOrDirector
from programs.models import Enrollment
from organizations.models import Organization

logger = logging.getLogger(__name__)


class UpdateEnrollmentOrganizationView(APIView):
    """
    Update enrollment organization.
    PATCH /api/v1/cohorts/{cohort_id}/enrollments/{enrollment_id}/
    Body: { "org": "org_id" or null }
    """
    permission_classes = [IsAuthenticated, IsAdminOrDirector]

    def patch(self, request, cohort_id, enrollment_id):
        try:
            from programs.models import Cohort
            cohort = Cohort.objects.get(id=cohort_id)
            enrollment = Enrollment.objects.get(id=enrollment_id, cohort=cohort)
        except Cohort.DoesNotExist:
            return Response(
                {'error': 'Cohort not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Enrollment.DoesNotExist:
            return Response(
                {'error': 'Enrollment not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        org_id = request.data.get('org')
        org = None
        
        if org_id:
            try:
                org = Organization.objects.get(id=org_id)
            except Organization.DoesNotExist:
                return Response(
                    {'error': 'Organization not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        enrollment.org = org
        enrollment.save(update_fields=['org'])

        from programs.serializers import EnrollmentSerializer
        serializer = EnrollmentSerializer(enrollment)
        return Response(serializer.data, status=status.HTTP_200_OK)
