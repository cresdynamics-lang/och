"""
Tests for Programs app endpoints, including director dashboard.
"""
import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from programs.models import Program, Track, Cohort, Enrollment, MentorAssignment, CalendarEvent
from organizations.models import Organization

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


@pytest.fixture
def test_program(db, director_user):
    """Create a test program."""
    program = Program.objects.create(
        name='Cybersecurity Fundamentals',
        category='technical',
        description='Foundational cybersecurity program',
        duration_months=6,
        default_price=1000,
        currency='USD',
        status='active'
    )
    return program


@pytest.fixture
def test_track(db, test_program, director_user):
    """Create a test track."""
    track = Track.objects.create(
        program=test_program,
        name='Network Security',
        key='network_security',
        description='Network security specialization',
        director=director_user
    )
    return track


@pytest.fixture
def test_cohort(db, test_track):
    """Create a test cohort."""
    cohort = Cohort.objects.create(
        track=test_track,
        name='Cohort 2024-01',
        start_date=timezone.now().date(),
        end_date=(timezone.now() + timedelta(days=180)).date(),
        mode='virtual',
        seat_cap=20,
        mentor_ratio=0.1,
        status='active'
    )
    return cohort


@pytest.fixture
def test_enrollment(db, test_cohort):
    """Create a test enrollment."""
    student = User.objects.create_user(
        username='student@test.com',
        email='student@test.com',
        password='testpass123',
        first_name='Student',
        last_name='User',
        is_active=True
    )
    enrollment = Enrollment.objects.create(
        user=student,
        cohort=test_cohort,
        enrollment_type='self',
        seat_type='paid',
        status='active',
        payment_status='paid'
    )
    return enrollment


@pytest.fixture
def test_mentor_assignment(db, test_cohort):
    """Create a test mentor assignment."""
    mentor = User.objects.create_user(
        username='mentor@test.com',
        email='mentor@test.com',
        password='testpass123',
        first_name='Mentor',
        last_name='User',
        is_active=True
    )
    assignment = MentorAssignment.objects.create(
        cohort=test_cohort,
        mentor=mentor,
        role='primary',
        active=True
    )
    return assignment


@pytest.fixture
def test_calendar_event(db, test_cohort):
    """Create a test calendar event."""
    event = CalendarEvent.objects.create(
        cohort=test_cohort,
        type='orientation',
        title='Cohort Orientation',
        description='Welcome session for new cohort',
        start_ts=timezone.now() + timedelta(days=7),
        end_ts=timezone.now() + timedelta(days=7, hours=2),
        location='Virtual',
        link='https://zoom.us/meeting',
        status='scheduled'
    )
    return event


