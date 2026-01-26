#!/usr/bin/env python
"""
Create test cohorts with 100 students across diverse tracks.
Creates 2 cohorts per track (10 cohorts total) with 10 students each.

Run: python create_test_cohorts_and_students.py
"""
import os
import sys
import django
from datetime import date, timedelta
import random

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from users.models import Role, UserRole
from programs.models import Program, Track, Cohort, Enrollment
from profiler.models import ProfilerSession
from django.db.models.signals import post_save
from community import signals

User = get_user_model()

# Disconnect problematic signal
post_save.disconnect(signals.auto_map_user_on_create, sender=User)

# Track definitions
TRACKS = {
    'defender': {
        'name': 'Defender Track',
        'key': 'defender',
        'description': 'Security Operations, Incident Response, and Defensive Cybersecurity'
    },
    'offensive': {
        'name': 'Offensive Security Track',
        'key': 'offensive',
        'description': 'Ethical Hacking, Penetration Testing, and Red Team Operations'
    },
    'grc': {
        'name': 'GRC Track',
        'key': 'grc',
        'description': 'Governance, Risk Management, and Compliance'
    },
    'leadership': {
        'name': 'Leadership Track',
        'key': 'leadership',
        'description': 'Cybersecurity Management, Strategy, and Executive Leadership'
    },
    'innovation': {
        'name': 'Innovation Track',
        'key': 'innovation',
        'description': 'Security Research, Development, and Innovation'
    }
}

# Default password for all test users
DEFAULT_PASSWORD = 'testpass123'

# Track distribution per cohort group
# Each cohort group will have students distributed across all 5 tracks
STUDENTS_PER_TRACK_PER_COHORT = 10  # 10 students per track per cohort group


@transaction.atomic
def create_test_program():
    """Create or get test program."""
    program, created = Program.objects.get_or_create(
        name='OCH Cybersecurity Program',
        defaults={
            'category': 'technical',
            'categories': ['technical', 'leadership', 'mentorship'],
            'description': 'Comprehensive cybersecurity training program with multiple tracks',
            'duration_months': 12,
            'default_price': 0.00,
            'currency': 'USD',
            'status': 'active'
        }
    )
    if created:
        print(f'✓ Created program: {program.name}')
    else:
        print(f'✓ Using existing program: {program.name}')
    return program


@transaction.atomic
def create_tracks(program):
    """Create or get all tracks."""
    tracks = {}
    for track_key, track_data in TRACKS.items():
        track, created = Track.objects.get_or_create(
            program=program,
            key=track_data['key'],
            defaults={
                'name': track_data['name'],
                'description': track_data['description'],
                'track_type': 'primary'
            }
        )
        if created:
            print(f'✓ Created track: {track.name}')
        else:
            print(f'✓ Using existing track: {track.name}')
        tracks[track_key] = track
    return tracks


@transaction.atomic
def create_cohorts(tracks, program_director):
    """Create 2 cohorts per track (10 cohorts total)."""
    cohorts = {}
    start_date = date.today() + timedelta(days=30)
    end_date = start_date + timedelta(days=365)
    
    for cohort_num in [1, 2]:
        for track_key, track in tracks.items():
            cohort_name = f'Test Cohort {chr(64 + cohort_num)} - {track.name}'
            cohort, created = Cohort.objects.get_or_create(
                track=track,
                name=cohort_name,
                defaults={
                    'start_date': start_date,
                    'end_date': end_date,
                    'mode': 'virtual',
                    'seat_cap': 100,  # Large enough for all students
                    'mentor_ratio': 0.1,
                    'coordinator': program_director,
                    'status': 'active',
                    'seat_pool': {
                        'paid': 50,
                        'scholarship': 30,
                        'sponsored': 20
                    }
                }
            )
            if created:
                print(f'✓ Created cohort: {cohort_name}')
            else:
                print(f'✓ Using existing cohort: {cohort_name}')
            
            cohort_key = f'{cohort_num}_{track_key}'
            cohorts[cohort_key] = cohort
    
    return cohorts


