# OCH Platform Endpoint Testing

This module contains comprehensive pytest tests for all API endpoints in the OCH platform.

## Quick Start

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_auth_endpoints.py

# Run with coverage
pytest --cov=. --cov-report=html

# Run tests by marker
pytest -m auth
pytest -m student
pytest -m admin
```

## Test Structure

- `conftest.py` - Shared fixtures and test configuration
- `test_auth_endpoints.py` - Authentication endpoints
- `test_student_dashboard_endpoints.py` - Student dashboard endpoints
- `test_coaching_endpoints.py` - Coaching OS endpoints
- `test_missions_endpoints.py` - Missions MXP endpoints
- `test_profiler_endpoints.py` - Profiler Engine endpoints
- `test_admin_endpoints.py` - Admin/management endpoints
- `test_health_endpoints.py` - Health check and metrics

## Test Coverage

All endpoints are tested for:
- Authentication and authorization
- Request/response validation
- Error handling (400, 401, 403, 404, 500)
- RBAC permissions
- Edge cases and invalid inputs

## Fixtures

See `conftest.py` for available fixtures:
- `api_client` - Unauthenticated client
- `authenticated_client` - Authenticated test user
- `admin_client` - Admin user client
- `student_client` - Student user client
- `mentor_client` - Mentor user client
- User fixtures: `test_user`, `admin_user`, `student_user`, `mentor_user`
- Role fixtures: `student_role`, `mentor_role`, `admin_role`
- `test_organization` - Test organization

## Adding New Tests

1. Create test file: `tests/test_<module>_endpoints.py`
2. Import fixtures from `conftest.py`
3. Use appropriate markers (`@pytest.mark.auth`, etc.)
4. Test authentication, authorization, validation, and edge cases

Example:
```python
@pytest.mark.django_db
@pytest.mark.newmodule
class TestNewEndpoint:
    def test_endpoint_success(self, authenticated_client):
        response = authenticated_client.get('/api/v1/new-endpoint')
        assert response.status_code == status.HTTP_200_OK
```

## CI/CD Integration

Tests run automatically in CI/CD pipeline. Ensure all tests pass before merging.









































