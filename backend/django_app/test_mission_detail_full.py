#!/usr/bin/env python3
"""Test mission detail endpoint and show full response."""
import os
import django
import sys
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.test import RequestFactory
from rest_framework.test import force_authenticate
from missions.views_student import get_mission_detail
from missions.models import Mission
from users.models import User

print("=" * 80)
print("MISSION DETAIL FULL RESPONSE")
print("=" * 80)

# Get the student user
user = User.objects.get(email='student@example.com')
print(f"\n[1] User: {user.email}")

# Get a mission
mission = Mission.objects.first()
print(f"[2] Mission: {mission.title} ({mission.id})")

# Create request
factory = RequestFactory()
request = factory.get(f'/api/v1/student/missions/{mission.id}/')
force_authenticate(request, user=user)
request.user = user

# Get response
response = get_mission_detail(request, mission_id=mission.id)

print(f"\n[3] Status: {response.status_code}")
print(f"\n[4] FULL RESPONSE DATA:")
print("=" * 80)
print(json.dumps(response.data, indent=2, default=str))
print("=" * 80)

# Check key fields
print(f"\n[5] KEY FIELDS CHECK:")
data = response.data
print(f"    ✓ id: {data.get('id')}")
print(f"    ✓ title: {data.get('title')}")
print(f"    ✓ description: {data.get('description')}")
print(f"    ✓ objectives: {data.get('objectives')} (count: {len(data.get('objectives', []))})")
print(f"    ✓ competency_tags: {data.get('competency_tags')} (count: {len(data.get('competency_tags', []))})")
print(f"    ✓ status: {data.get('status')}")
print(f"    ✓ submission: {data.get('submission', {}).get('id')}")
print(f"    ✓ difficulty: {data.get('difficulty')}")
print(f"    ✓ estimated_time_minutes: {data.get('estimated_time_minutes')}")

print("\n" + "=" * 80)
