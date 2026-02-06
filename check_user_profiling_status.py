#!/usr/bin/env python3
"""Check user profiling status"""
import requests

DJANGO_URL = "http://localhost:8000"
EMAIL = "student@example.com"
PASSWORD = "student123"

print("\n" + "="*80)
print("Checking User Profiling Status")
print("="*80 + "\n")

# Login
login_response = requests.post(
    f"{DJANGO_URL}/api/v1/auth/login",
    json={"email": EMAIL, "password": PASSWORD}
)

if login_response.status_code != 200:
    print(f"[FAIL] Login failed")
    exit(1)

user_data = login_response.json()["user"]
token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

print(f"User ID: {user_data['id']}")
print(f"Email: {user_data['email']}")
print(f"Profiling Complete: {user_data.get('profiling_complete', 'Not set')}")
print(f"User Type: {user_data.get('user_type', 'Not set')}")
print()

# Check foundations status
print("Checking foundations status...")
foundations_response = requests.get(
    f"{DJANGO_URL}/api/v1/foundations/status",
    headers=headers
)
print(f"Status: {foundations_response.status_code}")
print(f"Response: {foundations_response.json()}")
print()

# Check FastAPI profiling status
print("Checking FastAPI profiling status...")
fastapi_response = requests.get(
    f"http://localhost:8001/api/v1/profiling/status",
    headers=headers
)
print(f"Status: {fastapi_response.status_code}")
print(f"Response: {fastapi_response.json()}")
print()
