#!/usr/bin/env python3
"""
Test goal API endpoint
"""
import os
import sys
import django
from django.test import RequestFactory, override_settings
from django.contrib.auth import get_user_model

# Setup Django
sys.path.insert(0, '/home/fidel-ochieng-ogola/FIDEL OGOLA PERSONAL FOLDER/Ongoza /ongozaCyberHub/backend/django_app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from coaching.views import goals_list
from coaching.serializers import GoalSerializer

User = get_user_model()

def test_goal_serializer():
    # Get a user
    user = User.objects.filter(is_active=True).first()
    if not user:
        print("❌ No active users found")
        return

    print(f"Testing with user: {user.email}")

    # Test serializer directly
    data = {
        'title': 'Test Goal API',
        'description': 'Testing goal creation via API',
        'type': 'monthly',
        'target': 10,
        'current': 0,
        'progress': 0,
        'status': 'active'
    }

    serializer = GoalSerializer(data=data)
    if serializer.is_valid():
        print("✅ Serializer is valid")
        try:
            goal = serializer.save(user=user, subscription_tier='free')
            print(f"✅ Goal created: {goal.id}")
            print(f"   Title: {goal.title}")
            print(f"   User: {goal.user.email}")
            print(f"   Subscription tier: {goal.subscription_tier}")

            # Clean up
            goal.delete()
            print("✅ Goal deleted after test")

        except Exception as e:
            print(f"❌ Error saving goal: {e}")
    else:
        print(f"❌ Serializer errors: {serializer.errors}")

if __name__ == '__main__':
    test_goal_serializer()
