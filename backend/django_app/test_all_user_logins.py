#!/usr/bin/env python
"""
Test login functionality for all user types.
Verifies that login endpoints work correctly for all roles.
"""
import os
import sys
import django
import requests
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from users.models import UserRole

User = get_user_model()

API_BASE = 'http://localhost:8000/api/v1'

def test_login(email, password, expected_status=200):
    """Test login for a user."""
    url = f'{API_BASE}/auth/login/'
    data = {
        'email': email,
        'password': password,
        'device_fingerprint': 'test-device'
    }
    
    try:
        response = requests.post(url, json=data, timeout=5)
        status = response.status_code
        
        if status == expected_status:
            if status == 200:
                result = response.json()
                return True, f"✅ Login successful - Token received"
            else:
                return True, f"✅ Expected {status} - {response.json().get('detail', 'No detail')}"
        else:
            error_detail = response.json().get('detail', 'Unknown error') if response.content else 'No response body'
            return False, f"❌ Unexpected status {status} - {error_detail}"
    except requests.exceptions.RequestException as e:
        return False, f"❌ Request failed: {str(e)}"

def main():
    print("=" * 70)
    print("LOGIN SYSTEM VERIFICATION FOR ALL USER TYPES")
    print("=" * 70)
    print()
    
    # Get all active users with their roles
    users = User.objects.filter(is_active=True).select_related()
    
    print(f"Found {users.count()} active users in database")
    print()
    
    # Test users by role
    test_cases = [
        ('admin@test.com', 'testpass123', 'Admin'),
        ('director@test.com', 'testpass123', 'Program Director'),
        ('mentor@test.com', 'testpass123', 'Mentor'),
        ('sponsor@test.com', 'testpass123', 'Sponsor Admin'),
        ('analyst@test.com', 'testpass123', 'Analyst'),
        ('finance@test.com', 'testpass123', 'Finance Manager'),
        ('student@test.com', 'testpass123', 'Student'),
        ('student1@test.com', 'testpass123', 'Student 1'),
    ]
    
    print("Testing login for key users:")
    print("-" * 70)
    
    results = []
    for email, password, role_name in test_cases:
        user = users.filter(email=email).first()
        if not user:
            print(f"⚠️  {email} ({role_name}) - User not found")
            results.append((email, False, "User not found"))
            continue
        
        # Check user status
        if user.account_status != 'active':
            print(f"⚠️  {email} ({role_name}) - Account status: {user.account_status}")
            results.append((email, False, f"Account status: {user.account_status}"))
            continue
        
        if not user.has_usable_password():
            print(f"⚠️  {email} ({role_name}) - No password set")
            results.append((email, False, "No password set"))
            continue
        
        # Test login
        success, message = test_login(email, password)
        print(f"{message} - {email} ({role_name})")
        results.append((email, success, message))
    
    print()
    print("-" * 70)
    print("SUMMARY")
    print("-" * 70)
    
    successful = sum(1 for _, success, _ in results if success)
    total = len(results)
    
    print(f"Successful logins: {successful}/{total}")
    print()
    
    # Test Google OAuth
    print("Testing Google OAuth Initiate:")
    try:
        oauth_url = f'{API_BASE}/auth/google/initiate?role=student'
        response = requests.get(oauth_url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Google OAuth initiate working - auth_url generated")
        else:
            print(f"❌ Google OAuth initiate failed - Status {response.status_code}")
    except Exception as e:
        print(f"❌ Google OAuth test failed: {str(e)}")
    
    print()
    print("=" * 70)
    print("✅ Login system verification complete")
    print("=" * 70)

if __name__ == '__main__':
    main()
