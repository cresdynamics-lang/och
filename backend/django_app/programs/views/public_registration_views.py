"""
Public registration views - no authentication required.
Students and sponsors can apply from the homepage.
Director views for listing applications - authentication required.
Application review workflow: assign to mentor, grade, interview, enroll.
"""
from decimal import Decimal
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.utils import timezone

from ..models import Cohort, CohortPublicApplication, MentorAssignment, Enrollment


# Default form fields when director hasn't customized
DEFAULT_STUDENT_FIELDS = [
    {'key': 'first_name', 'label': 'First Name', 'type': 'text', 'required': True},
    {'key': 'last_name', 'label': 'Last Name', 'type': 'text', 'required': True},
    {'key': 'email', 'label': 'Email', 'type': 'email', 'required': True},
    {'key': 'phone', 'label': 'Phone', 'type': 'tel', 'required': False},
]
DEFAULT_SPONSOR_FIELDS = [
    {'key': 'org_name', 'label': 'Organization Name', 'type': 'text', 'required': True},
    {'key': 'contact_name', 'label': 'Contact Name', 'type': 'text', 'required': True},
    {'key': 'contact_email', 'label': 'Contact Email', 'type': 'email', 'required': True},
    {'key': 'phone', 'label': 'Phone', 'type': 'tel', 'required': False},
]


def _build_profile_image_url(cohort, request):
    """Build absolute URL for cohort profile image."""
    if not cohort.profile_image:
        return None
    if request:
        return request.build_absolute_uri(cohort.profile_image.url)
    base = getattr(settings, 'SITE_URL', '') or ''
    return f"{base}{cohort.profile_image.url}" if cohort.profile_image.url.startswith('/') else cohort.profile_image.url


@api_view(['GET'])
@permission_classes([AllowAny])
def list_published_cohorts(request):
    """
    GET /api/v1/public/cohorts/
    List cohorts published to homepage. No auth required.
    """
    cohorts = Cohort.objects.filter(
        published_to_homepage=True,
        status__in=['active', 'running', 'draft']
    ).select_related('track__program').order_by('-start_date')

    data = []
    for c in cohorts:
        fields = c.registration_form_fields or {}
        track_data = None
        program_data = None
        
        if c.track:
            track_data = {'id': str(c.track.id), 'name': c.track.name}
            if c.track.program:
                program_data = {'id': str(c.track.program.id), 'name': c.track.program.name}
        
        data.append({
            'id': str(c.id),
            'name': c.name,
            'start_date': str(c.start_date),
            'end_date': str(c.end_date),
            'mode': c.mode,
            'track': track_data,
            'program': program_data,
            'profile_image_url': _build_profile_image_url(c, request),
            'student_form_fields': fields.get('student') or DEFAULT_STUDENT_FIELDS,
            'sponsor_form_fields': fields.get('sponsor') or DEFAULT_SPONSOR_FIELDS,
            'seat_cap': c.seat_cap,
            'enrollment_count': c.enrollments.filter(status='active').count(),
        })
    return Response({'cohorts': data, 'count': len(data)})


