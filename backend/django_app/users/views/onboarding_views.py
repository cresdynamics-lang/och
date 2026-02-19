"""
Onboarding flow views for students.
Handles both email link onboarding and signup page onboarding.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from users.auth_models import MFAMethod

User = get_user_model()


@api_view(['GET'])
@permission_classes([AllowAny])
def check_onboarding_status(request):
    """
    GET /api/v1/auth/onboarding/status?email=xxx&code=xxx
    Check onboarding status for a user (via email link or after login).
    Returns what steps are remaining.
    """
    email = request.query_params.get('email')
    code = request.query_params.get('code')  # Magic link code from email
    
    # If authenticated, use current user
    if request.user.is_authenticated:
        user = request.user
    elif email:
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({
                'onboarding_complete': False,
                'next_step': 'signup',
                'message': 'No account found. Please sign up.'
            }, status=status.HTTP_200_OK)
    else:
        return Response(
            {'detail': 'Email or authentication required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if fully onboarded
    has_password = user.has_usable_password()
    email_verified = user.email_verified
    account_active = user.account_status == 'active' and user.is_active
    has_mfa = MFAMethod.objects.filter(user=user, enabled=True).exists()
    profiling_complete = user.profiling_complete
    
    # Determine next step
    if profiling_complete and account_active and email_verified:
        return Response({
            'onboarding_complete': True,
            'message': 'You are already onboarded to OCH. Welcome back!',
            'redirect_url': '/dashboard'
        }, status=status.HTTP_200_OK)
    
    # Email link onboarding flow
    if code:
        if not has_password:
            return Response({
                'onboarding_complete': False,
                'next_step': 'setup_password',
                'email': user.email,
                'code': code,
                'message': 'Please set up your password'
            }, status=status.HTTP_200_OK)
        elif not account_active or not email_verified:
            return Response({
                'onboarding_complete': False,
                'next_step': 'login',
                'email': user.email,
                'message': 'Please login to continue'
            }, status=status.HTTP_200_OK)
        elif not has_mfa:
            return Response({
                'onboarding_complete': False,
                'next_step': 'setup_mfa',
                'email': user.email,
                'message': 'Please set up multi-factor authentication'
            }, status=status.HTTP_200_OK)
        elif not profiling_complete:
            return Response({
                'onboarding_complete': False,
                'next_step': 'ai_profiling',
                'email': user.email,
                'message': 'Complete your AI profiling to get matched with the right track'
            }, status=status.HTTP_200_OK)
    
    # Signup page flow (after account creation)
    if not email_verified:
        return Response({
            'onboarding_complete': False,
            'next_step': 'verify_email',
            'email': user.email,
            'message': 'Please verify your email address'
        }, status=status.HTTP_200_OK)
    elif not account_active:
        return Response({
            'onboarding_complete': False,
            'next_step': 'activate_account',
            'email': user.email,
            'message': 'Please activate your account'
        }, status=status.HTTP_200_OK)
    elif not has_mfa:
        return Response({
            'onboarding_complete': False,
            'next_step': 'setup_mfa',
            'email': user.email,
            'message': 'Please set up multi-factor authentication'
        }, status=status.HTTP_200_OK)
    elif not profiling_complete:
        return Response({
            'onboarding_complete': False,
            'next_step': 'ai_profiling',
            'email': user.email,
            'message': 'Complete your AI profiling to get matched with the right track'
        }, status=status.HTTP_200_OK)
    
    return Response({
        'onboarding_complete': True,
        'message': 'Onboarding complete!',
        'redirect_url': '/dashboard'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_onboarding_step(request):
    """
    POST /api/v1/auth/onboarding/complete-step
    Mark a specific onboarding step as complete.
    """
    user = request.user
    step = request.data.get('step')
    
    if step == 'ai_profiling':
        user.profiling_complete = True
        user.save()
        
        return Response({
            'success': True,
            'message': 'AI Profiling completed!',
            'onboarding_complete': True,
            'redirect_url': '/dashboard'
        }, status=status.HTTP_200_OK)
    
    return Response(
        {'detail': 'Invalid step'},
        status=status.HTTP_400_BAD_REQUEST
    )
