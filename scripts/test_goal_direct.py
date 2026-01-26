#!/usr/bin/env python3
"""
Test goal creation directly using Django models
"""
import os
import sys
import django
from django.contrib.auth import get_user_model

# Setup Django
sys.path.insert(0, '/home/fidel-ochieng-ogola/FIDEL OGOLA PERSONAL FOLDER/Ongoza /ongozaCyberHub/backend/django_app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from coaching.models import Goal
from users.models import User

def test_goal_creation():
    # Get the first active user
    user = User.objects.filter(is_active=True).first()
    if not user:
        print("❌ No active users found")
        return

    print(f"Using user: {user.email}")

    # Try to create a goal
    try:
        goal = Goal.objects.create(
            user=user,
            title='Test Goal',
            description='This is a test goal created directly',
            type='monthly',
            target=5,
            current=0,
            progress=0,
            status='active'
        )
        print(f"✅ Goal created successfully: {goal.id}")
        print(f"   Title: {goal.title}")
        print(f"   Type: {goal.type}")
        print(f"   Status: {goal.status}")

        # Clean up
        goal.delete()
        print("✅ Goal deleted after test")

    except Exception as e:
        print(f"❌ Error creating goal: {e}")

if __name__ == '__main__':
    test_goal_creation()
