"""
Integration tests for Programs, Tracks, and Cohorts CRUD operations.
Tests that frontend operations properly sync with backend database.
"""
import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from programs.models import Program, Track, Cohort, Enrollment

User = get_user_model()


@pytest.fixture
def director_user(db):
    """Create a director user."""
    user = User.objects.create_user(
        username='director@test.com',
        email='director@test.com',
        password='testpass123',
        first_name='Director',
        last_name='User',
        is_active=True
    )
    return user


@pytest.fixture
def director_client(api_client, director_user):
    """API client authenticated as director."""
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(director_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.mark.django_db
class TestProgramCRUD:
    """Test Program CRUD operations."""

    def test_create_program(self, director_client):
        """Test creating a program."""
        data = {
            'name': 'Test Program',
            'category': 'technical',
            'description': 'A test program',
            'duration_months': 6,
            'default_price': 1000.00,
            'currency': 'USD',
            'status': 'active'
        }
        response = director_client.post('/api/v1/programs/', data)
        
        assert response.status_code == 201
        result = response.json()
        assert result['name'] == 'Test Program'
        assert Program.objects.filter(name='Test Program').exists()

    def test_read_program(self, director_client):
        """Test reading a program."""
        program = Program.objects.create(
            name='Read Test Program',
            category='technical',
            description='Test',
            duration_months=6,
            default_price=1000,
            currency='USD',
            status='active'
        )
        
        response = director_client.get(f'/api/v1/programs/{program.id}/')
        assert response.status_code == 200
        result = response.json()
        assert result['name'] == 'Read Test Program'

    def test_update_program(self, director_client):
        """Test updating a program."""
        program = Program.objects.create(
            name='Update Test Program',
            category='technical',
            description='Test',
            duration_months=6,
            default_price=1000,
            currency='USD',
            status='active'
        )
        
        # Use PATCH for partial updates (PUT requires all fields)
        data = {'name': 'Updated Program Name'}
        response = director_client.patch(f'/api/v1/programs/{program.id}/', data)
        
        assert response.status_code == 200
        result = response.json()
        assert result['name'] == 'Updated Program Name'
        program.refresh_from_db()
        assert program.name == 'Updated Program Name'

    def test_delete_program(self, director_client):
        """Test deleting a program."""
        program = Program.objects.create(
            name='Delete Test Program',
            category='technical',
            description='Test',
            duration_months=6,
            default_price=1000,
            currency='USD',
            status='active'
        )
        program_id = str(program.id)
        
        response = director_client.delete(f'/api/v1/programs/{program.id}/')
        assert response.status_code == 204
        
        assert not Program.objects.filter(id=program_id).exists()

    def test_list_programs(self, director_client):
        """Test listing programs."""
        Program.objects.create(
            name='List Test Program 1',
            category='technical',
            description='Test',
            duration_months=6,
            default_price=1000,
            currency='USD',
            status='active'
        )
        Program.objects.create(
            name='List Test Program 2',
            category='leadership',
            description='Test',
            duration_months=3,
            default_price=500,
            currency='USD',
            status='active'
        )
        
        response = director_client.get('/api/v1/programs/')
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or (isinstance(data, dict) and 'results' in data)
        
        if isinstance(data, dict):
            results = data['results']
        else:
            results = data
        
        assert len(results) >= 2


@pytest.mark.django_db
class TestTrackCRUD:
    """Test Track CRUD operations."""

    def test_create_track(self, director_client, director_user):
        """Test creating a track."""
        program = Program.objects.create(
            name='Track Test Program',
            category='technical',
            description='Test',
            duration_months=6,
            default_price=1000,
            currency='USD',
            status='active'
        )
        
        data = {
            'program': str(program.id),
            'name': 'Test Track',
            'key': 'test_track',
            'description': 'A test track',
            'director': str(director_user.id)
        }
        response = director_client.post('/api/v1/tracks/', data)
        
        assert response.status_code == 201
        result = response.json()
        assert result['name'] == 'Test Track'
        assert Track.objects.filter(name='Test Track').exists()

    def test_read_track(self, director_client):
        """Test reading a track."""
        program = Program.objects.create(
            name='Read Track Program',
            category='technical',
            description='Test',
            duration_months=6,
            default_price=1000,
            currency='USD',
            status='active'
        )
        track = Track.objects.create(
            program=program,
            name='Read Test Track',
            key='read_test_track',
            description='Test'
        )
        
        response = director_client.get(f'/api/v1/tracks/{track.id}/')
        assert response.status_code == 200
        result = response.json()
        assert result['name'] == 'Read Test Track'

    def test_update_track(self, director_client):
        """Test updating a track."""
        program = Program.objects.create(
            name='Update Track Program',
            category='technical',
            description='Test',
            duration_months=6,
            default_price=1000,
            currency='USD',
            status='active'
        )
        track = Track.objects.create(
            program=program,
            name='Update Test Track',
            key='update_test_track',
            description='Test'
        )
        
        data = {'name': 'Updated Track Name'}
        response = director_client.put(f'/api/v1/tracks/{track.id}/', data)
        
        assert response.status_code == 200
        result = response.json()
        assert result['name'] == 'Updated Track Name'
        track.refresh_from_db()
        assert track.name == 'Updated Track Name'

    def test_delete_track(self, director_client):
        """Test deleting a track."""
        program = Program.objects.create(
            name='Delete Track Program',
            category='technical',
            description='Test',
            duration_months=6,
            default_price=1000,
            currency='USD',
            status='active'
        )
        track = Track.objects.create(
            program=program,
            name='Delete Test Track',
            key='delete_test_track',
            description='Test'
        )
        track_id = str(track.id)
        
        response = director_client.delete(f'/api/v1/tracks/{track.id}/')
        assert response.status_code == 204
        
        assert not Track.objects.filter(id=track_id).exists()

    def test_list_tracks(self, director_client):
        """Test listing tracks."""
        program = Program.objects.create(
            name='List Track Program',
            category='technical',
            description='Test',
            duration_months=6,
            default_price=1000,
            currency='USD',
            status='active'
        )
        Track.objects.create(
            program=program,
            name='List Test Track 1',
            key='list_test_track_1',
            description='Test'
        )
        Track.objects.create(
            program=program,
            name='List Test Track 2',
            key='list_test_track_2',
            description='Test'
        )
        
        response = director_client.get('/api/v1/tracks/')
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or (isinstance(data, dict) and 'results' in data)


@pytest.mark.django_db
class TestCohortCRUD:
    """Test Cohort CRUD operations."""

    def test_create_cohort(self, director_client):
        """Test creating a cohort."""
        program = Program.objects.create(
            name='Cohort Test Program',
            category='technical',
            description='Test',
            duration_months=6,
            default_price=1000,
            currency='USD',
            status='active'
        )
        track = Track.objects.create(
            program=program,
            name='Cohort Test Track',
            key='cohort_test_track',
            description='Test'
        )
        
        data = {
            'track': str(track.id),
            'name': 'Test Cohort',
            'start_date': timezone.now().date().isoformat(),
            'end_date': (timezone.now() + timedelta(days=180)).date().isoformat(),
            'mode': 'virtual',
            'seat_cap': 20,
            'mentor_ratio': 0.1,
            'status': 'draft'
        }
        response = director_client.post('/api/v1/cohorts/', data)
        
        assert response.status_code == 201
        result = response.json()
        assert result['name'] == 'Test Cohort'
        assert Cohort.objects.filter(name='Test Cohort').exists()

    def test_read_cohort(self, director_client):
        """Test reading a cohort."""
        program = Program.objects.create(
            name='Read Cohort Program',
            category='technical',
            description='Test',
            duration_months=6,
            default_price=1000,
            currency='USD',
            status='active'
        )
        track = Track.objects.create(
            program=program,
            name='Read Cohort Track',
            key='read_cohort_track',
            description='Test'
        )
        cohort = Cohort.objects.create(
            track=track,
            name='Read Test Cohort',
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=180)).date(),
            mode='virtual',
            seat_cap=20,
            mentor_ratio=0.1,
            status='active'
        )
        
        response = director_client.get(f'/api/v1/cohorts/{cohort.id}/')
        assert response.status_code == 200
        result = response.json()
        assert result['name'] == 'Read Test Cohort'

    def test_update_cohort(self, director_client):
        """Test updating a cohort."""
        program = Program.objects.create(
            name='Update Cohort Program',
            category='technical',
            description='Test',
            duration_months=6,
            default_price=1000,
            currency='USD',
            status='active'
        )
        track = Track.objects.create(
            program=program,
            name='Update Cohort Track',
            key='update_cohort_track',
            description='Test'
        )
        cohort = Cohort.objects.create(
            track=track,
            name='Update Test Cohort',
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=180)).date(),
            mode='virtual',
            seat_cap=20,
            mentor_ratio=0.1,
            status='active'
        )
        
        data = {'name': 'Updated Cohort Name', 'seat_cap': 25}
        response = director_client.put(f'/api/v1/cohorts/{cohort.id}/', data)
        
        assert response.status_code == 200
        result = response.json()
        assert result['name'] == 'Updated Cohort Name'
        assert result['seat_cap'] == 25
        cohort.refresh_from_db()
        assert cohort.name == 'Updated Cohort Name'
        assert cohort.seat_cap == 25

    def test_delete_cohort(self, director_client):
        """Test deleting a cohort."""
        program = Program.objects.create(
            name='Delete Cohort Program',
            category='technical',
            description='Test',
            duration_months=6,
            default_price=1000,
            currency='USD',
            status='active'
        )
        track = Track.objects.create(
            program=program,
            name='Delete Cohort Track',
            key='delete_cohort_track',
            description='Test'
        )
        cohort = Cohort.objects.create(
            track=track,
            name='Delete Test Cohort',
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=180)).date(),
            mode='virtual',
            seat_cap=20,
            mentor_ratio=0.1,
            status='draft'
        )
        cohort_id = str(cohort.id)
        
        response = director_client.delete(f'/api/v1/cohorts/{cohort.id}/')
        assert response.status_code == 204
        
        assert not Cohort.objects.filter(id=cohort_id).exists()

    def test_list_cohorts(self, director_client):
        """Test listing cohorts."""
        program = Program.objects.create(
            name='List Cohort Program',
            category='technical',
            description='Test',
            duration_months=6,
            default_price=1000,
            currency='USD',
            status='active'
        )
        track = Track.objects.create(
            program=program,
            name='List Cohort Track',
            key='list_cohort_track',
            description='Test'
        )
        Cohort.objects.create(
            track=track,
            name='List Test Cohort 1',
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=180)).date(),
            mode='virtual',
            seat_cap=20,
            mentor_ratio=0.1,
            status='active'
        )
        Cohort.objects.create(
            track=track,
            name='List Test Cohort 2',
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=180)).date(),
            mode='virtual',
            seat_cap=25,
            mentor_ratio=0.1,
            status='draft'
        )
        
        response = director_client.get('/api/v1/cohorts/')
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or (isinstance(data, dict) and 'results' in data)


