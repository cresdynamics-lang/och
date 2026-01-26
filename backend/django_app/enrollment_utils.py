#!/usr/bin/env python
"""
Student Enrollment Management Utilities

Provides helper functions for managing student enrollments via director.
Useful for testing enrollment workflows.

Usage:
  python manage.py shell < enrollment_utils.py
  
Or import in your code:
  from enrollment_utils import *
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from programs.models import Cohort, Track, Enrollment
from django.utils import timezone

User = get_user_model()


def get_student_by_number(student_num):
    """Get a student by their test number (1-100)."""
    email = f'student{student_num}@test.com'
    try:
        return User.objects.get(email=email)
    except User.DoesNotExist:
        print(f"❌ Student {student_num} not found")
        return None


def get_director():
    """Get the program director user."""
    try:
        return User.objects.get(email='director@test.com')
    except User.DoesNotExist:
        print("❌ Director not found")
        return None


def get_cohort_by_number(cohort_num):
    """Get a cohort by number (1 or 2)."""
    try:
        return Cohort.objects.filter(name__contains=f'Cohort {cohort_num}').first()
    except:
        print(f"❌ Cohort {cohort_num} not found")
        return None


def get_track_by_name(track_name):
    """Get a track by name (defender, offensive, grc, leadership, innovation)."""
    try:
        return Track.objects.get(key=track_name.lower())
    except Track.DoesNotExist:
        print(f"❌ Track '{track_name}' not found")
        return None


def enroll_student(student_num, cohort_num, track_name=None):
    """
    Enroll a student in a cohort with optional track assignment.
    
    Args:
        student_num: Student number (1-100)
        cohort_num: Cohort number (1 or 2)
        track_name: Track name (optional, defaults to recommended track)
    
    Returns:
        Enrollment object or None if failed
    """
    student = get_student_by_number(student_num)
    cohort = get_cohort_by_number(cohort_num)
    director = get_director()
    
    if not (student and cohort and director):
        return None
    
    # Get track
    if track_name:
        track = get_track_by_name(track_name)
    else:
        # Use recommended track from profiler session
        if student.profiling_session:
            track = student.profiling_session.recommended_track
        else:
            print(f"⚠️  No profiling session for student {student_num}")
            track = None
    
    if not track:
        track = get_track_by_name('defender')  # Fallback
    
    # Create or update enrollment
    enrollment, created = Enrollment.objects.get_or_create(
        user=student,
        cohort=cohort,
        defaults={
            'enrollment_type': 'director',
            'track': track,
            'enrollment_date': timezone.now(),
            'status': 'active',
            'is_current': True,
            'enrolled_by_user': director,
            'notes': f'Enrolled by director - Track: {track.name}'
        }
    )
    
    if created:
        print(f"✓ Enrolled student{student_num} in {cohort.name} ({track.name})")
    else:
        print(f"⚠️  student{student_num} already enrolled in {cohort.name}")
    
    return enrollment


def unenroll_student(student_num, cohort_num):
    """
    Remove a student from a cohort.
    
    Args:
        student_num: Student number (1-100)
        cohort_num: Cohort number (1 or 2)
    
    Returns:
        True if successful, False otherwise
    """
    student = get_student_by_number(student_num)
    cohort = get_cohort_by_number(cohort_num)
    
    if not (student and cohort):
        return False
    
    try:
        enrollment = Enrollment.objects.get(user=student, cohort=cohort)
        enrollment.delete()
        print(f"✓ Unenrolled student{student_num} from {cohort.name}")
        return True
    except Enrollment.DoesNotExist:
        print(f"❌ student{student_num} is not enrolled in {cohort.name}")
        return False


def transfer_student(student_num, from_cohort, to_cohort):
    """
    Transfer a student from one cohort to another.
    
    Args:
        student_num: Student number (1-100)
        from_cohort: Source cohort number (1 or 2)
        to_cohort: Destination cohort number (1 or 2)
    
    Returns:
        True if successful, False otherwise
    """
    if not unenroll_student(student_num, from_cohort):
        return False
    
    if not enroll_student(student_num, to_cohort):
        # Try to re-enroll in original cohort
        enroll_student(student_num, from_cohort)
        return False
    
    print(f"✓ Transferred student{student_num} from Cohort {from_cohort} to {to_cohort}")
    return True


def get_cohort_students(cohort_num):
    """Get all students in a cohort."""
    cohort = get_cohort_by_number(cohort_num)
    if not cohort:
        return []
    
    enrollments = Enrollment.objects.filter(cohort=cohort, status='active')
    return enrollments


def get_student_enrollments(student_num):
    """Get all enrollments for a student."""
    student = get_student_by_number(student_num)
    if not student:
        return []
    
    return Enrollment.objects.filter(user=student)


def print_cohort_summary(cohort_num):
    """Print summary of students in a cohort."""
    cohort = get_cohort_by_number(cohort_num)
    if not cohort:
        return
    
    enrollments = get_cohort_students(cohort_num)
    
    print(f"\n📊 {cohort.name}")
    print(f"{'─' * 60}")
    print(f"Total Students: {enrollments.count()}")
    print(f"Status: {cohort.status}")
    print(f"Director: {cohort.director.get_full_name() if cohort.director else 'None'}")
    
    # Group by track
    by_track = {}
    for enrollment in enrollments:
        track = enrollment.track.name if enrollment.track else 'Unknown'
        if track not in by_track:
            by_track[track] = []
        by_track[track].append(enrollment.user.email)
    
    print(f"\nStudents by Track:")
    for track, students in sorted(by_track.items()):
        print(f"  {track}: {len(students)} students")
        for email in sorted(students)[:3]:  # Show first 3
            print(f"    - {email}")
        if len(students) > 3:
            print(f"    ... and {len(students) - 3} more")
    
    print()


def list_support_roles():
    """List all support role users."""
    roles = {
        'admin@test.com': 'Admin',
        'director@test.com': 'Program Director',
        'mentor@test.com': 'Mentor',
        'sponsor@test.com': 'Sponsor Admin',
        'analyst@test.com': 'Analyst',
        'finance@test.com': 'Finance Manager'
    }
    
    print("\n🔐 Support Roles")
    print("─" * 60)
    for email, role in roles.items():
        try:
            user = User.objects.get(email=email)
            print(f"✓ {role:20} ({email})")
        except User.DoesNotExist:
            print(f"✗ {role:20} (NOT FOUND)")
    print()


def test_enrollment_workflow():
    """Test complete enrollment workflow."""
    print("\n🧪 Testing Enrollment Workflow")
    print("=" * 60)
    
    # Test enrolling a student
    print("\n1. Enrolling student 1 in Cohort 1...")
    enroll_student(1, 1)
    
    # Test getting cohort students
    print("\n2. Students in Cohort 1:")
    enrollments = get_cohort_students(1)
    print(f"   Found {enrollments.count()} students")
    
    # Test student enrollments
    print("\n3. Enrollments for student 1:")
    enroll_list = get_student_enrollments(1)
    for enrollment in enroll_list:
        print(f"   - {enrollment.cohort.name} ({enrollment.track.name})")
    
    print("\n✅ Workflow test complete\n")


# Main execution
if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("Student Enrollment Management Utilities")
    print("=" * 60)
    
    # List support roles
    list_support_roles()
    
    # Print cohort summaries
    for cohort_num in [1, 2]:
        print_cohort_summary(cohort_num)
    
    # Demonstrate functions (uncomment to use)
    # test_enrollment_workflow()
    
    print("\n📖 Available Functions:")
    print("  - enroll_student(student_num, cohort_num, track_name=None)")
    print("  - unenroll_student(student_num, cohort_num)")
    print("  - transfer_student(student_num, from_cohort, to_cohort)")
    print("  - get_cohort_students(cohort_num)")
    print("  - get_student_enrollments(student_num)")
    print("  - print_cohort_summary(cohort_num)")
    print("  - list_support_roles()")
    print()
