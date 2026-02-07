#!/usr/bin/env python3
"""Check student's assigned track after profiling"""
import requests
import json

DJANGO_URL = "http://localhost:8000"
FASTAPI_URL = "http://localhost:8001"
EMAIL = "student@example.com"
PASSWORD = "student123"

print("\n" + "="*80)
print("Checking Student Track Assignment")
print("="*80 + "\n")

# Login
login_response = requests.post(
    f"{DJANGO_URL}/api/v1/auth/login",
    json={"email": EMAIL, "password": PASSWORD}
)
token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 1. Check FastAPI profiling results
print("[1/3] FastAPI Profiling Results:")
try:
    fastapi_results = requests.get(
        f"{FASTAPI_URL}/api/v1/profiling/status",
        headers=headers
    )
    if fastapi_results.status_code == 200:
        data = fastapi_results.json()
        print(f"  Session ID: {data.get('session_id')}")
        print(f"  Completed: {data.get('completed')}")
        
        # Get full results
        if data.get('session_id'):
            results_response = requests.get(
                f"{FASTAPI_URL}/api/v1/profiling/session/{data['session_id']}/results",
                headers=headers
            )
            if results_response.status_code == 200:
                results = results_response.json()
                print(f"\n  Primary Track:")
                if results.get('primary_track'):
                    print(f"    key: {results['primary_track'].get('key')}")
                    print(f"    track_key: {results['primary_track'].get('track_key')}")
                    print(f"    name: {results['primary_track'].get('name')}")
                else:
                    print("    [NO primary_track in results]")
    else:
        print(f"  Error: {fastapi_results.status_code}")
except Exception as e:
    print(f"  Error: {e}")

# 2. Check Django student profile
print("\n[2/3] Django Student Profile:")
try:
    profile_response = requests.get(
        f"{DJANGO_URL}/api/v1/student/profile",
        headers=headers
    )
    if profile_response.status_code == 200:
        profile = profile_response.json()
        print(f"  profiled_track: {profile.get('profiled_track')}")
        print(f"  enrollment: {profile.get('enrollment')}")
    else:
        print(f"  Error: {profile_response.status_code}")
        print(f"  Response: {profile_response.text[:200]}")
except Exception as e:
    print(f"  Error: {e}")

# 3. Check Django user
print("\n[3/3] Django User Fields:")
try:
    me_response = requests.get(
        f"{DJANGO_URL}/api/v1/auth/me",
        headers=headers
    )
    if me_response.status_code == 200:
        user_data = me_response.json()['user']
        print(f"  profiling_complete: {user_data.get('profiling_complete')}")
        print(f"  (Note: Track info is in /student/profile, not /auth/me)")
except Exception as e:
    print(f"  Error: {e}")

print("\n" + "="*80)