@pytest.mark.django_db
class TestDirectorDashboard:
    """Tests for director dashboard endpoint."""

    def test_director_dashboard_requires_authentication(self, api_client):
        """Test that director dashboard requires authentication."""
        response = api_client.get('/api/v1/programs/director/dashboard/')
        assert response.status_code == 401

    def test_director_dashboard_returns_data(self, director_client, test_program, test_track, test_cohort):
        """Test that director dashboard returns expected data structure."""
        response = director_client.get('/api/v1/programs/director/dashboard/')
        
        assert response.status_code == 200
        data = response.json()
        
        # Check hero metrics
        assert 'hero_metrics' in data
        assert 'active_programs' in data['hero_metrics']
        assert 'active_cohorts' in data['hero_metrics']
        assert 'seats_used' in data['hero_metrics']
        assert 'seats_available' in data['hero_metrics']
        assert 'seat_utilization' in data['hero_metrics']
        assert 'avg_readiness' in data['hero_metrics']
        assert 'avg_completion_rate' in data['hero_metrics']
        assert 'revenue_per_seat' in data['hero_metrics']
        
        # Check alerts
        assert 'alerts' in data
        assert isinstance(data['alerts'], list)
        
        # Check cohort table
        assert 'cohort_table' in data
        assert isinstance(data['cohort_table'], list)
        
        # Check programs
        assert 'programs' in data
        assert isinstance(data['programs'], list)

    def test_director_dashboard_shows_only_their_programs(self, director_client, test_program, test_track, test_cohort, admin_user):
        """Test that director only sees programs they direct."""
        # Create another program with different director
        other_director = User.objects.create_user(
            username='other@test.com',
            email='other@test.com',
            password='testpass123',
            first_name='Other',
            last_name='Director',
            is_active=True
        )
        other_program = Program.objects.create(
            name='Other Program',
            category='technical',
            description='Another program',
            duration_months=3,
            default_price=500,
            currency='USD',
            status='active'
        )
        other_track = Track.objects.create(
            program=other_program,
            name='Other Track',
            key='other_track',
            description='Other track',
            director=other_director
        )
        
        response = director_client.get('/api/v1/programs/director/dashboard/')
        assert response.status_code == 200
        data = response.json()
        
        # Should only see their own program
        program_names = [p['name'] for p in data['programs']]
        assert 'Cybersecurity Fundamentals' in program_names
        assert 'Other Program' not in program_names

    def test_director_dashboard_includes_cohort_alerts(self, director_client, test_cohort, test_enrollment):
        """Test that dashboard includes alerts for cohorts at risk."""
        # With enrollment, cohort should be under-filled (1/20 = 5% < 60%)
        response = director_client.get('/api/v1/programs/director/dashboard/')
        assert response.status_code == 200
        data = response.json()
        
        # Should have alerts for under-filled cohort
        alerts = data['alerts']
        underfilled_alerts = [a for a in alerts if a['type'] == 'underfilled_cohort']
        assert len(underfilled_alerts) > 0

    def test_director_dashboard_cohort_table_includes_milestones(self, director_client, test_cohort, test_calendar_event):
        """Test that cohort table includes upcoming milestones."""
        response = director_client.get('/api/v1/programs/director/dashboard/')
        assert response.status_code == 200
        data = response.json()
        
        cohort_data = data['cohort_table'][0]
        assert 'upcoming_milestones' in cohort_data
        assert len(cohort_data['upcoming_milestones']) > 0
        assert cohort_data['upcoming_milestones'][0]['title'] == 'Cohort Orientation'

    def test_director_dashboard_calculates_seat_utilization(self, director_client, test_cohort, test_enrollment):
        """Test that dashboard calculates seat utilization correctly."""
        response = director_client.get('/api/v1/programs/director/dashboard/')
        assert response.status_code == 200
        data = response.json()
        
        hero_metrics = data['hero_metrics']
        assert hero_metrics['seats_used'] == 1
        assert hero_metrics['seats_available'] == 20
        assert hero_metrics['seat_utilization'] == 5.0  # 1/20 * 100

    def test_admin_can_see_all_programs(self, admin_client, test_program, director_user):
        """Test that admin users can see all programs."""
        # Create another program
        other_program = Program.objects.create(
            name='Admin Program',
            category='technical',
            description='Admin program',
            duration_months=3,
            default_price=500,
            currency='USD',
            status='active'
        )
        
        response = admin_client.get('/api/v1/programs/director/dashboard/')
        assert response.status_code == 200
        data = response.json()
        
        program_names = [p['name'] for p in data['programs']]
        assert 'Cybersecurity Fundamentals' in program_names
        assert 'Admin Program' in program_names


@pytest.mark.django_db
class TestCohortEndpoints:
    """Tests for cohort-related endpoints."""

    def test_get_cohort_dashboard(self, director_client, test_cohort, test_enrollment, test_mentor_assignment):
        """Test getting cohort dashboard data."""
        response = director_client.get(f'/api/v1/cohorts/{test_cohort.id}/dashboard/')
        
        assert response.status_code == 200
        data = response.json()
        
        assert data['cohort_id'] == str(test_cohort.id)
        assert data['cohort_name'] == test_cohort.name
        assert data['enrollments_count'] == 1
        assert data['mentor_assignments_count'] == 1
        assert 'readiness_delta' in data
        assert 'completion_percentage' in data
        assert 'payments_complete' in data
        assert 'payments_pending' in data

    def test_get_cohort_enrollments(self, director_client, test_cohort, test_enrollment):
        """Test getting cohort enrollments."""
        response = director_client.get(f'/api/v1/cohorts/{test_cohort.id}/enrollments/')
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]['user_email'] == test_enrollment.user.email

    def test_get_cohort_mentors(self, director_client, test_cohort, test_mentor_assignment):
        """Test getting cohort mentor assignments."""
        response = director_client.get(f'/api/v1/cohorts/{test_cohort.id}/mentors/')
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]['mentor_email'] == test_mentor_assignment.mentor.email
        assert data[0]['role'] == 'primary'

    def test_get_cohort_calendar(self, director_client, test_cohort, test_calendar_event):
        """Test getting cohort calendar events."""
        response = director_client.get(f'/api/v1/cohorts/{test_cohort.id}/calendar/')
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]['title'] == 'Cohort Orientation'

    def test_export_cohort_report_json(self, director_client, test_cohort, test_enrollment):
        """Test exporting cohort report as JSON."""
        response = director_client.get(f'/api/v1/cohorts/{test_cohort.id}/export/?format=json')
        
        assert response.status_code == 200
        data = response.json()
        assert data['cohort_id'] == str(test_cohort.id)
        assert data['cohort_name'] == test_cohort.name
        assert 'enrollments' in data
        assert len(data['enrollments']) == 1

    def test_export_cohort_report_csv(self, director_client, test_cohort, test_enrollment):
        """Test exporting cohort report as CSV."""
        response = director_client.get(f'/api/v1/cohorts/{test_cohort.id}/export/?format=csv')
        
        assert response.status_code == 200
        assert response['Content-Type'] == 'text/csv; charset=utf-8'
        assert 'cohort_' in response['Content-Disposition']


