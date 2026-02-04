"""
Seed test data for mentor testing.
Run: python seed_mentor_test_data.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from users.models import User, Role, UserRole
from mentorship_coordination.models import (
    MenteeMentorAssignment, MentorSession, MentorWorkQueue,
    MentorFlag, SessionAttendance
)
from missions.models import Mission, MissionSubmission
from django.utils import timezone
from datetime import timedelta
import uuid

print('=== Creating Test Users ===')

# Create students
students_data = [
    {'email': 'alice@student.com', 'username': 'alice', 'first_name': 'Alice', 'last_name': 'Johnson'},
    {'email': 'bob@student.com', 'username': 'bob', 'first_name': 'Bob', 'last_name': 'Smith'},
    {'email': 'charlie@student.com', 'username': 'charlie', 'first_name': 'Charlie', 'last_name': 'Davis'},
]

student_role = Role.objects.get(name='student')
students = []

for student_data in students_data:
    user, created = User.objects.get_or_create(
        email=student_data['email'],
        defaults={**student_data, 'is_active': True, 'email_verified': True, 'account_status': 'active'}
    )
    if created:
        user.set_password('student123')
        user.save()
        UserRole.objects.get_or_create(
            user=user,
            role=student_role,
            defaults={'scope': 'global', 'is_active': True}
        )
        print(f'[OK] Created: {user.email}')
    else:
        print(f'[SKIP] Already exists: {user.email}')
    students.append(user)

print('\n=== Creating Mentor-Mentee Assignments ===')

mentor = User.objects.get(email='mentor@ongozacyberhub.com')
assignments = []

for student in students:
    assignment, created = MenteeMentorAssignment.objects.get_or_create(
        mentee=student,
        mentor=mentor,
        defaults={
            'cohort_id': 'cohort-2026-01',
            'status': 'active',
            'max_sessions': 12,
            'sessions_used': 0
        }
    )
    if created:
        print(f'[OK] Assigned {student.email} to {mentor.email}')
    else:
        print(f'[SKIP] Assignment exists: {student.email}')
    assignments.append(assignment)

print('\n=== Creating Sessions ===')

now = timezone.now()
alice, bob, charlie = students
assignment_alice = assignments[0]
assignment_bob = assignments[1]

# Session 1: Upcoming session (in 2 hours)
session1 = MentorSession.objects.create(
    assignment=assignment_alice,
    mentee=alice,
    mentor=mentor,
    title='Career Planning Discussion',
    type='one_on_one',
    start_time=now + timedelta(hours=2),
    end_time=now + timedelta(hours=3),
    zoom_url='https://zoom.us/j/123456789',
    notes='Discuss career goals and job search strategy'
)
print(f'[OK] Created upcoming session: {session1.title}')

# Session 2: Group session tomorrow
session2 = MentorSession.objects.create(
    assignment=assignment_bob,
    mentee=bob,
    mentor=mentor,
    title='Security Best Practices Workshop',
    type='group',
    start_time=now + timedelta(days=1, hours=14),
    end_time=now + timedelta(days=1, hours=16),
    zoom_url='https://zoom.us/j/987654321',
    notes='Group session on security fundamentals'
)
# Add attendees
for student in students:
    SessionAttendance.objects.get_or_create(
        session=session2,
        mentee=student,
        defaults={'attended': False}
    )
print(f'[OK] Created group session: {session2.title} with {len(students)} attendees')

# Session 3: Past completed session
session3 = MentorSession.objects.create(
    assignment=assignment_alice,
    mentee=alice,
    mentor=mentor,
    title='Resume Review',
    type='one_on_one',
    start_time=now - timedelta(days=2),
    end_time=now - timedelta(days=2, hours=-1),
    zoom_url='https://zoom.us/j/111222333',
    notes='Reviewed resume and provided feedback',
    attended=True,
    structured_notes={
        'key_takeaways': [
            'Updated resume format to highlight technical skills',
            'Added quantifiable achievements',
            'Improved action verbs'
        ],
        'action_items': [
            {'task': 'Update LinkedIn profile', 'assignee': 'Alice', 'due': '2026-02-05'},
            {'task': 'Apply to 5 companies', 'assignee': 'Alice', 'due': '2026-02-10'}
        ]
    }
)
print(f'[OK] Created past session: {session3.title}')

print('\n=== Creating Work Queue Items ===')

# Work item 1: Mission review (high priority, due soon)
work1 = MentorWorkQueue.objects.create(
    mentor=mentor,
    mentee=alice,
    type='mission_review',
    priority='high',
    title='Review SIEM Lab Submission',
    description='Alice submitted SIEM lab - needs review and feedback',
    reference_id=uuid.uuid4(),
    sla_hours=24,
    due_at=now + timedelta(hours=4),
    status='pending'
)
print(f'[OK] Created work item: {work1.title}')

# Work item 2: Goal feedback (normal priority)
work2 = MentorWorkQueue.objects.create(
    mentor=mentor,
    mentee=bob,
    type='goal_feedback',
    priority='normal',
    title='Review Q1 Career Goals',
    description='Bob needs feedback on career goals for Q1 2026',
    sla_hours=48,
    due_at=now + timedelta(days=1),
    status='pending'
)
print(f'[OK] Created work item: {work2.title}')

# Work item 3: Session notes (urgent, overdue)
work3 = MentorWorkQueue.objects.create(
    mentor=mentor,
    mentee=alice,
    type='session_notes',
    priority='urgent',
    title='Complete Session Notes - Resume Review',
    description='Add structured notes for completed resume review session',
    reference_id=session3.id,
    sla_hours=24,
    due_at=now - timedelta(hours=2),
    status='overdue'
)
print(f'[OK] Created overdue work item: {work3.title}')

print('\n=== Creating Risk Flags ===')

# Flag Charlie as at-risk
flag = MentorFlag.objects.create(
    mentor=mentor,
    mentee=charlie,
    reason='Student has missed 3 consecutive sessions and not responding to messages. Falling behind on curriculum.',
    severity='high',
    resolved=False,
    director_notified=True
)
print(f'[OK] Created risk flag for {charlie.email} - Severity: {flag.severity}')

print('\n=== Creating Mission Submission ===')

# Create test mission
mission, created = Mission.objects.get_or_create(
    code='SIEM-01',
    defaults={
        'title': 'SIEM Lab: Log Analysis',
        'description': 'Analyze security logs using SIEM tools',
        'track': 'defender',
        'tier': 'beginner',
        'difficulty': 'beginner',
        'type': 'lab',
        'estimated_duration_minutes': 120,
        'requires_mentor_review': True
    }
)
if created:
    print(f'[OK] Created mission: {mission.title}')
else:
    print(f'[SKIP] Mission exists: {mission.title}')

# Create submission for Alice
submission = MissionSubmission.objects.create(
    mission=mission,
    user=alice,
    status='submitted',
    notes='I completed the SIEM lab. Here are my findings:\n\n1. Identified 15 failed login attempts from IP 192.168.1.50\n2. Found suspicious outbound traffic to unknown IP 203.0.113.45\n3. Created detection rules for brute force attacks\n4. Documented all findings in attached GitHub repo',
    submitted_at=timezone.now()
)
print(f'[OK] Created mission submission')
print(f'    Mission: {mission.title}')
print(f'    Student: {alice.email}')
print(f'    Submission ID: {submission.id}')

print('\n' + '='*60)
print('=== MENTOR TEST DATA CREATED SUCCESSFULLY ===')
print('='*60)
print('\nLogin Credentials:')
print('-' * 60)
print('Mentor:')
print(f'  Email: mentor@ongozacyberhub.com')
print(f'  Password: mentor123')
print(f'  User ID: {mentor.id}')
print('\nStudents:')
print(f'  Alice: alice@student.com / student123 (ID: {alice.id})')
print(f'  Bob: bob@student.com / student123 (ID: {bob.id})')
print(f'  Charlie: charlie@student.com / student123 (ID: {charlie.id})')

print('\n' + '='*60)
print('Summary:')
print('-' * 60)
print(f'  Assignments: {MenteeMentorAssignment.objects.filter(mentor=mentor).count()}')
print(f'  Sessions: {MentorSession.objects.filter(mentor=mentor).count()}')
print(f'  Work Items: {MentorWorkQueue.objects.filter(mentor=mentor).count()}')
print(f'  Risk Flags: {MentorFlag.objects.filter(mentor=mentor).count()}')
print(f'  Submissions: 1')

print('\n' + '='*60)
print('Test API Endpoints:')
print('-' * 60)
print('\n1. Login as Mentor:')
print('   curl -X POST http://localhost:8000/api/v1/auth/login \\')
print('     -H "Content-Type: application/json" \\')
print('     -d \'{"email":"mentor@ongozacyberhub.com","password":"mentor123"}\'')

print('\n2. View Dashboard (use token from step 1):')
print('   curl -X GET http://localhost:8000/api/v1/mentor/dashboard \\')
print('     -H "Authorization: Bearer YOUR_TOKEN"')

print('\n3. View Work Queue:')
print('   curl -X GET http://localhost:8000/api/v1/mentor/workqueue \\')
print('     -H "Authorization: Bearer YOUR_TOKEN"')

print(f'\n4. Review Mission Submission:')
print(f'   curl -X POST http://localhost:8000/api/v1/mentor/missions/{submission.id}/review \\')
print('     -H "Authorization: Bearer YOUR_TOKEN" \\')
print('     -H "Content-Type: application/json" \\')
print('     -d \'{"approved": true, "feedback": "Great work!"}\'')

print('\n' + '='*60)
print('Next Steps:')
print('-' * 60)
print('1. Start Django server: python manage.py runserver')
print('2. Test mentor login and dashboard')
print('3. See MENTOR_TESTING_GUIDE.md for detailed API tests')
print('='*60 + '\n')
