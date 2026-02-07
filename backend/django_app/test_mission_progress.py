#!/usr/bin/env python3
"""Test the mission progress endpoint."""
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.test import RequestFactory
from rest_framework.test import force_authenticate
from missions.views_student import get_mission_progress
from missions.models import Mission
from missions.models_mxp import MissionProgress
from users.models import User

print("=" * 80)
print("TESTING MISSION PROGRESS ENDPOINT")
print("=" * 80)

# Get the student user
try:
    user = User.objects.get(email='student@example.com')
    print(f"\n[1] Found user: {user.email}")
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

# Check if progress exists
try:
    progress = MissionProgress.objects.filter(user=user, mission=mission).first()
    if progress:
        print(f"\n[3] Found existing progress: {progress.id}")
    else:
        print(f"\n[3] No progress found. Please start the mission first.")
        sys.exit(0)
except Exception as e:
    print(f"\n[ERROR] Failed to get progress: {e}")
    sys.exit(1)

# Create a mock request
factory = RequestFactory()
request = factory.get(f'/api/v1/student/missions/{mission.id}/progress/')

# Force authenticate the request
force_authenticate(request, user=user)
request.user = user

print(f"\n[4] Calling get_mission_progress()...")
try:
    response = get_mission_progress(request, mission_id=mission.id)
    print(f"\n[5] Response received:")
    print(f"    Status code: {response.status_code}")

    if response.status_code == 200:
        data = response.data
        print(f"    [SUCCESS]")
        print(f"    Progress ID: {data.get('id')}")
        print(f"    Status: {data.get('status')}")
        print(f"    Mission Title: {data.get('mission', {}).get('title')}")
        print(f"    Current Subtask: {data.get('current_subtask_index')}")
        print(f"    Progress: {data.get('progress_percent')}%")
    else:
        print(f"    Error response:")
        print(f"      {response.data}")

except Exception as e:
    print(f"\n[ERROR] Exception raised:")
    print(f"    Type: {type(e).__name__}")
    print(f"    Message: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
print("TEST COMPLETE")
print("=" * 80)