@pytest.mark.django_db
class TestProgramEndpoints:
    """Tests for program endpoints."""

    def test_list_programs(self, director_client, test_program):
        """Test listing programs."""
        response = director_client.get('/api/v1/programs/')
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]['name'] == 'Cybersecurity Fundamentals'

    def test_get_program_detail(self, director_client, test_program):
        """Test getting program details."""
        response = director_client.get(f'/api/v1/programs/{test_program.id}/')
        
        assert response.status_code == 200
        data = response.json()
        assert data['name'] == 'Cybersecurity Fundamentals'
        assert data['category'] == 'technical'

    def test_create_program(self, director_client):
        """Test creating a new program."""
        program_data = {
            'name': 'New Program',
            'category': 'technical',
            'description': 'A new program',
            'duration_months': 6,
            'default_price': 1000,
            'currency': 'USD',
            'status': 'active'
        }
        response = director_client.post('/api/v1/programs/', program_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data['name'] == 'New Program'
        assert Program.objects.filter(name='New Program').exists()


@pytest.mark.django_db
class TestTrackEndpoints:
    """Tests for track endpoints."""

    def test_list_tracks(self, director_client, test_track):
        """Test listing tracks."""
        response = director_client.get('/api/v1/tracks/')
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]['name'] == 'Network Security'

    def test_get_track_detail(self, director_client, test_track):
        """Test getting track details."""
        response = director_client.get(f'/api/v1/tracks/{test_track.id}/')
        
        assert response.status_code == 200
        data = response.json()
        assert data['name'] == 'Network Security'
        assert data['key'] == 'network_security'

    def test_create_track(self, director_client, test_program, director_user):
        """Test creating a new track."""
        track_data = {
            'program': str(test_program.id),
            'name': 'New Track',
            'key': 'new_track',
            'description': 'A new track',
            'director': str(director_user.id)
        }
        response = director_client.post('/api/v1/tracks/', track_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data['name'] == 'New Track'
        assert Track.objects.filter(name='New Track').exists()


@pytest.mark.django_db
class TestCohortManagement:
    """Tests for cohort management endpoints."""

    def test_list_cohorts(self, director_client, test_cohort):
        """Test listing cohorts."""
        response = director_client.get('/api/v1/cohorts/')
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]['name'] == 'Cohort 2024-01'

    def test_create_cohort(self, director_client, test_track):
        """Test creating a new cohort."""
        cohort_data = {
            'track': str(test_track.id),
            'name': 'New Cohort',
            'start_date': timezone.now().date().isoformat(),
            'end_date': (timezone.now() + timedelta(days=180)).date().isoformat(),
            'mode': 'virtual',
            'seat_cap': 25,
            'mentor_ratio': 0.1,
            'status': 'draft'
        }
        response = director_client.post('/api/v1/cohorts/', cohort_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data['name'] == 'New Cohort'
        assert Cohort.objects.filter(name='New Cohort').exists()

    def test_filter_cohorts_by_status(self, director_client, test_cohort):
        """Test filtering cohorts by status."""
        # Create another cohort with different status
        Cohort.objects.create(
            track=test_cohort.track,
            name='Closed Cohort',
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=180)).date(),
            mode='virtual',
            seat_cap=20,
            mentor_ratio=0.1,
            status='closed'
        )
        
        response = director_client.get('/api/v1/cohorts/?status=active')
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]['status'] == 'active'

