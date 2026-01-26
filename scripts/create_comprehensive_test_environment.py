#!/usr/bin/env python3
"""
Comprehensive Test User & Cohort Setup Script

Creates complete test environment with:
- Two cohorts (Cohort A: Defender track, Cohort B: Analyst track)
- Students in each cohort
- Support roles: Admin, Program Director, Mentors
- Proper enrollments via Director/Admin workflows

Usage:
    python scripts/create_comprehensive_test_environment.py
"""

import os
import sys
import django

# Add Django app to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../backend/django_app'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from users.models import UserRole, Role
from programs.models import Program, Track, Cohort, Enrollment
from organizations.models import Organization
from django.db import transaction
from django.db.models import Q
from datetime import datetime, timedelta

User = get_user_model()

# Test data configuration
TEST_DATA = {
    'organization': {
        'name': 'Ongoza Cyber Hub Test Org',
        'slug': 'och-test',
        'org_type': 'sponsor',
    },
    'programs': [
        {
            'code': 'DEF2025',
            'name': 'Defender Track 2025',
            'track_code': 'defender',
            'description': 'Comprehensive cybersecurity defender training program',
        },
        {
            'code': 'ANA2025',
            'name': 'Analyst Track 2025',
            'track_code': 'analyst',
            'description': 'Advanced threat analysis and intelligence program',
        },
    ],
    'cohorts': [
        {
            'name': 'Cohort A - Defenders',
            'code': 'COHA-DEF-2025',
            'program_code': 'DEF2025',
            'start_date': datetime.now().date(),
            'end_date': (datetime.now() + timedelta(days=180)).date(),
            'capacity': 30,
        },
        {
            'name': 'Cohort B - Analysts',
            'code': 'COHB-ANA-2025',
            'program_code': 'ANA2025',
            'start_date': (datetime.now() + timedelta(days=7)).date(),
            'end_date': (datetime.now() + timedelta(days=187)).date(),
            'capacity': 25,
        },
    ],
    'admin': {
        'email': 'admin@och.test',
        'username': 'admin_test',
        'password': 'Admin@Test123',
        'first_name': 'Admin',
        'last_name': 'User',
    },
    'director': {
        'email': 'director@och.test',
        'username': 'director_test',
        'password': 'Director@Test123',
        'first_name': 'Program',
        'last_name': 'Director',
    },
    'mentors': [
        {
            'email': 'mentor1@och.test',
            'username': 'mentor1_test',
            'password': 'Mentor@Test123',
            'first_name': 'Sarah',
            'last_name': 'Mentor',
        },
        {
            'email': 'mentor2@och.test',
            'username': 'mentor2_test',
            'password': 'Mentor@Test123',
            'first_name': 'James',
            'last_name': 'Mentor',
        },
    ],
    'students_cohort_a': [
        {
            'email': 'student.a1@och.test',
            'username': 'student_a1',
            'password': 'Student@Test123',
            'first_name': 'Alice',
            'last_name': 'Defender',
            'handle': 'alice_defender',
        },
        {
            'email': 'student.a2@och.test',
            'username': 'student_a2',
            'password': 'Student@Test123',
            'first_name': 'Bob',
            'last_name': 'Defender',
            'handle': 'bob_defender',
        },
        {
            'email': 'student.a3@och.test',
            'username': 'student_a3',
            'password': 'Student@Test123',
            'first_name': 'Carol',
            'last_name': 'Defender',
            'handle': 'carol_defender',
        },
    ],
    'students_cohort_b': [
        {
            'email': 'student.b1@och.test',
            'username': 'student_b1',
            'password': 'Student@Test123',
            'first_name': 'David',
            'last_name': 'Analyst',
            'handle': 'david_analyst',
        },
        {
            'email': 'student.b2@och.test',
            'username': 'student_b2',
            'password': 'Student@Test123',
            'first_name': 'Emma',
            'last_name': 'Analyst',
            'handle': 'emma_analyst',
        },
        {
            'email': 'student.b3@och.test',
            'username': 'student_b3',
            'password': 'Student@Test123',
            'first_name': 'Frank',
            'last_name': 'Analyst',
            'handle': 'frank_analyst',
        },
    ],
}


