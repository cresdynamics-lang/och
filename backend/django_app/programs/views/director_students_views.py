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


def _get_direct_mentors_for_student(student):
    """Return list of direct mentor assignments for a student (for director view)."""
    from mentorship_coordination.models import MenteeMentorAssignment
    assignments = MenteeMentorAssignment.objects.filter(
        mentee_id=student.id,
        assignment_type='direct',
        status='active'
    ).select_related('mentor')
    return [
        {
            'assignment_id': str(a.id),
            'mentor_id': str(a.mentor.id),
            'mentor_name': a.mentor.get_full_name() or a.mentor.email,
        }
        for a in assignments
    ]


def _get_all_mentors_for_student(student):
    """Return all mentors (cohort, track, direct) for a student so director sees full picture."""
    from programs.models import Enrollment, MentorAssignment, TrackMentorAssignment
    from mentorship_coordination.models import MenteeMentorAssignment
    result = []
    seen = set()  # (mentor_id, type) to avoid duplicates
    # Cohort mentors
    for enrollment in Enrollment.objects.filter(
        user_id=student.id,
        status__in=['active', 'completed']
    ).select_related('cohort'):
        if not enrollment.cohort:
            continue
        for ma in MentorAssignment.objects.filter(cohort=enrollment.cohort, active=True).select_related('mentor'):
            if ma.mentor and (str(ma.mentor.id), 'cohort') not in seen:
                seen.add((str(ma.mentor.id), 'cohort'))
                result.append({
                    'type': 'cohort',
                    'mentor_id': str(ma.mentor.id),
                    'mentor_name': ma.mentor.get_full_name() or ma.mentor.email,
                    'assignment_id': None,
                })
    # Track mentors (programs Track via enrollment)
    for enrollment in Enrollment.objects.filter(
        user_id=student.id,
        status__in=['active', 'completed']
    ).select_related('cohort', 'cohort__track'):
        if not enrollment.cohort or not getattr(enrollment.cohort, 'track_id', None):
            continue
        track = getattr(enrollment.cohort, 'track', None)
        if not track:
            continue
        for ta in TrackMentorAssignment.objects.filter(track=track, active=True).select_related('mentor'):
            if ta.mentor and (str(ta.mentor.id), 'track') not in seen:
                seen.add((str(ta.mentor.id), 'track'))
                result.append({
                    'type': 'track',
                    'mentor_id': str(ta.mentor.id),
                    'mentor_name': ta.mentor.get_full_name() or ta.mentor.email,
                    'assignment_id': None,
                })
    # Track mentors (curriculum track, e.g. from MenteeMentorAssignment synced by track_key)
    for a in MenteeMentorAssignment.objects.filter(
        mentee_id=student.id,
        assignment_type='track',
        status='active'
    ).select_related('mentor'):
        if a.mentor and (str(a.mentor.id), 'track') not in seen:
            seen.add((str(a.mentor.id), 'track'))
            result.append({
                'type': 'track',
                'mentor_id': str(a.mentor.id),
                'mentor_name': a.mentor.get_full_name() or a.mentor.email,
                'assignment_id': str(a.id),
            })
    # Direct mentors (removable)
    for a in MenteeMentorAssignment.objects.filter(
        mentee_id=student.id,
        assignment_type='direct',
        status='active'
    ).select_related('mentor'):
        if a.mentor and (str(a.mentor.id), 'direct') not in seen:
            seen.add((str(a.mentor.id), 'direct'))
            result.append({
                'type': 'direct',
                'mentor_id': str(a.mentor.id),
                'mentor_name': a.mentor.get_full_name() or a.mentor.email,
                'assignment_id': str(a.id),
            })
    return result


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
        
        TRACK_KEY_DISPLAY = {
            'cyber_defense': 'Career Track (Defender)',
            'defender': 'Defender',
            'defensive-security': 'Defensive Security',
            'offensive': 'Offensive',
            'grc': 'GRC',
            'innovation': 'Innovation',
            'leadership': 'Leadership',
        }

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
            
            track_key = (getattr(student, 'track_key', None) or '').strip() or None
            track_display = TRACK_KEY_DISPLAY.get((track_key or '').lower()) if track_key else None
            if not track_display and track_key:
                track_display = track_key.replace('_', ' ').title()

            direct_mentors = _get_direct_mentors_for_student(student)
            all_mentors = _get_all_mentors_for_student(student)
            students_data.append({
                'id': student.id,
                'uuid_id': str(student.uuid_id),
                'email': student.email,
                'first_name': student.first_name or '',
                'last_name': student.last_name or '',
                'sponsor_id': sponsor_id,
                'sponsor_name': sponsor_name,
                'track_key': track_key,
                'track_display': track_display,
                'direct_mentors': direct_mentors,
                'all_mentors': all_mentors,
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
                'uuid_id': str(sponsor.uuid_id),
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unlink_students_from_sponsor(request):
    """Unlink one or more students from a sponsor (or from their current sponsor)."""
    try:
        student_ids = request.data.get('student_ids', [])
        sponsor_id = request.data.get('sponsor_id')

        if not student_ids:
            return Response({
                'success': False,
                'error': 'student_ids is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if sponsor_id:
            # Unlink specified students from this sponsor
            try:
                sponsor = User.objects.get(uuid_id=sponsor_id)
            except User.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Sponsor not found'
                }, status=status.HTTP_404_NOT_FOUND)
            links = SponsorStudentLink.objects.filter(
                sponsor=sponsor,
                student__uuid_id__in=student_ids,
                is_active=True
            )
        else:
            # Unlink specified students from any sponsor
            links = SponsorStudentLink.objects.filter(
                student__uuid_id__in=student_ids,
                is_active=True
            )

        updated = links.update(is_active=False)
        return Response({
            'success': True,
            'message': f'Unlinked {updated} student(s) from sponsor',
            'updated_count': updated
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_direct_mentor_assignment(request):
    """Remove a direct mentor assignment (director only). Body: assignment_id."""
    try:
        assignment_id = request.data.get('assignment_id')
        if not assignment_id:
            return Response({
                'success': False,
                'error': 'assignment_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        from mentorship_coordination.models import MenteeMentorAssignment
        assignment = MenteeMentorAssignment.objects.filter(
            id=assignment_id,
            assignment_type='direct',
            status='active'
        ).first()
        if not assignment:
            return Response({
                'success': False,
                'error': 'Direct mentor assignment not found or already removed'
            }, status=status.HTTP_404_NOT_FOUND)

        assignment.status = 'cancelled'
        assignment.save(update_fields=['status'])
        return Response({
            'success': True,
            'message': 'Direct mentor assignment removed',
            'assignment_id': str(assignment.id)
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