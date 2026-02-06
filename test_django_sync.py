#!/usr/bin/env python3
"""Test Django profiler sync endpoint"""
import requests
import json

# Configuration
DJANGO_URL = "http://localhost:8000"
FASTAPI_URL = "http://localhost:8001"

# Login credentials
EMAIL = "student@example.com"
PASSWORD = "student123"

def main():
    print("\n" + "="*80)
    print("Testing Django Profiler Sync Endpoint")
    print("="*80 + "\n")
    
    # Step 1: Login
    print("[1] Logging in...")
    login_response = requests.post(
        f"{DJANGO_URL}/api/v1/auth/login",
        json={"email": EMAIL, "password": PASSWORD}
    )
    
    if login_response.status_code != 200:
        print(f"[FAIL] Login failed: {login_response.status_code}")
        return
    
    token = login_response.json()["access_token"]
    user_id = login_response.json()["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"[PASS] Logged in successfully")
    print(f"[INFO] User ID: {user_id}\n")
    
    # Step 2: Test sync endpoint
    print("[2] Testing profiler sync endpoint...")
    sync_data = {
        "user_id": str(user_id),
        "session_id": "test-session-123",
        "completed_at": "2026-02-05T20:00:00Z",
        "primary_track": "defender",
        "recommendations": [
            {
                "track_key": "defender",
                "score": 85,
                "confidence_level": "high"
            },
            {
                "track_key": "grc",
                "score": 72,
                "confidence_level": "medium"
            }
        ]
    }
    
    sync_response = requests.post(
        f"{DJANGO_URL}/api/v1/profiler/sync-fastapi",
        json=sync_data,
        headers=headers
    )
    
    print(f"[INFO] Status Code: {sync_response.status_code}")
    print(f"[INFO] Response:")
    print(json.dumps(sync_response.json(), indent=2))
    
    if sync_response.status_code == 200:
        print("\n[SUCCESS] Sync endpoint works! ✅\n")
    else:
        print(f"\n[FAIL] Sync failed with status {sync_response.status_code}")
        print(f"[ERROR] {sync_response.text}\n")

if __name__ == "__main__":
    main()
