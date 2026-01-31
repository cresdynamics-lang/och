"""
Setup complete mentor data: cohorts, assignments, missions, sessions, analytics
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from users.models import User, Role, UserRole
from programs.models import Program, Track, Cohort, MentorAssignment, Enrollment
from missions.models import Mission, MissionSubmission
from mentorship_coordination.models import MentorSession, MentorWorkQueue
from django.utils import timezone
from datetime import timedelta
import uuid

print('='*60)
print('SETTING UP MENTOR DATA')
print('='*60)

# 1. Fix admin role
print('\n[1/6] Fixing Admin Role...')
admin = User.objects.get(email='admin@ongozacyberhub.com')
admin_role = Role.objects.get(name='admin')
UserRole.objects.get_or_create(
    user=admin,
    role=admin_role,
    defaults={'scope': 'global', 'is_active': True}
)
print('  [OK] Admin role assigned')

# 2. Create Program and Tracks
print('\n[2/6] Creating Programs and Tracks...')
program, _ = Program.objects.get_or_create(
    name='Ongoza Cyber Hub',
    defaults={
        'category': 'technical',
        'description': 'Main OCH cybersecurity training program',
        'status': 'active',
        'duration_months': 6,
        'default_price': 0.00
    }
)
print(f'  [OK] Program: {program.name} (ID: {program.id})')

defender_track, _ = Track.objects.get_or_create(
    name='Cyber Defender Track',
    program=program,
    defaults={
        'key': 'defender',
        'description': 'Blue team cybersecurity track',
        'track_type': 'primary'
    }
)
print(f'  [OK] Track: {defender_track.name} (ID: {defender_track.id})')

# 3. Create Cohorts
print('\n[3/6] Creating Cohorts...')
now = timezone.now()
cohorts_data = [
    {
        'name': 'Cohort 2026-01 (January)',
        'start_date': now,
        'end_date': now + timedelta(days=90),
    },
    {
        'name': 'Cohort 2026-02 (February)',
        'start_date': now + timedelta(days=30),
        'end_date': now + timedelta(days=120),
    }
]

cohorts = []
for cohort_data in cohorts_data:
    cohort, created = Cohort.objects.get_or_create(
        name=cohort_data['name'],
        track=defender_track,
        defaults={
            'start_date': cohort_data['start_date'],
            'end_date': cohort_data['end_date'],
            'status': 'active',
            'mode': 'hybrid',
            'seat_cap': 30
        }
    )
    cohorts.append(cohort)
    print(f'  [OK] Cohort: {cohort.name} (ID: {cohort.id})')

# 4. Assign Mentor to Cohorts
print('\n[4/6] Assigning Mentor to Cohorts...')
mentor = User.objects.get(email='mentor@ongozacyberhub.com')

for cohort in cohorts:
    assignment, created = MentorAssignment.objects.get_or_create(
        mentor=mentor,
        cohort=cohort,
        defaults={
            'role': 'primary',
            'active': True
        }
    )
    status = 'Created' if created else 'Exists'
    print(f'  [{status}] Mentor assigned to {cohort.name}')

# 5. Create student enrollments
print('\n[5/6] Creating Student Enrollments...')
students = [
    User.objects.get(email='alice@student.com'),
    User.objects.get(email='bob@student.com'),
    User.objects.get(email='charlie@student.com'),
]

for student in students:
    for cohort in cohorts:
        enrollment, created = Enrollment.objects.get_or_create(
            user=student,
            cohort=cohort,
            defaults={
                'status': 'active',
                'payment_status': 'paid',
                'seat_type': 'paid',
                'enrollment_type': 'director'
            }
        )
        if created:
            print(f'  [OK] Enrolled {student.email} in {cohort.name}')

# 6. Create Missions for the Track
print('\n[6/6] Creating Missions...')
missions_data = [
    {
        'code': 'SIEM-01',
        'title': 'SIEM Lab: Log Analysis',
        'description': 'Analyze security logs using SIEM tools',
        'tier': 'beginner',
        'difficulty': 'beginner',
    },
    {
        'code': 'SIEM-02',
        'title': 'SIEM Lab: Threat Detection',
        'description': 'Detect threats using SIEM correlation rules',
        'tier': 'intermediate',
        'difficulty': 'intermediate',
    },
    {
        'code': 'IR-01',
        'title': 'Incident Response Fundamentals',
        'description': 'Learn incident response process and procedures',
        'tier': 'beginner',
        'difficulty': 'beginner',
    }
]

for mission_data in missions_data:
    mission, created = Mission.objects.get_or_create(
        code=mission_data['code'],
        defaults={
            'title': mission_data['title'],
            'description': mission_data['description'],
            'track': 'defender',
            'tier': mission_data['tier'],
            'difficulty': mission_data['difficulty'],
            'type': 'lab',
            'estimated_duration_minutes': 120,
            'requires_mentor_review': True
        }
    )
    if created:
        print(f'  [OK] Mission: {mission.title}')

# Create mission submission for Alice
alice = students[0]
siem_mission = Mission.objects.get(code='SIEM-01')
submission, created = MissionSubmission.objects.get_or_create(
    mission=siem_mission,
    user=alice,
    defaults={
        'status': 'submitted',
        'notes': 'Completed SIEM lab. Found suspicious activity and created detection rules.',
        'submitted_at': now
    }
)
if created:
    print(f'  [OK] Submission: {alice.email} -> {siem_mission.title}')

print('\n' + '='*60)
print('SETUP COMPLETE!')
print('='*60)
print(f'\nSummary:')
print(f'  Programs: {Program.objects.count()}')
print(f'  Tracks: {Track.objects.count()}')
print(f'  Cohorts: {Cohort.objects.count()}')
print(f'  Mentor Assignments: {MentorAssignment.objects.count()}')
print(f'  Student Enrollments: {Enrollment.objects.count()}')
print(f'  Missions: {Mission.objects.count()}')
print(f'  Submissions: {MissionSubmission.objects.count()}')

print('\n' + '='*60)
print('LOGIN CREDENTIALS:')
print('='*60)
print('Admin:  admin@ongozacyberhub.com / admin123')
print('Mentor: mentor@ongozacyberhub.com / mentor123')
print('Student: alice@student.com / student123')
print('='*60)
