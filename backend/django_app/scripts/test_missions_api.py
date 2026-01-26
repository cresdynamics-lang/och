#!/usr/bin/env python
"""
Test script for missions API endpoints
Usage: python scripts/test_missions_api.py
"""
import os
import sys
import requests
import json
from datetime import datetime

# API configuration
DJANGO_API_URL = 'http://localhost:8000'
FASTAPI_API_URL = 'http://localhost:8001'

def test_missions_api():
    """Test the missions API endpoints"""
    print("🧪 Testing OCH Missions API Endpoints")
    print("=" * 50)

    # Test 1: Check if Django server is running
    try:
        response = requests.get(f'{DJANGO_API_URL}/api/v1/health/', timeout=5)
        if response.status_code == 200:
            print("✅ Django API server is running")
        else:
            print(f"⚠️  Django API returned status {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to Django API: {e}")
        print("   Make sure Django server is running on port 8000")
        return False

    # Test 2: Check mission list endpoint (without auth - should fail gracefully)
    try:
        response = requests.get(f'{DJANGO_API_URL}/api/v1/student/missions', timeout=5)
        if response.status_code == 401:
            print("✅ Mission list endpoint requires authentication (expected)")
        else:
            print(f"⚠️  Unexpected response for mission list: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot access mission list endpoint: {e}")

    # Test 3: Check mission funnel endpoint (without auth - should fail gracefully)
    try:
        response = requests.get(f'{DJANGO_API_URL}/api/v1/student/missions/funnel', timeout=5)
        if response.status_code == 401:
            print("✅ Mission funnel endpoint requires authentication (expected)")
        else:
            print(f"⚠️  Unexpected response for mission funnel: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot access mission funnel endpoint: {e}")

    print("\n📋 API Endpoint Status:")
    print(f"   GET /api/v1/student/missions - Requires Auth")
    print(f"   GET /api/v1/student/missions/funnel - Requires Auth")
    print(f"   GET /api/v1/student/missions/{{id}} - Requires Auth")
    print(f"   POST /api/v1/student/missions/{{id}}/submit - Requires Auth")
    print(f"   POST /api/v1/student/missions/{{id}}/draft - Requires Auth")

    print("\n🔐 Authentication Required:")
    print("   To test with authentication, you'll need to:")
    print("   1. Start the Django server: python manage.py runserver")
    print("   2. Login via frontend to get JWT token")
    print("   3. Or use the test user credentials from dev_setup.sh")

    print("\n🌱 To seed mission data:")
    print("   python scripts/seed_missions.py")

    return True

def check_database_setup():
    """Check if database has mission data"""
    print("\n💾 Database Check:")

    try:
        import django
        sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ongoza_cyber_hub.settings')
        django.setup()

        from missions.models import Mission

        mission_count = Mission.objects.count()
        if mission_count > 0:
            print(f"✅ Database has {mission_count} missions")

            # Show sample missions
            sample_missions = Mission.objects.all()[:3]
            print("   Sample missions:")
            for mission in sample_missions:
                print(f"     - {mission.code}: {mission.title} ({mission.difficulty})")

        else:
            print("⚠️  No missions found in database")
            print("   Run: python scripts/seed_missions.py")

    except ImportError:
        print("❌ Cannot import Django - virtual environment may not be activated")
    except Exception as e:
        print(f"❌ Database check failed: {e}")

if __name__ == '__main__':
    try:
        test_missions_api()
        check_database_setup()
    except KeyboardInterrupt:
        print("\n⏹️  Test interrupted")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