@pytest.mark.django_db
class TestCascadeBehavior:
    """Test cascade behavior when deleting parent objects."""

    def test_delete_program_with_tracks(self, director_client):
        """Test that deleting a program with tracks fails or cascades appropriately."""
        program = Program.objects.create(
            name='Cascade Test Program',
            category='technical',
            description='Test',
            duration_months=6,
            default_price=1000,
            currency='USD',
            status='active'
        )
        track = Track.objects.create(
            program=program,
            name='Cascade Test Track',
            key='cascade_test_track',
            description='Test'
        )
        
        # Django CASCADE should delete tracks when program is deleted
        response = director_client.delete(f'/api/v1/programs/{program.id}/')
        assert response.status_code == 204
        
        # Track should be deleted due to CASCADE
        assert not Track.objects.filter(id=track.id).exists()

    def test_delete_track_with_cohorts(self, director_client):
        """Test that deleting a track with cohorts fails or cascades appropriately."""
        program = Program.objects.create(
            name='Cascade Track Program',
            category='technical',
            description='Test',
            duration_months=6,
            default_price=1000,
            currency='USD',
            status='active'
        )
        track = Track.objects.create(
            program=program,
            name='Cascade Track',
            key='cascade_track',
            description='Test'
        )
        cohort = Cohort.objects.create(
            track=track,
            name='Cascade Test Cohort',
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=180)).date(),
            mode='virtual',
            seat_cap=20,
            mentor_ratio=0.1,
            status='draft'
        )
        
        # Django CASCADE should delete cohorts when track is deleted
        response = director_client.delete(f'/api/v1/tracks/{track.id}/')
        assert response.status_code == 204
        
        # Cohort should be deleted due to CASCADE
        assert not Cohort.objects.filter(id=cohort.id).exists()

