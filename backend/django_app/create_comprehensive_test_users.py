#!/usr/bin/env python
"""
Create comprehensive test users for development and testing.
Creates:
  1. Support roles (admin, program director, mentor, sponsor admin, analyst, finance)
  2. Multiple cohorts (2 cohorts)
  3. Student users with proper enrollments (10 students per cohort)
  4. Role assignments and permissions

Run: python create_comprehensive_test_users.py
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

# Disconnect signal to avoid issues during bulk creation
post_save.disconnect(signals.auto_map_user_on_create, sender=User)

# Default password for all test users
DEFAULT_PASSWORD = 'testpass123'

# Support role definitions
SUPPORT_ROLES = {
    'admin': {
        'email': 'admin@test.com',
        'username': 'admin',
        'first_name': 'Admin',
        'last_name': 'User',
        'is_staff': True,
        'is_superuser': True,
        'scope': 'global'
    },
    'program_director': {
        'email': 'director@test.com',
        'username': 'director',
        'first_name': 'Program',
        'last_name': 'Director',
        'is_staff': True,
        'scope': 'program'
    },
    'mentor': {
        'email': 'mentor@test.com',
        'username': 'mentor',
        'first_name': 'Lead',
        'last_name': 'Mentor',
        'scope': 'cohort'
    },
    'sponsor_admin': {
        'email': 'sponsor@test.com',
        'username': 'sponsor',
        'first_name': 'Sponsor',
        'last_name': 'Admin',
        'scope': 'organization'
    },
    'analyst': {
        'email': 'analyst@test.com',
        'username': 'analyst',
        'first_name': 'Data',
        'last_name': 'Analyst',
        'is_staff': True,
        'scope': 'global'
    },
    'finance': {
        'email': 'finance@test.com',
        'username': 'finance',
        'first_name': 'Finance',
        'last_name': 'Manager',
        'is_staff': True,
        'scope': 'organization'
    }
}

# Tracks for student distribution
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

STUDENTS_PER_COHORT = 10


@transaction.atomic
def create_support_roles():
    """Create support role users (admin, director, mentor, etc.)."""
    print("\n📋 Creating support roles...")
    created_roles = {}
    
    for role_name, role_data in SUPPORT_ROLES.items():
        email = role_data['email']
        
        try:
            user = User.objects.get(email=email)
            user.set_password(DEFAULT_PASSWORD)
            user.account_status = 'active'
            user.email_verified = True
            user.is_active = True
            user.is_staff = role_data.get('is_staff', False)
            user.is_superuser = role_data.get('is_superuser', False)
            user.save()
            print(f"  ✓ Updated: {email} ({role_name})")
        except User.DoesNotExist:
            user = User.objects.create_user(
                email=email,
                password=DEFAULT_PASSWORD,
                username=role_data['username'],
                first_name=role_data['first_name'],
                last_name=role_data['last_name'],
                account_status='active',
                email_verified=True,
                is_active=True,
                is_staff=role_data.get('is_staff', False),
                is_superuser=role_data.get('is_superuser', False)
            )
            print(f"  ✓ Created: {email} ({role_name})")
        
        # Assign role
        role, _ = Role.objects.get_or_create(name=role_name)
        user_role, _ = UserRole.objects.get_or_create(
            user=user,
            role=role,
            defaults={
                'scope': role_data.get('scope', 'global'),
                'is_active': True
            }
        )
        
        created_roles[role_name] = user
    
    return created_roles


@transaction.atomic
def create_tracks():
    """Create or get track definitions."""
    print("\n📚 Setting up tracks...")
    tracks = {}
    program = Program.objects.first()  # Use existing program
    
    for track_key, track_data in TRACKS.items():
        track, created = Track.objects.get_or_create(
            key=track_key,
            program=program,
            defaults={
                'name': track_data['name'],
                'description': track_data['description'],
                'track_type': 'primary'
            }
        )
        tracks[track_key] = track
        status = "Created" if created else "Found"
        print(f"  ✓ {status}: {track.name}")
    
    return tracks


@transaction.atomic
def create_cohorts_and_students(support_roles, tracks):
    """Create 2 cohorts with students distributed across tracks."""
    print("\n🎓 Creating cohorts and enrolling students...")
    
    # Get director and mentor
    director = support_roles.get('program_director')
    mentor = support_roles.get('mentor')
    
    # Use the first track for cohort creation (defender track)
    default_track = tracks.get('defender') or list(tracks.values())[0]
    
    cohorts = {}
    students_created = 0
    enrollments_created = 0
    
    # Create 2 cohorts
    for cohort_num in [1, 2]:
        cohort_name = f'Cohort {cohort_num} - OCH Defenders'
        start_date = date.today() + timedelta(days=30 * (cohort_num - 1))
        end_date = start_date + timedelta(days=365)
        
        cohort, cohort_created = Cohort.objects.get_or_create(
            name=cohort_name,
            track=default_track,
            defaults={
                'start_date': start_date,
                'end_date': end_date,
                'status': 'active',
                'seat_cap': STUDENTS_PER_COHORT * len(TRACKS),
                'coordinator': director,
                'mode': 'hybrid'
            }
        )
        
        cohorts[cohort_num] = cohort
        status = "Created" if cohort_created else "Found"
        print(f"  ✓ {status}: {cohort.name} ({STUDENTS_PER_COHORT * len(TRACKS)} slots)")
        
        # Create students for this cohort across all tracks
        for track_key in TRACKS.keys():
            for i in range(STUDENTS_PER_COHORT):
                student_num = (cohort_num - 1) * (STUDENTS_PER_COHORT * len(TRACKS)) + \
                             (list(TRACKS.keys()).index(track_key) * STUDENTS_PER_COHORT) + i + 1
                
                email = f'student{student_num}@test.com'
                username = f'student{student_num}'
                
                # Create student
                student, student_created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        'username': username,
                        'first_name': f'Student',
                        'last_name': f'{student_num}',
                        'account_status': 'active',
                        'email_verified': True,
                        'is_active': True,
                        'profiling_complete': True
                    }
                )
                
                student.set_password(DEFAULT_PASSWORD)
                student.save()
                
                if student_created:
                    students_created += 1
                
                # Assign student role
                role, _ = Role.objects.get_or_create(name='student')
                UserRole.objects.get_or_create(
                    user=student,
                    role=role,
                    defaults={'scope': 'global', 'is_active': True}
                )
                
                # Create/update profiler session
                track = tracks[track_key]
                profiler_session, _ = ProfilerSession.objects.get_or_create(
                    user=student,
                    defaults={
                        'status': 'finished',
                        'aptitude_score': round(random.uniform(65, 95), 2),
                        'track_confidence': round(random.uniform(0.80, 0.98), 2),
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
                
                # Update student's profiling session
                student.profiling_session_id = profiler_session.id
                student.save()
                
                # Create enrollment via director
                enrollment, enr_created = Enrollment.objects.get_or_create(
                    user=student,
                    cohort=cohort,
                    defaults={
                        'enrollment_type': 'director',  # Enrolled by director
                        'seat_type': 'paid',
                        'payment_status': 'paid',
                        'status': 'active'
                    }
                )
                
                if enr_created:
                    enrollments_created += 1
        
        print(f"    └─ Created {STUDENTS_PER_COHORT * len(TRACKS)} students with enrollments")
    
    return cohorts, students_created, enrollments_created


@transaction.atomic
def print_summary(support_roles, students_created, enrollments_created):
    """Print summary of created users and credentials."""
    print("\n" + "="*70)
    print("✅ TEST USERS CREATED SUCCESSFULLY")
    print("="*70)
    
    print("\n🔐 SUPPORT ROLES (Staff & Administrators)")
    print("-" * 70)
    for role_name, role_data in SUPPORT_ROLES.items():
        print(f"\n  {role_name.replace('_', ' ').title()}:")
        print(f"    Email:    {role_data['email']}")
        print(f"    Password: {DEFAULT_PASSWORD}")
        print(f"    Scope:    {role_data.get('scope', 'global')}")
    
    print("\n" + "-" * 70)
    print("\n📊 STUDENT SUMMARY")
    print(f"  Total Students Created:  {students_created}")
    print(f"  Total Enrollments:       {enrollments_created}")
    print(f"  Cohorts:                 2 (Cohort 1, Cohort 2)")
    print(f"  Tracks per Cohort:       {len(TRACKS)}")
    print(f"  Students per Track:      {STUDENTS_PER_COHORT}")
    
    print("\n" + "-" * 70)
    print("\n📝 STUDENT NAMING SCHEME")
    print("  Email format: student<N>@test.com")
    print("  Password: testpass123 (for all students)")
    print("  Numbering: student1 - student100")
    print(f"  Example: student1@test.com, student50@test.com, student100@test.com")
    
    print("\n" + "-" * 70)
    print("\n🎯 KEY FEATURES")
    print("  ✓ Students pre-profiled (profiling_complete=True)")
    print("  ✓ Track recommendations assigned")
    print("  ✓ Enrollments managed via director")
    print("  ✓ Director can manage student enrollments")
    print("  ✓ Support roles have appropriate permissions")
    print("  ✓ Students distributed across 2 cohorts and 5 tracks")
    
    print("\n" + "-" * 70)
    print("\n💡 USAGE NOTES")
    print("  - Director can enroll/unenroll students via enrollment API")
    print("  - Students automatically have recommended track assigned")
    print("  - Use 'enrollment_type=director' for director enrollments")
    print("  - Mentor can view all students in assigned cohorts")
    print("  - Admin has full system access")
    
    print("\n" + "="*70 + "\n")


@transaction.atomic
def main():
    """Main execution."""
    try:
        print("\n🚀 Starting comprehensive test user setup...\n")
        
        # Create support roles
        support_roles = create_support_roles()
        
        # Create tracks
        tracks = create_tracks()
        
        # Create cohorts and students
        cohorts, students_created, enrollments_created = create_cohorts_and_students(
            support_roles, tracks
        )
        
        # Print summary
        print_summary(support_roles, students_created, enrollments_created)
        
        print("✅ Setup complete! Ready for development and testing.\n")
        
    except Exception as e:
        print(f"\n❌ Error during setup: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        # Reconnect signal
        post_save.connect(signals.auto_map_user_on_create, sender=User)


if __name__ == '__main__':
    main()