@api_view(['POST'])
@permission_classes([AllowAny])
def apply_as_student(request, cohort_id):
    """
    POST /api/v1/public/cohorts/{cohort_id}/apply/student/
    Submit student application. No auth required.
    Body: { form_data: { first_name, last_name, email, ... } }
    """
    cohort = get_object_or_404(Cohort, id=cohort_id, published_to_homepage=True)
    form_data = request.data.get('form_data') or request.data
    if not isinstance(form_data, dict):
        return Response({'error': 'form_data must be an object'}, status=status.HTTP_400_BAD_REQUEST)
    if not form_data.get('email'):
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    app = CohortPublicApplication.objects.create(
        cohort=cohort,
        applicant_type='student',
        form_data=form_data,
        status='pending',
    )
    return Response({
        'success': True,
        'message': 'Application submitted successfully. The program team will review your application.',
        'application_id': str(app.id),
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def join_as_sponsor(request, cohort_id):
    """
    POST /api/v1/public/cohorts/{cohort_id}/apply/sponsor/
    Submit sponsor interest/registration. No auth required.
    Body: { form_data: { org_name, contact_name, contact_email, ... } }
    """
    cohort = get_object_or_404(Cohort, id=cohort_id, published_to_homepage=True)
    form_data = request.data.get('form_data') or request.data
    if not isinstance(form_data, dict):
        return Response({'error': 'form_data must be an object'}, status=status.HTTP_400_BAD_REQUEST)
    contact_email = form_data.get('contact_email') or form_data.get('email')
    if not contact_email:
        return Response({'error': 'Contact email is required'}, status=status.HTTP_400_BAD_REQUEST)

    app = CohortPublicApplication.objects.create(
        cohort=cohort,
        applicant_type='sponsor',
        form_data=form_data,
        status='pending',
    )
    return Response({
        'success': True,
        'message': 'Interest submitted successfully. The program team will be in touch.',
        'application_id': str(app.id),
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_public_applications(request):
    """
    GET /api/v1/director/public-applications/
    List public applications (student/sponsor) for director. Auth required.
    Query params: cohort_id, applicant_type (student|sponsor), status
    """
    from ..permissions import _is_director_or_admin
    if not _is_director_or_admin(request.user):
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Directors and admins only.")

    qs = CohortPublicApplication.objects.select_related(
        'cohort', 'cohort__track', 'cohort__track__program',
        'reviewer_mentor', 'interview_mentor'
    ).order_by('-created_at')

    cohort_id = request.query_params.get('cohort_id')
    if cohort_id:
        qs = qs.filter(cohort_id=cohort_id)

    applicant_type = request.query_params.get('applicant_type')
    if applicant_type and applicant_type in ('student', 'sponsor'):
        qs = qs.filter(applicant_type=applicant_type)

    status_filter = request.query_params.get('status')
    if status_filter and status_filter in ('pending', 'approved', 'rejected', 'converted'):
        qs = qs.filter(status=status_filter)

    review_status_filter = request.query_params.get('review_status')
    if review_status_filter and review_status_filter in ('pending', 'reviewed', 'failed', 'passed'):
        qs = qs.filter(review_status=review_status_filter)

    mentor_id = request.query_params.get('reviewer_mentor_id')
    if mentor_id:
        try:
            qs = qs.filter(reviewer_mentor_id=int(mentor_id))
        except (ValueError, TypeError):
            pass

    enrollment_status_filter = request.query_params.get('enrollment_status')
    if enrollment_status_filter and enrollment_status_filter in ('eligible', 'enrolled', 'none'):
        qs = qs.filter(enrollment_status=enrollment_status_filter)

    data = []
    for app in qs:
        email = app.form_data.get('email') or app.form_data.get('contact_email', '')
        name = (app.form_data.get('first_name', '') + ' ' + app.form_data.get('last_name', '')).strip() or app.form_data.get('contact_name', '')
        data.append(_application_to_dict(app, email, name))
    return Response({'applications': data, 'count': len(data)})


def _application_to_dict(app, email=None, name=None):
    """Build application dict for API responses."""
    if email is None:
        email = app.form_data.get('email') or app.form_data.get('contact_email', '')
    if name is None:
        name = (app.form_data.get('first_name', '') + ' ' + app.form_data.get('last_name', '')).strip() or app.form_data.get('contact_name', '')
    return {
        'id': str(app.id),
        'cohort_id': str(app.cohort_id),
        'cohort_name': app.cohort.name,
        'applicant_type': app.applicant_type,
        'status': app.status,
        'form_data': app.form_data,
        'email': email.strip(),
        'name': name.strip() or '-',
        'notes': app.notes,
        'created_at': app.created_at.isoformat(),
        'reviewer_mentor_id': getattr(app, 'reviewer_mentor_id', None),
        'reviewer_mentor_name': (app.reviewer_mentor.get_full_name() or app.reviewer_mentor.email) if getattr(app, 'reviewer_mentor', None) else None,
        'review_score': float(app.review_score) if getattr(app, 'review_score', None) is not None else None,
        'review_status': getattr(app, 'review_status', None) or 'pending',
        'interview_mentor_id': getattr(app, 'interview_mentor_id', None),
        'interview_mentor_name': (app.interview_mentor.get_full_name() or app.interview_mentor.email) if getattr(app, 'interview_mentor', None) else None,
        'interview_score': float(app.interview_score) if getattr(app, 'interview_score', None) is not None else None,
        'interview_status': getattr(app, 'interview_status', None),
        'enrollment_status': getattr(app, 'enrollment_status', None) or 'none',
    }


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_applications_to_mentor(request):
    """
    POST /api/v1/director/public-applications/assign-to-mentor/
    Director assigns selected student applications to a mentor for review.
    Body: { application_ids: [uuid,...], mentor_id: int }
    """
    from ..permissions import _is_director_or_admin
    if not _is_director_or_admin(request.user):
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Directors and admins only.")

    app_ids = request.data.get('application_ids') or []
    mentor_id = request.data.get('mentor_id')
    if not app_ids or not mentor_id:
        return Response(
            {'error': 'application_ids and mentor_id are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        mentor = User.objects.get(id=int(mentor_id))
    except (User.DoesNotExist, ValueError, TypeError):
        return Response({'error': 'Mentor not found'}, status=status.HTTP_404_NOT_FOUND)

    # Only student applications
    apps = CohortPublicApplication.objects.filter(
        id__in=app_ids,
        applicant_type='student',
        reviewer_mentor__isnull=True,  # not yet assigned
    ).select_related('cohort')
    cohort_ids = set(a.cohort_id for a in apps)
    # Verify mentor is assigned to all cohorts
    for cid in cohort_ids:
        if not MentorAssignment.objects.filter(cohort_id=cid, mentor=mentor, active=True).exists():
            return Response(
                {'error': f'Mentor is not assigned to cohort {cid}. Assign mentor to cohort first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

    updated = apps.update(reviewer_mentor=mentor, review_status='pending')
    return Response({'assigned_count': updated, 'message': f'Assigned {updated} application(s) to mentor.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_mentor_applications(request):
    """
    GET /api/v1/mentor/applications-to-review/
    Mentor lists applications assigned to them for review.
    """
    qs = CohortPublicApplication.objects.filter(
        reviewer_mentor=request.user,
        applicant_type='student',
    ).select_related('cohort', 'cohort__track').order_by('-created_at')

    status_filter = request.query_params.get('status')
    if status_filter in ('pending', 'reviewed', 'passed', 'failed'):
        qs = qs.filter(review_status=status_filter)

    data = []
    for app in qs:
        email = app.form_data.get('email') or app.form_data.get('contact_email', '')
        name = (app.form_data.get('first_name', '') + ' ' + app.form_data.get('last_name', '')).strip() or app.form_data.get('contact_name', '')
        data.append(_application_to_dict(app, email, name))
    return Response({'applications': data, 'count': len(data)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def grade_application(request, application_id):
    """
    POST /api/v1/mentor/applications-to-review/{id}/grade/
    Mentor grades an application (review step).
    Body: { score: number (0-100), review_notes?: string }
    """
    app = get_object_or_404(CohortPublicApplication, id=application_id)
    if app.reviewer_mentor_id != request.user.id:
        return Response({'error': 'Not authorized to grade this application'}, status=status.HTTP_403_FORBIDDEN)

    score = request.data.get('score')
    if score is None:
        return Response({'error': 'score is required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        score_val = Decimal(str(score))
        if score_val < 0 or score_val > 100:
            raise ValueError('Score must be 0-100')
    except (ValueError, TypeError):
        return Response({'error': 'score must be a number between 0 and 100'}, status=status.HTTP_400_BAD_REQUEST)

    app.review_score = score_val
    app.review_graded_at = timezone.now()
    app.review_status = 'reviewed'

    review_notes = (request.data.get('review_notes') or '').strip()
    if review_notes:
        fd = dict(app.form_data or {})
        fd['review_notes'] = review_notes
        app.form_data = fd
        app.save(update_fields=['review_score', 'review_graded_at', 'review_status', 'form_data', 'updated_at'])
    else:
        app.save(update_fields=['review_score', 'review_graded_at', 'review_status', 'updated_at'])

    return Response({'success': True, 'review_score': float(score_val)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def grade_interview(request, application_id):
    """
    POST /api/v1/mentor/applications-to-review/{id}/grade-interview/
    Mentor grades interview for an application that passed review.
    Body: { score: number (0-100) }
    """
    app = get_object_or_404(CohortPublicApplication, id=application_id)
    if app.reviewer_mentor_id != request.user.id and app.interview_mentor_id != request.user.id:
        if app.interview_mentor_id is None:
            app.interview_mentor = request.user
        else:
            return Response({'error': 'Not authorized to grade this interview'}, status=status.HTTP_403_FORBIDDEN)

    if app.review_status != 'passed':
        return Response({'error': 'Application must pass review before interview'}, status=status.HTTP_400_BAD_REQUEST)

    score = request.data.get('score')
    if score is None:
        return Response({'error': 'score is required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        score_val = Decimal(str(score))
        if score_val < 0 or score_val > 100:
            raise ValueError('Score must be 0-100')
    except (ValueError, TypeError):
        return Response({'error': 'score must be a number between 0 and 100'}, status=status.HTTP_400_BAD_REQUEST)

    app.interview_score = score_val
    app.interview_graded_at = timezone.now()
    app.interview_status = 'completed'
    if app.interview_mentor_id is None:
        app.interview_mentor = request.user
    interview_notes = request.data.get('interview_notes', '').strip()
    support_documents = request.data.get('support_documents', '')
    if isinstance(support_documents, list):
        support_documents = '\n'.join(str(u) for u in support_documents if u)
    else:
        support_documents = str(support_documents).strip() if support_documents else ''
    fd = dict(app.form_data or {})
    if interview_notes:
        fd['interview_notes'] = interview_notes
    if support_documents:
        fd['support_documents'] = support_documents
    app.form_data = fd
    app.save(update_fields=['interview_score', 'interview_graded_at', 'interview_status', 'interview_mentor_id', 'form_data', 'updated_at'])

    return Response({'success': True, 'interview_score': float(score_val)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_review_cutoff(request):
    """
    POST /api/v1/director/public-applications/set-review-cutoff/
    Director sets the review cutoff grade. Applications with review_score >= cutoff get review_status='passed'.
    Body: { cohort_id: uuid, cutoff_grade: number }
    """
    from ..permissions import _is_director_or_admin
    if not _is_director_or_admin(request.user):
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Directors and admins only.")

    cohort_id = request.data.get('cohort_id')
    cutoff = request.data.get('cutoff_grade')
    if not cohort_id or cutoff is None:
        return Response({'error': 'cohort_id and cutoff_grade are required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        cutoff_val = Decimal(str(cutoff))
    except (ValueError, TypeError):
        return Response({'error': 'cutoff_grade must be a number'}, status=status.HTTP_400_BAD_REQUEST)

    cohort = get_object_or_404(Cohort, id=cohort_id)
    cohort.review_cutoff_grade = cutoff_val
    cohort.save(update_fields=['review_cutoff_grade'])

    # Update applications: reviewed with score >= cutoff -> passed, else failed
    updated_passed = CohortPublicApplication.objects.filter(
        cohort_id=cohort_id,
        applicant_type='student',
        review_status='reviewed',
        review_score__gte=cutoff_val,
    ).update(review_status='passed')
    updated_failed = CohortPublicApplication.objects.filter(
        cohort_id=cohort_id,
        applicant_type='student',
        review_status='reviewed',
        review_score__lt=cutoff_val,
    ).update(review_status='failed', status='rejected')

    return Response({
        'success': True,
        'passed_count': updated_passed,
        'failed_count': updated_failed,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_interview_cutoff(request):
    """
    POST /api/v1/director/public-applications/set-interview-cutoff/
    Director sets interview cutoff. Applications with interview_score >= cutoff get enrollment_status='eligible'.
    Body: { cohort_id: uuid, cutoff_grade: number }
    """
    from ..permissions import _is_director_or_admin
    if not _is_director_or_admin(request.user):
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Directors and admins only.")

    cohort_id = request.data.get('cohort_id')
    cutoff = request.data.get('cutoff_grade')
    if not cohort_id or cutoff is None:
        return Response({'error': 'cohort_id and cutoff_grade are required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        cutoff_val = Decimal(str(cutoff))
    except (ValueError, TypeError):
        return Response({'error': 'cutoff_grade must be a number'}, status=status.HTTP_400_BAD_REQUEST)

    cohort = get_object_or_404(Cohort, id=cohort_id)
    cohort.interview_cutoff_grade = cutoff_val
    cohort.save(update_fields=['interview_cutoff_grade'])

    # Process all applications with interview scores (including re-runs when director changes cutoff)
    graded_qs = CohortPublicApplication.objects.filter(
        cohort_id=cohort_id,
        applicant_type='student',
        interview_score__isnull=False,
    ).exclude(enrollment_status='enrolled')
    graded_count = graded_qs.count()
    updated = graded_qs.filter(interview_score__gte=cutoff_val).update(interview_status='passed', enrollment_status='eligible')
    graded_qs.filter(interview_score__lt=cutoff_val).update(interview_status='failed', enrollment_status='none', status='rejected')

    return Response({
        'success': True,
        'eligible_count': updated,
        'graded_count': graded_count,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enroll_applications(request):
    """
    POST /api/v1/director/public-applications/enroll/
    Director enrolls eligible applicants. Creates User (if needed) and Enrollment.
    Body: { application_ids: [uuid,...] }
    Mentors who reviewed/interviewed passed students remain their mentors.
    """
    from ..permissions import _is_director_or_admin
    if not _is_director_or_admin(request.user):
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Directors and admins only.")

    from django.contrib.auth import get_user_model
    from users.models import UserRole, Role

    User = get_user_model()
    app_ids = request.data.get('application_ids') or []
    if not app_ids:
        return Response({'error': 'application_ids is required'}, status=status.HTTP_400_BAD_REQUEST)

    # 1) Enroll student applications that are marked as eligible
    apps = CohortPublicApplication.objects.filter(
        id__in=app_ids,
        applicant_type='student',
        enrollment_status='eligible',
    ).select_related('cohort')
    student_role, _ = Role.objects.get_or_create(name='student')
    enrolled = 0
    for app in apps:
        email = (app.form_data.get('email') or app.form_data.get('contact_email') or '').strip()
        if not email:
            continue
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            user = User.objects.create(
                email=email,
                username=email,
                first_name=(app.form_data.get('first_name') or '')[:150],
                last_name=(app.form_data.get('last_name') or '')[:150],
            )
            UserRole.objects.get_or_create(user=user, role=student_role, defaults={'is_active': True})
        if Enrollment.objects.filter(cohort=app.cohort, user=user).exists():
            continue
        enroll = Enrollment.objects.create(
            cohort=app.cohort,
            user=user,
            enrollment_type='director',
            seat_type='scholarship',
            payment_status='waived',
            status='active',
        )
        app.enrollment = enroll
        app.enrollment_status = 'enrolled'
        app.status = 'converted'
        app.save(update_fields=['enrollment_id', 'enrollment_status', 'status', 'updated_at'])

        # Create MenteeMentorAssignment so reviewer/interview mentor remains their mentor
        from mentorship_coordination.models import MenteeMentorAssignment
        mentors_to_assign = set()
        if app.reviewer_mentor_id:
            mentors_to_assign.add(app.reviewer_mentor_id)
        if app.interview_mentor_id:
            mentors_to_assign.add(app.interview_mentor_id)
        for mid in mentors_to_assign:
            mentor_user = User.objects.filter(id=mid).first()
            if mentor_user:
                MenteeMentorAssignment.objects.get_or_create(
                    mentee=user,
                    mentor=mentor_user,
                    defaults={
                        'cohort_id': str(app.cohort_id),
                        'assignment_type': 'direct',
                        'status': 'active',
                    }
                )
        enrolled += 1

    # 2) Enroll sponsor applications (create sponsor admin user + sponsor–cohort assignment)
    from sponsors.models import SponsorCohortAssignment

    sponsor_apps = CohortPublicApplication.objects.filter(
        id__in=app_ids,
        applicant_type='sponsor',
    ).select_related('cohort')
    sponsor_role, _ = Role.objects.get_or_create(name='sponsor_admin')
    sponsor_enrolled = 0

    for app in sponsor_apps:
        email = (app.form_data.get('email') or app.form_data.get('contact_email') or '').strip()
        if not email:
            continue

        # Create or fetch sponsor user
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            contact_name = (app.form_data.get('contact_name') or '').strip()
            org_name = (app.form_data.get('organization_name') or '').strip()
            first_name = contact_name.split(' ')[0] if contact_name else (org_name or email).split(' ')[0]
            last_name = ' '.join(contact_name.split(' ')[1:]) if contact_name and len(contact_name.split(' ')) > 1 else ''
            user = User.objects.create(
                email=email,
                username=email,
                first_name=first_name[:150],
                last_name=last_name[:150],
            )
        UserRole.objects.get_or_create(user=user, role=sponsor_role, defaults={'is_active': True})

        # Create sponsor–cohort assignment (basic funding role, 1 seat) if it doesn't exist
        SponsorCohortAssignment.objects.get_or_create(
            sponsor_uuid_id=user,
            cohort_id=app.cohort,
            defaults={
                'role': 'funding',
                'seat_allocation': 1,
            },
        )

        # Mark application as converted/enrolled (for tracking)
        app.enrollment_status = 'enrolled'
        app.status = 'converted'
        app.save(update_fields=['enrollment_status', 'status', 'updated_at'])
        sponsor_enrolled += 1

    return Response({
        'success': True,
        'enrolled_count': enrolled,
        'sponsor_enrolled_count': sponsor_enrolled,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_application(request):
    """
    POST /api/v1/director/public-applications/reject/
    Director rejects a single application.
    Body: { application_id: uuid, reason?: string }
    """
    from ..permissions import _is_director_or_admin
    if not _is_director_or_admin(request.user):
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Directors and admins only.")

    app_id = request.data.get('application_id')
    reason = (request.data.get('reason') or '').strip()
    if not app_id:
        return Response({'error': 'application_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    app = get_object_or_404(CohortPublicApplication, id=app_id)
    app.status = 'rejected'
    # Reset enrollment status if it was set earlier
    app.enrollment_status = 'none'
    if reason:
        app.notes = (app.notes or '') + (f"\n\nRejected: {reason}" if app.notes else f"Rejected: {reason}")
        app.save(update_fields=['status', 'enrollment_status', 'notes', 'updated_at'])
    else:
        app.save(update_fields=['status', 'enrollment_status', 'updated_at'])

    return Response({'success': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_application_credentials_email_view(request):
    """
    POST /api/v1/director/public-applications/send-credentials/
    Send acceptance + credentials email (password setup link) for a given application.
    Body: { application_id: uuid }
    """
    from ..permissions import _is_director_or_admin
    if not _is_director_or_admin(request.user):
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Directors and admins only.")

    from django.contrib.auth import get_user_model
    from users.utils.auth_utils import create_mfa_code
    from users.utils.email_utils import send_application_credentials_email

    app_id = request.data.get('application_id')
    if not app_id:
        return Response({'error': 'application_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    app = get_object_or_404(CohortPublicApplication, id=app_id)
    # Resolve email from form data
    email = (app.form_data.get('email') or app.form_data.get('contact_email') or '').strip()
    if not email:
        return Response({'error': 'No email found on application'}, status=status.HTTP_400_BAD_REQUEST)

    User = get_user_model()
    user = User.objects.filter(email__iexact=email).first()
    if not user:
        return Response({'error': 'User not found. Enroll the application first to create an account.'}, status=status.HTTP_400_BAD_REQUEST)

    # Generate one-time code and build reset URL
    code, _ = create_mfa_code(user, method='email', expires_minutes=60)
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    reset_url = f"{frontend_url}/auth/reset-password?token={code}&email={email}"

    cohort_name = app.cohort.name
    send_application_credentials_email(
        user=user,
        cohort_name=cohort_name,
        reset_url=reset_url,
        applicant_type=app.applicant_type,
    )

    return Response({'success': True})