@transaction.atomic
def create_staff_users():
    """Create admin, program director, finance, and mentor users."""
    staff_users = {}
    
    # Admin
    admin, created = User.objects.get_or_create(
        email='admin@test.com',
        defaults={
            'username': 'admin',
            'first_name': 'Admin',
            'last_name': 'User',
            'is_staff': True,
            'is_superuser': True,
            'account_status': 'active',
            'email_verified': True,
            'is_active': True
        }
    )
    if not created:
        admin.account_status = 'active'
        admin.email_verified = True
        admin.is_active = True
        admin.save()
    admin.set_password(DEFAULT_PASSWORD)
    admin.save()
    
    role, _ = Role.objects.get_or_create(name='admin')
    UserRole.objects.get_or_create(
        user=admin,
        role=role,
        defaults={'scope': 'global', 'is_active': True}
    )
    staff_users['admin'] = admin
    print(f'✓ Created/updated admin: {admin.email}')
    
    # Program Director
    director, created = User.objects.get_or_create(
        email='director@test.com',
        defaults={
            'username': 'director',
            'first_name': 'Program',
            'last_name': 'Director',
            'account_status': 'active',
            'email_verified': True,
            'is_active': True
        }
    )
    if not created:
        director.account_status = 'active'
        director.email_verified = True
        director.is_active = True
        director.save()
    director.set_password(DEFAULT_PASSWORD)
    director.save()
    
    role, _ = Role.objects.get_or_create(name='program_director')
    UserRole.objects.get_or_create(
        user=director,
        role=role,
        defaults={'scope': 'global', 'is_active': True}
    )
    staff_users['director'] = director
    print(f'✓ Created/updated program director: {director.email}')
    
    # Finance
    finance, created = User.objects.get_or_create(
        email='finance@test.com',
        defaults={
            'username': 'finance',
            'first_name': 'Finance',
            'last_name': 'User',
            'account_status': 'active',
            'email_verified': True,
            'is_active': True
        }
    )
    if not created:
        finance.account_status = 'active'
        finance.email_verified = True
        finance.is_active = True
        finance.save()
    finance.set_password(DEFAULT_PASSWORD)
    finance.save()
    
    role, _ = Role.objects.get_or_create(name='finance')
    UserRole.objects.get_or_create(
        user=finance,
        role=role,
        defaults={'scope': 'global', 'is_active': True}
    )
    staff_users['finance'] = finance
    print(f'✓ Created/updated finance: {finance.email}')
    
    # Create 5 mentors (one per track)
    mentors = []
    for i, track_key in enumerate(TRACKS.keys(), 1):
        mentor, created = User.objects.get_or_create(
            email=f'mentor{i}@test.com',
            defaults={
                'username': f'mentor{i}',
                'first_name': f'Mentor',
                'last_name': f'{TRACKS[track_key]["name"].split()[0]}',
                'account_status': 'active',
                'email_verified': True,
                'is_active': True
            }
        )
        if not created:
            mentor.account_status = 'active'
            mentor.email_verified = True
            mentor.is_active = True
            mentor.save()
        mentor.set_password(DEFAULT_PASSWORD)
        mentor.save()
        
        role, _ = Role.objects.get_or_create(name='mentor')
        UserRole.objects.get_or_create(
            user=mentor,
            role=role,
            defaults={'scope': 'global', 'is_active': True}
        )
        mentors.append(mentor)
        print(f'✓ Created/updated mentor: {mentor.email}')
    
    staff_users['mentors'] = mentors
    return staff_users