def create_user(user_data, role_name):
    """Create a user with specified role"""
    email = user_data['email']
    
    # Check if user already exists
    existing = User.objects.filter(Q(email=email) | Q(username=user_data['username'])).first()
    if existing:
        print(f"  ⚠️  User {existing.email} already exists, skipping...")
        return existing
    
    # Create user
    user = User.objects.create_user(
        email=email,
        username=user_data['username'],
        password=user_data['password'],
        first_name=user_data['first_name'],
        last_name=user_data['last_name'],
        is_active=True,
        email_verified=True,
    )
    
    # Add handle for students
    if 'handle' in user_data:
        user.handle = user_data['handle']
        user.save()
    
    # Assign role via RBAC models
    role = Role.objects.get(name=role_name)
    UserRole.objects.get_or_create(
        user=user,
        role=role,
        defaults={
            'scope': 'global',
            'is_active': True,
        }
    )
    
    print(f"  ✅ Created {role_name}: {email}")
    return user


def create_organization(owner_user):
    """Create test organization with an owner"""
    org_data = TEST_DATA['organization']
    org, created = Organization.objects.get_or_create(
        slug=org_data['slug'],
        defaults={
            'name': org_data['name'],
            'org_type': org_data['org_type'],
            'owner': owner_user,
            'is_active': True,
        }
    )
    if created:
        print(f"✅ Created organization: {org.name}")
    else:
        # Ensure owner is set if missing
        if not getattr(org, 'owner_id', None):
            org.owner = owner_user
            org.save()
        print(f"⚠️  Organization {org.name} already exists")
    # Ensure owner is a member with admin role
    from organizations.models import OrganizationMember
    OrganizationMember.objects.get_or_create(
        organization=org,
        user=owner_user,
        defaults={'role': 'admin'}
    )
    return org


def create_programs_and_cohorts(director_user):
    """Create test programs, tracks, and cohorts (programs app)"""
    programs = {}
    cohorts = {}
    tracks = {}

    # Create programs and associated tracks
    for prog_data in TEST_DATA['programs']:
        program, created = Program.objects.get_or_create(
            name=prog_data['name'],
            defaults={
                'category': 'technical',
                'categories': ['technical'],
                'description': prog_data['description'],
                'duration_months': 6,
                'default_price': 0,
                'status': 'active',
            }
        )
        programs[prog_data['code']] = program
        if created:
            print(f"  ✅ Created program: {program.name}")
        else:
            print(f"  ⚠️  Program {program.name} already exists")

        # Create a primary track for the program
        track_key = prog_data['track_code']
        track, t_created = Track.objects.get_or_create(
            program=program,
            key=track_key,
            defaults={
                'name': f"{prog_data['name']} Track",
                'track_type': 'primary',
                'description': f"Primary {track_key} track",
                'director': director_user,
            }
        )
        tracks[prog_data['code']] = track
        if t_created:
            print(f"    ✅ Created track: {track.name} ({track.key})")
        else:
            print(f"    ⚠️  Track {track.name} already exists")

    # Create cohorts under each track
    for cohort_data in TEST_DATA['cohorts']:
        program = programs.get(cohort_data['program_code'])
        track = tracks.get(cohort_data['program_code'])
        if not program or not track:
            print(f"  ❌ Missing program/track for {cohort_data['program_code']}, skipping cohort")
            continue

        cohort, created = Cohort.objects.get_or_create(
            track=track,
            name=cohort_data['name'],
            defaults={
                'start_date': cohort_data['start_date'],
                'end_date': cohort_data['end_date'],
                'seat_cap': cohort_data['capacity'],
                'mode': 'virtual',
                'status': 'active',
                'coordinator': director_user,
            }
        )
        cohorts[cohort_data['code']] = cohort
        if created:
            print(f"  ✅ Created cohort: {cohort.name}")
        else:
            print(f"  ⚠️  Cohort {cohort.name} already exists")

    return programs, cohorts


