#!/usr/bin/env python
"""Test mission submission endpoint."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from missions.models import Mission, MissionSubmission, MissionAssignment
from users.models import User
from missions.tasks import process_mission_ai_review
import traceback

print("Testing mission submission flow...")

# Get a student user
student = User.objects.filter(email__icontains='student').first()
if not student:
    # Just get any user
    student = User.objects.first()
if not student:
    print("[ERROR] No user found")
    exit(1)

print(f"[OK] Found student: {student.email}")

# Get a mission
mission = Mission.objects.first()
if not mission:
    print("[ERROR] No mission found")
    exit(1)

print(f"[OK] Found mission: {mission.title}")

# Create or get assignment
assignment, _ = MissionAssignment.objects.get_or_create(
    mission=mission,
    student=student,
    assignment_type='individual',
    defaults={'status': 'assigned'}
)
print(f"[OK] Assignment: {assignment.id}")

# Create or get submission
submission, created = MissionSubmission.objects.get_or_create(
    assignment=assignment,
    student=student,
    defaults={'status': 'draft', 'content': 'Test submission'}
)

if not created:
    submission.content = 'Test submission updated'
    submission.status = 'submitted'
    submission.save()

print(f"[OK] Submission: {submission.id}")

# Test AI review task
print("\nTesting AI review task...")
try:
    result = process_mission_ai_review(str(submission.id))
    print(f"[OK] AI review result: {result}")
except Exception as e:
    print(f"[ERROR] AI review failed:")
    print(traceback.format_exc())

print("\nDone!")
