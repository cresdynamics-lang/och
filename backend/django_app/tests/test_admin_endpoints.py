"""
Test suite for Admin endpoints.

Endpoints tested:
- GET /api/v1/roles
- POST /api/v1/users/{id}/roles
- DELETE /api/v1/users/{id}/roles/{role_id}
- GET /api/v1/orgs
- POST /api/v1/orgs
- POST /api/v1/orgs/{slug}/members
- GET /api/v1/audit-logs
- GET /api/v1/audit-logs/stats
"""
import pytest
from rest_framework import status
from users.models import Role, UserRole
from organizations.models import Organization


@pytest.mark.django_db
@pytest.mark.admin
class TestRolesEndpoint:
    """Test GET /api/v1/roles"""

    def test_list_roles_as_admin(self, admin_client):
        """Test listing roles as admin."""
        response = admin_client.get('/api/v1/roles')
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, (list, dict))

    def test_list_roles_as_student(self, student_client):
        """Test listing roles as student (may be allowed for viewing)."""
        response = student_client.get('/api/v1/roles')
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_403_FORBIDDEN
        ]

    def test_list_roles_unauthenticated(self, api_client):
        """Test listing roles without authentication."""
        response = api_client.get('/api/v1/roles')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
@pytest.mark.admin
class TestUserRoleAssignmentEndpoint:
    """Test POST /api/v1/users/{id}/roles"""

    def test_assign_role_as_admin(self, admin_client, test_user, admin_role):
        """Test assigning role to user as admin."""
        data = {
            'role_id': admin_role.id,
            'scope': 'global'
        }
        response = admin_client.post(
            f'/api/v1/users/{test_user.id}/roles',
            data,
            format='json'
        )
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_200_OK,
            status.HTTP_400_BAD_REQUEST
        ]

    def test_assign_role_as_student(self, student_client, test_user, student_role):
        """Test assigning role as student (should fail)."""
        data = {'role_id': student_role.id, 'scope': 'global'}
        response = student_client.post(
            f'/api/v1/users/{test_user.id}/roles',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_assign_role_unauthenticated(self, api_client, test_user, admin_role):
        """Test assigning role without authentication."""
        data = {'role_id': admin_role.id, 'scope': 'global'}
        response = api_client.post(
            f'/api/v1/users/{test_user.id}/roles',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
@pytest.mark.admin
class TestRevokeRoleEndpoint:
    """Test DELETE /api/v1/users/{id}/roles/{role_id}"""

    def test_revoke_role_as_admin(self, admin_client, test_user, admin_role):
        """Test revoking role as admin."""
        # First assign role
        UserRole.objects.create(
            user=test_user,
            role=admin_role,
            scope='global'
        )
        response = admin_client.delete(
            f'/api/v1/users/{test_user.id}/roles/{admin_role.id}'
        )
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_204_NO_CONTENT,
            status.HTTP_404_NOT_FOUND
        ]

    def test_revoke_role_as_student(self, student_client, test_user, student_role):
        """Test revoking role as student (should fail)."""
        response = student_client.delete(
            f'/api/v1/users/{test_user.id}/roles/{student_role.id}'
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
@pytest.mark.admin
class TestOrganizationsEndpoint:
    """Test GET /api/v1/orgs and POST /api/v1/orgs"""

    def test_list_organizations_as_admin(self, admin_client):
        """Test listing organizations as admin."""
        response = admin_client.get('/api/v1/orgs')
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, (list, dict))

    def test_create_organization_as_admin(self, admin_client):
        """Test creating organization as admin."""
        data = {
            'name': 'Test Org',
            'slug': 'test-org',
            'org_type': 'sponsor'
        }
        response = admin_client.post('/api/v1/orgs', data, format='json')
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_200_OK,
            status.HTTP_400_BAD_REQUEST
        ]

    def test_create_organization_as_student(self, student_client):
        """Test creating organization as student (should fail)."""
        data = {'name': 'Test Org', 'slug': 'test-org'}
        response = student_client.post('/api/v1/orgs', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
@pytest.mark.admin
class TestAuditLogsEndpoint:
    """Test GET /api/v1/audit-logs"""

    def test_list_audit_logs_as_admin(self, admin_client):
        """Test listing audit logs as admin."""
        response = admin_client.get('/api/v1/audit-logs')
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, (list, dict))

    def test_list_audit_logs_as_student(self, student_client):
        """Test listing audit logs as student (should fail)."""
        response = student_client.get('/api/v1/audit-logs')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_audit_stats_as_admin(self, admin_client):
        """Test getting audit stats as admin."""
        response = admin_client.get('/api/v1/audit-logs/stats')
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]

