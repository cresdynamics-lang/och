#!/usr/bin/env python3
"""
Test script to check goal creation endpoint
"""
import os
import sys
import django
from django.test import TestCase, Client
from django.contrib.auth import get_user_model

# Setup Django
sys.path.insert(0, '/home/fidel-ochieng-ogola/FIDEL OGOLA PERSONAL FOLDER/Ongoza /ongozaCyberHub/backend/django_app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def test_goal_creation():
    # Create a test client
    client = Client()

    # Try to get or create a test user
    try:
        user = User.objects.filter(is_active=True).first()
        if not user:
            print("❌ No active users found")
            return

        print(f"✅ Using user: {user.email}")

        # Generate JWT token
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        # Set Authorization header
        headers = {
            'Authorization': f'Bearer {access_token}',
            'HTTP_HOST': 'localhost'
        }

        # Test goal creation
        goal_data = {
            'title': 'Test Goal',
            'description': 'This is a test goal',
            'type': 'monthly',
            'target': 5,
            'current': 0,
            'progress': 0,
            'status': 'active'
        }

        response = client.post('/api/v1/coaching/goals', goal_data, content_type='application/json', **headers)
        print(f"Response status: {response.status_code}")
        print(f"Response content: {response.content.decode()}")

        if response.status_code == 201:
            print("✅ Goal creation successful!")
        else:
            print(f"❌ Goal creation failed with status {response.status_code}")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    test_goal_creation()
