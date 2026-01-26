"""
Pytest configuration and shared fixtures for endpoint testing.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import Role, UserRole
from organizations.models import Organization

User = get_user_model()


@pytest.fixture
def api_client():
    """API client for making requests."""
    return APIClient()


@pytest.fixture
def test_user(db):
    """Create a test user."""
    user = User.objects.create_user(
        email='test@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User',
        is_active=True
    )
    return user


@pytest.fixture
def authenticated_client(api_client, test_user):
    """API client authenticated with test user."""
    refresh = RefreshToken.for_user(test_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def admin_user(db):
    """Create an admin user."""
    user = User.objects.create_user(
        username='admin@test.com',
        email='admin@test.com',
        password='testpass123',
        first_name='Admin',
        last_name='User',
        is_active=True,
        is_staff=True
    )
    return user


@pytest.fixture
def admin_client(api_client, admin_user):
    """API client authenticated as admin."""
    refresh = RefreshToken.for_user(admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def student_user(db):
    """Create a student user."""
    user = User.objects.create_user(
        email='student@test.com',
        password='testpass123',
        first_name='Student',
        last_name='User',
        is_active=True
    )
    return user


@pytest.fixture
def student_client(api_client, student_user):
    """API client authenticated as student."""
    refresh = RefreshToken.for_user(student_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def mentor_user(db):
    """Create a mentor user."""
    user = User.objects.create_user(
        email='mentor@test.com',
        password='testpass123',
        first_name='Mentor',
        last_name='User',
        is_active=True
    )
    return user


@pytest.fixture
def mentor_client(api_client, mentor_user):
    """API client authenticated as mentor."""
    refresh = RefreshToken.for_user(mentor_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def student_role(db):
    """Create student role."""
    role, _ = Role.objects.get_or_create(
        name='Student',
        defaults={'description': 'Student role'}
    )
    return role


@pytest.fixture
def mentor_role(db):
    """Create mentor role."""
    role, _ = Role.objects.get_or_create(
        name='Mentor',
        defaults={'description': 'Mentor role'}
    )
    return role


@pytest.fixture
def admin_role(db):
    """Create admin role."""
    role, _ = Role.objects.get_or_create(
        name='Admin',
        defaults={'description': 'Admin role'}
    )
    return role


@pytest.fixture
def student_with_role(db, student_user, student_role):
    """Student user with student role assigned."""
    UserRole.objects.create(
        user=student_user,
        role=student_role,
        scope='global'
    )
    return student_user


@pytest.fixture
def test_organization(db):
    """Create a test organization."""
    org = Organization.objects.create(
        name='Test Organization',
        slug='test-org',
        org_type='sponsor'
    )
    return org

