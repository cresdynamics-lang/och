#!/usr/bin/env python3
"""Test script to check question options format"""
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
    print("Testing Question Options Format")
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
    headers = {"Authorization": f"Bearer {token}"}
    print(f"[PASS] Logged in successfully\n")
    
    # Step 2: Get enhanced questions
    print("[2] Fetching enhanced questions...")
    questions_response = requests.get(
        f"{FASTAPI_URL}/api/v1/profiling/enhanced/questions",
        headers=headers
    )
    
    if questions_response.status_code != 200:
        print(f"[FAIL] Failed to get questions: {questions_response.status_code}")
        print(questions_response.text)
        return
    
    questions_data = questions_response.json()
    print(f"[PASS] Got questions\n")
    
    # Step 3: Find difficulty_selection question
    print("[3] Looking for difficulty_selection question...")
    difficulty_questions = questions_data["questions"].get("difficulty_selection", [])
    
    if not difficulty_questions:
        print("[FAIL] No difficulty_selection questions found!")
        return
    
    difficulty_q = difficulty_questions[0]
    print(f"[PASS] Found difficulty question: {difficulty_q['id']}\n")
    
    # Step 4: Display the question and options
    print("="*80)
    print(f"Question ID: {difficulty_q['id']}")
    print(f"Question: {difficulty_q['question']}")
    print(f"\nOptions:")
    print("="*80)
    
    for i, opt in enumerate(difficulty_q['options'], 1):
        print(f"\n  Option {i}:")
        print(f"    value: '{opt['value']}'")
        print(f"    text:  '{opt['text']}'")
    
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"Total options: {len(difficulty_q['options'])}")
    print(f"Option values: {[opt['value'] for opt in difficulty_q['options']]}")
    print("\n")

if __name__ == "__main__":
    main()
