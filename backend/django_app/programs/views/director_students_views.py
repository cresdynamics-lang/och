"""
Director Students Management API Views
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.db.models import Q
from users.models import Role, UserRole, SponsorStudentLink

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def director_students_list(request):
    """Get all students with their sponsor information."""
    try:
        # Get all users with student role
        student_role = Role.objects.filter(name='student').first()
        if not student_role:
            return Response({'students': []})
        
        student_user_ids = UserRole.objects.filter(
            role=student_role,
            is_active=True
        ).values_list('user_id', flat=True)
        
        students = User.objects.filter(
            id__in=student_user_ids,
            is_active=True
        ).order_by('-created_at')
        
        students_data = []
        for student in students:
            # Get sponsor link if exists
            sponsor_link = SponsorStudentLink.objects.filter(
                student=student,
                is_active=True
            ).select_related('sponsor').first()
            
            sponsor_name = None
            sponsor_id = None
            if sponsor_link:
                sponsor = sponsor_link.sponsor
                sponsor_name = f"{sponsor.first_name} {sponsor.last_name}".strip()
                if not sponsor_name:
                    sponsor_name = sponsor.email
                sponsor_id = str(sponsor.uuid_id)
            
            students_data.append({
                'id': student.id,
                'uuid_id': str(student.uuid_id),
                'email': student.email,
                'first_name': student.first_name or '',
                'last_name': student.last_name or '',
                'sponsor_id': sponsor_id,
                'sponsor_name': sponsor_name,
                'created_at': student.created_at.isoformat()
            })
        
        return Response({
            'success': True,
            'students': students_data,
            'count': len(students_data)
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def director_sponsors_list(request):
    """Get all sponsors for linking students."""
    try:
        # Get all users with sponsor_admin role
        sponsor_role = Role.objects.filter(name='sponsor_admin').first()
        if not sponsor_role:
            return Response({'sponsors': []})
        
        sponsor_user_ids = UserRole.objects.filter(
            role=sponsor_role,
            is_active=True
        ).values_list('user_id', flat=True)
        
        sponsors = User.objects.filter(
            id__in=sponsor_user_ids,
            account_status='active'
        ).order_by('first_name', 'last_name', 'email')
        
        sponsors_data = []
        for sponsor in sponsors:
            sponsors_data.append({
                'id': sponsor.id,
                'email': sponsor.email,
                'first_name': sponsor.first_name or '',
                'last_name': sponsor.last_name or '',
                'organization': sponsor.org_id.name if sponsor.org_id else None
            })
        
        return Response({
            'success': True,
            'sponsors': sponsors_data,
            'count': len(sponsors_data)
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def link_students_to_sponsor(request):
    """Link multiple students to a sponsor."""
    try:
        student_ids = request.data.get('student_ids', [])
        sponsor_id = request.data.get('sponsor_id')
        
        if not student_ids or not sponsor_id:
            return Response({
                'success': False,
                'error': 'student_ids and sponsor_id are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify sponsor exists and has sponsor role (sponsor_id is uuid_id from frontend)
        # Accept both 'sponsor_admin' and 'sponsor' roles (createsponsor uses 'sponsor')
        try:
            sponsor = User.objects.get(uuid_id=sponsor_id, account_status='active')
            has_sponsor_role = UserRole.objects.filter(
                user=sponsor,
                role__name__in=['sponsor_admin', 'sponsor'],
                is_active=True
            ).exists()
            if not has_sponsor_role:
                return Response({
                    'success': False,
                    'error': 'Invalid sponsor'
                }, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Sponsor not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Create sponsor-student links (use is_active=True; students may have pending_verification)
        created_count = 0
        for student_id in student_ids:
            try:
                student = User.objects.get(uuid_id=student_id, is_active=True)
                link, created = SponsorStudentLink.objects.get_or_create(
                    sponsor=sponsor,
                    student=student,
                    defaults={
                        'created_by': request.user,
                        'is_active': True
                    }
                )
                if created:
                    created_count += 1
                elif not link.is_active:
                    link.is_active = True
                    link.save()
                    created_count += 1
            except User.DoesNotExist:
                continue
        
        return Response({
            'success': True,
            'message': f'Successfully linked {created_count} students to sponsor',
            'updated_count': created_count
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sponsor_linked_students(request, sponsor_id):
    """Get students linked to a specific sponsor."""
    try:
        # Verify sponsor exists (sponsor_id is uuid_id from URL)
        try:
            sponsor = User.objects.get(uuid_id=sponsor_id, account_status='active')
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Sponsor not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get linked students
        links = SponsorStudentLink.objects.filter(
            sponsor=sponsor,
            is_active=True
        ).select_related('student')
        
        students_data = []
        for link in links:
            student = link.student
            students_data.append({
                'id': student.id,
                'email': student.email,
                'first_name': student.first_name or '',
                'last_name': student.last_name or '',
                'created_at': student.created_at.isoformat()
            })
        
        return Response({
            'success': True,
            'students': students_data,
            'count': len(students_data),
            'sponsor': {
                'id': sponsor.id,
                'email': sponsor.email,
                'first_name': sponsor.first_name or '',
                'last_name': sponsor.last_name or ''
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)