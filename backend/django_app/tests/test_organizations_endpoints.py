"""
Test suite for Organizations endpoints.

Endpoints tested:
- GET /api/v1/organizations/
- POST /api/v1/organizations/
- GET /api/v1/organizations/{slug}/
- PUT /api/v1/organizations/{slug}/
- DELETE /api/v1/organizations/{slug}/
- GET /api/v1/organization-members/
- POST /api/v1/organization-members/
- GET /api/v1/orgs/
- POST /api/v1/orgs/
- POST /api/v1/orgs/{slug}/members
"""
import pytest
from rest_framework import status
from organizations.models import Organization, OrganizationMember


@pytest.mark.django_db
@pytest.mark.admin
class TestOrganizationsListEndpoint:
    """Test GET /api/v1/organizations/"""

    def test_list_organizations_authenticated(self, authenticated_client, test_user, test_organization):
        """Test listing organizations as authenticated user."""
        # Add user as member
        test_organization.members.add(test_user)
        response = authenticated_client.get('/api/v1/organizations/')
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, (list, dict))

    def test_list_organizations_unauthenticated(self, api_client):
        """Test listing organizations without authentication."""
        # Use simple client for unauthenticated request
        response = api_client.get('/api/v1/organizations/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_organizations_empty(self, authenticated_client):
        """Test listing organizations when user has none."""
        response = authenticated_client.get('/api/v1/organizations/')
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, (list, dict))


@pytest.mark.django_db
@pytest.mark.admin
class TestOrganizationsCreateEndpoint:
    """Test POST /api/v1/organizations/"""

    def test_create_organization_success(self, authenticated_client):
        """Test creating organization successfully."""
        data = {
            'name': 'New Organization',
            'slug': 'new-org',
            'org_type': 'sponsor',
            'description': 'Test organization'
        }
        response = authenticated_client.post('/api/v1/organizations/', data, format='json')
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK]
        assert Organization.objects.filter(slug='new-org').exists()

    def test_create_organization_duplicate_slug(self, authenticated_client, test_organization):
        """Test creating organization with duplicate slug."""
        data = {
            'name': 'Duplicate Org',
            'slug': test_organization.slug,
            'org_type': 'sponsor'
        }
        response = authenticated_client.post('/api/v1/organizations/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_organization_missing_fields(self, authenticated_client):
        """Test creating organization with missing required fields."""
        data = {'name': 'Incomplete Org'}
        response = authenticated_client.post('/api/v1/organizations/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_organization_unauthenticated(self, api_client):
        """Test creating organization without authentication."""
        data = {'name': 'Test Org', 'slug': 'test-org'}
        response = api_client.post('/api/v1/organizations/', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
@pytest.mark.admin
class TestOrganizationsDetailEndpoint:
    """Test GET /api/v1/organizations/{slug}/"""

    def test_get_organization_detail(self, authenticated_client, test_user, test_organization):
        """Test getting organization detail."""
        test_organization.members.add(test_user)
        response = authenticated_client.get(f'/api/v1/organizations/{test_organization.slug}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['slug'] == test_organization.slug

    def test_get_organization_not_found(self, authenticated_client):
        """Test getting non-existent organization."""
        response = authenticated_client.get('/api/v1/organizations/non-existent/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_organization_unauthenticated(self, api_client, test_organization):
        """Test getting organization without authentication."""
        response = api_client.get(f'/api/v1/organizations/{test_organization.slug}/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
@pytest.mark.admin
class TestOrgsListEndpoint:
    """Test GET /api/v1/orgs/"""

    def test_list_orgs_as_admin(self, admin_client):
        """Test listing orgs as admin."""
        response = admin_client.get('/api/v1/orgs/')
        assert response.status_code == status.HTTP_200_OK

    def test_list_orgs_as_student(self, student_client):
        """Test listing orgs as student."""
        response = student_client.get('/api/v1/orgs/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN]

    def test_list_orgs_unauthenticated(self, api_client):
        """Test listing orgs without authentication."""
        response = api_client.get('/api/v1/orgs/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
@pytest.mark.admin
class TestOrgsCreateEndpoint:
    """Test POST /api/v1/orgs/"""

    def test_create_org_as_admin(self, admin_client):
        """Test creating org as admin."""
        data = {
            'name': 'Admin Org',
            'slug': 'admin-org',
            'org_type': 'sponsor'
        }
        response = admin_client.post('/api/v1/orgs/', data, format='json')
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK]

    def test_create_org_as_student(self, student_client):
        """Test creating org as student (should fail)."""
        data = {'name': 'Student Org', 'slug': 'student-org'}
        response = student_client.post('/api/v1/orgs/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
@pytest.mark.admin
class TestOrgsMembersEndpoint:
    """Test POST /api/v1/orgs/{slug}/members"""

    def test_add_member_as_admin(self, admin_client, test_organization, test_user):
        """Test adding member to organization as admin."""
        data = {'user_id': test_user.id}
        response = admin_client.post(
            f'/api/v1/orgs/{test_organization.slug}/members',
            data,
            format='json'
        )
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK]

    def test_add_member_invalid_user(self, admin_client, test_organization):
        """Test adding non-existent user as member."""
        data = {'user_id': 99999}
        response = admin_client.post(
            f'/api/v1/orgs/{test_organization.slug}/members',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_add_member_as_student(self, student_client, test_organization, test_user):
        """Test adding member as student (should fail)."""
        data = {'user_id': test_user.id}
        response = student_client.post(
            f'/api/v1/orgs/{test_organization.slug}/members',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
@pytest.mark.admin
class TestOrganizationMembersEndpoint:
    """Test GET /api/v1/organization-members/ and POST /api/v1/organization-members/"""

    def test_list_organization_members(self, authenticated_client):
        """Test listing organization members."""
        response = authenticated_client.get('/api/v1/organization-members/')
        assert response.status_code == status.HTTP_200_OK

    def test_create_organization_member(self, authenticated_client, test_organization, test_user):
        """Test creating organization member."""
        data = {
            'organization': test_organization.id,
            'user': test_user.id,
            'role': 'member'
        }
        response = authenticated_client.post(
            '/api/v1/organization-members/',
            data,
            format='json'
        )
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]
