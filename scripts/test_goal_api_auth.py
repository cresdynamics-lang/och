#!/usr/bin/env python3
"""
Test goal API endpoint with authentication
"""
import os
import sys
import django
from django.test import Client
from django.contrib.auth import get_user_model

# Setup Django
sys.path.insert(0, '/home/fidel-ochieng-ogola/FIDEL OGOLA PERSONAL FOLDER/Ongoza /ongozaCyberHub/backend/django_app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def test_goal_api_with_auth():
    # Create a test client
    client = Client()

    # Get or create a test user
    user, created = User.objects.get_or_create(
        email='test@test.com',
        defaults={
            'username': 'testuserauth',
            'first_name': 'Test',
            'last_name': 'Auth',
            'account_status': 'active',
            'email_verified': True,
            'is_active': True,
        }
    )

    if created:
        user.set_password('testpass123')
        user.save()

    print(f"Using user: {user.email} (created: {created})")

    # Generate JWT token
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)

    # Test goal creation
    goal_data = {
        'title': 'Test Goal with Auth',
        'description': 'Testing goal creation with JWT authentication',
        'type': 'monthly',
        'target': 5,
        'current': 0,
        'progress': 0,
        'status': 'active'
    }

    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json',
        'HTTP_HOST': 'localhost'
    }

    try:
        response = client.post('/api/v1/coaching/goals', goal_data, **headers)
        print(f"Response status: {response.status_code}")

        if response.status_code == 201:
            response_data = response.json()
            print("✅ Goal creation successful!")
            print(f"   Goal ID: {response_data.get('id')}")
            print(f"   Title: {response_data.get('title')}")

            # Clean up - delete the goal
            goal_id = response_data.get('id')
            if goal_id:
                delete_response = client.delete(f'/api/v1/coaching/goals/{goal_id}', **headers)
                print(f"   Cleanup status: {delete_response.status_code}")

        else:
            print(f"❌ Goal creation failed with status {response.status_code}")
            print(f"Response content: {response.content.decode()}")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    test_goal_api_with_auth()