@transaction.atomic
def create_students_and_enrollments(cohorts, tracks):
    """Create 100 students and enroll them in cohorts based on tracks."""
    students_created = 0
    enrollments_created = 0
    
    # Track student counter
    student_counter = 1
    
    # For each cohort group (1 and 2)
    for cohort_num in [1, 2]:
        # Distribute students across all 5 tracks
        for track_key in TRACKS.keys():
            cohort_key = f'{cohort_num}_{track_key}'
            cohort = cohorts[cohort_key]
            track = tracks[track_key]
            
            # Create 10 students for this track in this cohort
            for i in range(STUDENTS_PER_TRACK_PER_COHORT):
                email = f'student{student_counter}@test.com'
                username = f'student{student_counter}'
                
                # Create student
                student, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        'username': username,
                        'first_name': f'Student',
                        'last_name': f'{student_counter}',
                        'account_status': 'active',
                        'email_verified': True,
                        'is_active': True,
                        'profiling_complete': True
                    }
                )
                
                if not created:
                    student.account_status = 'active'
                    student.email_verified = True
                    student.is_active = True
                    student.profiling_complete = True
                    student.save()
                else:
                    students_created += 1
                
                student.set_password(DEFAULT_PASSWORD)
                student.save()
                
                # Assign student role
                role, _ = Role.objects.get_or_create(name='student')
                UserRole.objects.get_or_create(
                    user=student,
                    role=role,
                    defaults={'scope': 'global', 'is_active': True}
                )
                
                # Create profiler session with recommended track
                profiler_session, ps_created = ProfilerSession.objects.get_or_create(
                    user=student,
                    defaults={
                        'status': 'finished',
                        'aptitude_score': round(random.uniform(60, 95), 2),
                        'track_confidence': round(random.uniform(0.75, 0.95), 2),
                        'recommended_track_id': track.id,
                        'completed_at': timezone.now(),
                        'is_locked': True,
                        'locked_at': timezone.now(),
                        'strengths': [
                            'analytical thinking',
                            'problem solving',
                            'attention to detail',
                            'technical aptitude'
                        ],
                        'behavioral_profile': {
                            'work_style': 'collaborative',
                            'learning_preference': 'hands-on'
                        }
                    }
                )
                
                if not ps_created:
                    # Update existing session
                    profiler_session.status = 'finished'
                    profiler_session.recommended_track_id = track.id
                    profiler_session.track_confidence = round(random.uniform(0.75, 0.95), 2)
                    profiler_session.completed_at = timezone.now()
                    profiler_session.is_locked = True
                    profiler_session.locked_at = timezone.now()
                    profiler_session.save()
                
                # Update user's profiling session reference
                student.profiling_session_id = profiler_session.id
                student.save()
                
                # Create enrollment
                enrollment, enr_created = Enrollment.objects.get_or_create(
                    user=student,
                    cohort=cohort,
                    defaults={
                        'enrollment_type': 'director',
                        'seat_type': 'scholarship',
                        'payment_status': 'waived',
                        'status': 'active'
                    }
                )
                
                if enr_created:
                    enrollments_created += 1
                
                student_counter += 1
    
    return students_created, enrollments_created


def main():
    """Main function to create all test data."""
    print('=' * 80)
    print('Creating Test Cohorts and Students')
    print('=' * 80)
    print()
    
    try:
        # Create program
        program = create_test_program()
        print()
        
        # Create tracks
        tracks = create_tracks(program)
        print()
        
        # Create staff users (will get director for cohorts)
        staff_users = create_staff_users()
        program_director = staff_users['director']
        print()
        
        # Create cohorts
        cohorts = create_cohorts(tracks, program_director)
        print()
        
        # Create students and enrollments
        print('Creating students and enrollments...')
        students_created, enrollments_created = create_students_and_enrollments(cohorts, tracks)
        print()
        
        # Summary
        print('=' * 80)
        print('Summary')
        print('=' * 80)
        print(f'✓ Program: {program.name}')
        print(f'✓ Tracks created: {len(tracks)}')
        print(f'✓ Cohorts created: {len(cohorts)}')
        print(f'✓ Students created: {students_created}')
        print(f'✓ Enrollments created: {enrollments_created}')
        print(f'✓ Staff users:')
        print(f'  - Admin: {staff_users["admin"].email}')
        print(f'  - Program Director: {staff_users["director"].email}')
        print(f'  - Finance: {staff_users["finance"].email}')
        print(f'  - Mentors: {len(staff_users["mentors"])}')
        print()
        print(f'🔑 Default password for all users: {DEFAULT_PASSWORD}')
        print()
        print('📊 Cohort Distribution:')
        for cohort_num in [1, 2]:
            print(f'\n  Cohort {chr(64 + cohort_num)}:')
            for track_key in TRACKS.keys():
                cohort_key = f'{cohort_num}_{track_key}'
                cohort = cohorts[cohort_key]
                enrolled = Enrollment.objects.filter(cohort=cohort, status='active').count()
                print(f'    - {cohort.name}: {enrolled} students')
        print()
        print('✅ All test data created successfully!')
        print()
        print('Student emails: student1@test.com through student100@test.com')
        print('All students have completed AI profiling with track recommendations.')
        
    except Exception as e:
        print(f'\n❌ Error: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        # Reconnect signal
        post_save.connect(signals.auto_map_user_on_create, sender=User)


if __name__ == '__main__':
    main()
