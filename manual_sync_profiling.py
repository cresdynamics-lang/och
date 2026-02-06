#!/usr/bin/env python3
"""Manually sync profiling completion from FastAPI to Django"""
import requests
import json

DJANGO_URL = "http://localhost:8000"
FASTAPI_URL = "http://localhost:8001"
EMAIL = "student@example.com"
PASSWORD = "student123"

print("\n" + "="*80)
print("Manually Syncing Profiling Completion")
print("="*80 + "\n")

# Step 1: Login
print("[1] Logging in...")
login_response = requests.post(
    f"{DJANGO_URL}/api/v1/auth/login",
    json={"email": EMAIL, "password": PASSWORD}
)

if login_response.status_code != 200:
    print(f"[FAIL] Login failed")
    exit(1)

user_data = login_response.json()["user"]
user_id = user_data["id"]
token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print(f"[PASS] Logged in as user {user_id}\n")

# Step 2: Get FastAPI profiling status
print("[2] Getting FastAPI profiling results...")
fastapi_status = requests.get(
    f"{FASTAPI_URL}/api/v1/profiling/status",
    headers=headers
)

if fastapi_status.status_code != 200:
    print(f"[FAIL] Failed to get FastAPI status")
    exit(1)

fastapi_data = fastapi_status.json()
session_id = fastapi_data.get("session_id")
completed_at = fastapi_data.get("completed_at")
completed = fastapi_data.get("completed")

print(f"[INFO] Session ID: {session_id}")
print(f"[INFO] Completed: {completed}")
print(f"[INFO] Completed At: {completed_at}\n")

if not completed:
    print("[WARN] Profiling not completed in FastAPI yet!")
    exit(0)

# Step 3: Get profiling results
print("[3] Getting full profiling results...")
results_response = requests.get(
    f"{FASTAPI_URL}/api/v1/profiling/session/{session_id}/results",
    headers=headers
)

if results_response.status_code != 200:
    print(f"[FAIL] Failed to get results: {results_response.status_code}")
    print(results_response.text)
    exit(1)

results = results_response.json()
primary_track = results.get("primary_track", {}).get("key", "defender")
recommendations = results.get("recommendations", [])

print(f"[INFO] Primary Track: {primary_track}")
print(f"[INFO] Recommendations: {len(recommendations)} tracks\n")

# Step 4: Sync with Django
print("[4] Syncing with Django...")
sync_data = {
    "user_id": str(user_id),
    "session_id": session_id,
    "completed_at": completed_at,
    "primary_track": primary_track,
    "recommendations": [
        {
            "track_key": rec.get("track_key"),
            "score": rec.get("score", 0),
            "confidence_level": rec.get("confidence_level", "medium")
        }
        for rec in recommendations
    ]
}

sync_response = requests.post(
    f"{DJANGO_URL}/api/v1/profiler/sync-fastapi",
    json=sync_data,
    headers=headers
)

print(f"[INFO] Sync Status: {sync_response.status_code}")
print(f"[INFO] Sync Response:")
print(json.dumps(sync_response.json(), indent=2))

if sync_response.status_code == 200:
    print("\n[SUCCESS] Profiling synced successfully! ✅")
    print("\nNow refresh your browser and you should be able to access foundations!\n")
else:
    print(f"\n[FAIL] Sync failed: {sync_response.text}\n")