def enroll_students(students, cohort):
    """Enroll students in cohort via director/admin workflow"""
    for student in students:
        if not cohort.enrollments.filter(user=student).exists():
            Enrollment.objects.create(
                user=student,
                cohort=cohort,
                enrollment_type='director',
                seat_type='scholarship',
                payment_status='waived',
                status='active',
            )
            print(f"    ✅ Enrolled {student.email} in {cohort.name}")
        else:
            print(f"    ⚠️  {student.email} already enrolled in {cohort.name}")


@transaction.atomic
def main():
    print("\n" + "="*70)
    print("🚀 Creating Comprehensive Test Environment")
    print("="*70 + "\n")
    
    try:
        # 1. Create support roles first (needed for organization owner)
        print("👥 Step 1: Creating Support Staff")
        admin = create_user(TEST_DATA['admin'], 'admin')
        director = create_user(TEST_DATA['director'], 'program_director')
        mentors = [create_user(m, 'mentor') for m in TEST_DATA['mentors']]
        print()
        
        # 2. Create organization with admin as owner
        print("📦 Step 2: Creating Organization")
        org = create_organization(admin)
        print()

        # 3. Create programs and cohorts
        print("🎓 Step 3: Creating Programs & Cohorts")
        programs, cohorts = create_programs_and_cohorts(director)
        print()
        
        # 4. Create students
        print("👨‍🎓 Step 4: Creating Students")
        print("  Cohort A Students:")
        students_a = [create_user(s, 'student') for s in TEST_DATA['students_cohort_a']]
        print("  Cohort B Students:")
        students_b = [create_user(s, 'student') for s in TEST_DATA['students_cohort_b']]
        print()
        
        # 5. Enroll students in cohorts
        print("📝 Step 5: Enrolling Students in Cohorts")
        cohort_a = cohorts.get('COHA-DEF-2025')
        cohort_b = cohorts.get('COHB-ANA-2025')
        
        if cohort_a:
            print(f"  Enrolling in {cohort_a.name}:")
            enroll_students(students_a, cohort_a)
        
        if cohort_b:
            print(f"  Enrolling in {cohort_b.name}:")
            enroll_students(students_b, cohort_b)
        print()
        
        # Summary
        print("="*70)
        print("✅ Test Environment Created Successfully!")
        print("="*70)
        print("\n📋 Summary:")
        print(f"  • Organization: {org.name}")
        print(f"  • Programs: {len(programs)}")
        print(f"  • Cohorts: {len(cohorts)}")
        print(f"  • Admin: {admin.email}")
        print(f"  • Director: {director.email}")
        print(f"  • Mentors: {len(mentors)}")
        print(f"  • Students (Cohort A): {len(students_a)}")
        print(f"  • Students (Cohort B): {len(students_b)}")
        
        print("\n🔐 Login Credentials:")
        print(f"  Admin:    {TEST_DATA['admin']['email']} / {TEST_DATA['admin']['password']}")
        print(f"  Director: {TEST_DATA['director']['email']} / {TEST_DATA['director']['password']}")
        print(f"  Mentor 1: {TEST_DATA['mentors'][0]['email']} / {TEST_DATA['mentors'][0]['password']}")
        print(f"  Student A1: {TEST_DATA['students_cohort_a'][0]['email']} / {TEST_DATA['students_cohort_a'][0]['password']}")
        print(f"  Student B1: {TEST_DATA['students_cohort_b'][0]['email']} / {TEST_DATA['students_cohort_b'][0]['password']}")
        print("\n" + "="*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
