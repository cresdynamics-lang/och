#!/usr/bin/env python3
"""Test the start mission endpoint after all fixes."""
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.test import RequestFactory
from rest_framework.test import force_authenticate
from missions.views_student import start_mission_student
from missions.models import Mission
from users.models import User

print("=" * 80)
print("TESTING START MISSION ENDPOINT (FINAL)")
print("=" * 80)

# Get the student user
try:
    user = User.objects.get(email='student@example.com')
    print(f"\n[1] Found user: {user.email}")
    print(f"    UUID: {user.uuid_id}")
except User.DoesNotExist:
    print("\n[ERROR] User student@example.com not found")
    sys.exit(1)

# Get a mission
try:
    mission = Mission.objects.first()
    if not mission:
        print("\n[ERROR] No missions found in database")
        sys.exit(1)
    print(f"\n[2] Found mission: {mission.title}")
    print(f"    ID: {mission.id}")
except Exception as e:
    print(f"\n[ERROR] Failed to get mission: {e}")
    sys.exit(1)

# Create a mock request
factory = RequestFactory()
request = factory.post(f'/api/v1/student/missions/{mission.id}/start/')

# Force authenticate the request
force_authenticate(request, user=user)
request.user = user

print(f"\n[3] Calling start_mission_student()...")
try:
    response = start_mission_student(request, mission_id=mission.id)
    print(f"\n[4] Response received:")
    print(f"    Status code: {response.status_code}")

    if response.status_code in [200, 201]:
        data = response.data
        print(f"    [SUCCESS] Mission started!")
        print(f"    Progress ID: {data.get('progress_id')}")
        print(f"    Status: {data.get('status')}")
        print(f"    Current subtask: {data.get('current_subtask')}")
        print(f"    Message: {data.get('message')}")
    else:
        print(f"    Error response:")
        print(f"      {response.data}")

except Exception as e:
    print(f"\n[ERROR] Exception raised:")
    print(f"    Type: {type(e).__name__}")
    print(f"    Message: {str(e)}")

    # Print full traceback
    import traceback
    print(f"\n    Traceback:")
    traceback.print_exc()

print("\n" + "=" * 80)
print("TEST COMPLETE")
print("=" * 80)
