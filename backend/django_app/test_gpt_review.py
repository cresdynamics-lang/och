#!/usr/bin/env python
"""Test GPT AI review functionality."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from missions.models import Mission, MissionSubmission, MissionAssignment
from users.models import User
from missions.tasks import process_mission_ai_review
from django.utils import timezone

print("Testing GPT AI Review...\n")

# Get student with professional_7 tier
student = User.objects.get(email='student@example.com')
print(f"[1] Student: {student.email}")

# Get a mission
mission = Mission.objects.first()
print(f"[2] Mission: {mission.title}")

# Create assignment
assignment, _ = MissionAssignment.objects.get_or_create(
    mission=mission,
    student=student,
    assignment_type='individual',
    defaults={'status': 'assigned'}
)
print(f"[3] Assignment created: {assignment.id}")

# Create a new submission with realistic content
submission = MissionSubmission.objects.create(
    assignment=assignment,
    student=student,
    content="""
    I completed the network security analysis mission. Here's what I did:

    1. Performed network reconnaissance using nmap
    2. Identified open ports: 22, 80, 443
    3. Analyzed HTTP headers for security misconfigurations
    4. Found missing security headers (X-Frame-Options, CSP)
    5. Documented findings with screenshots

    Recommendations:
    - Close unnecessary ports
    - Add security headers
    - Enable HTTPS everywhere
    """,
    status='submitted',
    submitted_at=timezone.now()
)
print(f"[4] Submission created: {submission.id}")
print(f"[5] Content length: {len(submission.content)} chars\n")

# Run AI review
print("[6] Running AI review with GPT-4o-mini...")
print("=" * 60)

result = process_mission_ai_review(str(submission.id))

print("=" * 60)
print(f"\n[7] Result: {result}")

# Check if we got real AI feedback
if result.get('status') == 'success':
    score = result.get('score')
    print(f"\n✓ AI Review Success!")
    print(f"  Score: {score}")

    # Fetch the feedback
    from missions.models import AIFeedback
    feedback = AIFeedback.objects.filter(submission=submission).first()

    if feedback:
        print(f"\n  Strengths ({len(feedback.strengths)}):")
        for s in feedback.strengths[:3]:
            print(f"    - {s}")

        print(f"\n  Gaps ({len(feedback.gaps)}):")
        for g in feedback.gaps[:3]:
            print(f"    - {g}")

        print(f"\n  Suggestions ({len(feedback.suggestions)}):")
        for s in feedback.suggestions[:3]:
            print(f"    - {s}")

        # Check if it's default or real AI
        if score == 75 and len(feedback.strengths) == 1 and feedback.strengths[0] == 'Submission received':
            print("\n⚠ WARNING: Got default fallback response, GPT may not have been called")
        else:
            print("\n✓ Got real AI-generated feedback from GPT!")
    else:
        print("\n✗ No AI feedback record found")
else:
    print(f"\n✗ AI Review Failed: {result.get('message')}")

print("\nDone!")
