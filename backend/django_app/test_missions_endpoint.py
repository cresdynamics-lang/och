#!/usr/bin/env python3
"""Test the missions endpoint with proper authentication."""
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.test import RequestFactory
from rest_framework.test import force_authenticate
from missions.views_student import list_student_missions
from users.models import User

print("=" * 80)
print("TESTING MISSIONS ENDPOINT WITH AUTHENTICATION")
print("=" * 80)

# Get the student user
try:
    user = User.objects.get(email='student@example.com')
    print(f"\n[1] Found user: {user.email}")
    print(f"    UUID: {user.uuid_id}")
    print(f"    Is active: {user.is_active}")
    print(f"    Track key: {user.track_key}")
except User.DoesNotExist:
    print("\n[ERROR] User student@example.com not found")
    sys.exit(1)

# Create a mock request
factory = RequestFactory()
request = factory.get('/api/v1/student/missions/', {
    'page': 1,
    'page_size': 20
})

# Force authenticate the request
force_authenticate(request, user=user)
# Manually set the user attribute since force_authenticate doesn't always work with WSGIRequest
request.user = user

print(f"\n[2] Created authenticated request")
print(f"    User: {request.user.email if hasattr(request, 'user') else 'NOT SET'}")
print(f"    Authenticated: {request.user.is_authenticated if hasattr(request, 'user') else False}")

# Call the view
print(f"\n[3] Calling list_student_missions()...")
try:
    response = list_student_missions(request)
    print(f"\n[4] Response received:")
    print(f"    Status code: {response.status_code}")

    if response.status_code == 200:
        data = response.data
        print(f"    Total missions: {data.get('total', 0)}")
        print(f"    Missions returned: {len(data.get('missions', []))}")
        if data.get('missions'):
            print(f"\n    First mission:")
            mission = data['missions'][0]
            print(f"      - ID: {mission.get('id')}")
            print(f"      - Title: {mission.get('title')}")
            print(f"      - Status: {mission.get('status')}")
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
