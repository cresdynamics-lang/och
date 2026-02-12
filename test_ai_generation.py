#!/usr/bin/env python
"""
Test AI generation for profiling
"""
import sys
from pathlib import Path

# Add backend paths
fastapi_path = Path(__file__).parent / 'backend' / 'fastapi_app'
sys.path.insert(0, str(fastapi_path))

# Load environment
from dotenv import load_dotenv
env_path = Path(__file__).parent / 'backend' / 'django_app' / '.env'
load_dotenv(env_path)

print("=" * 70)
print("AI PROFILER GENERATION TEST")
print("=" * 70)

try:
    from services.gpt_profiler import gpt_profiler_service
    print("\n[1/4] GPT Service Import: OK")
    print(f"  - Client connected: {'Yes' if gpt_profiler_service.client else 'No'}")
except Exception as e:
    print(f"\n[1/4] GPT Service Import: FAILED")
    print(f"  - Error: {e}")
    sys.exit(1)

# Test data
sample_responses = [
    {'question': 'What motivates you in cybersecurity?', 'answer': 'Protecting systems', 'category': 'identity_values'},
    {'question': 'Preferred work style?', 'answer': 'Team collaboration', 'category': 'work_style'}
]

sample_tracks = [
    {'key': 'defender', 'name': 'Defender', 'description': 'Protect systems and detect threats'},
    {'key': 'offensive', 'name': 'Offensive', 'description': 'Ethical hacking and penetration testing'}
]

sample_scores = {
    'defender': 75.0,
    'offensive': 45.0
}

print("\n[2/4] Testing analyze_and_recommend...")
try:
    result = gpt_profiler_service.analyze_and_recommend(
        responses=sample_responses,
        available_tracks=sample_tracks,
        user_reflection=None
    )
    print(f"  - Result type: {type(result)}")
    print(f"  - Recommended track: {result.get('recommended_track', 'N/A')}")
    print(f"  - Has reasoning: {'Yes' if result.get('reasoning') else 'No'}")
except Exception as e:
    print(f"  - FAILED: {e}")
    import traceback
    traceback.print_exc()

print("\n[3/4] Testing generate_personalized_descriptions...")
try:
    result = gpt_profiler_service.generate_personalized_descriptions(
        responses=sample_responses,
        tracks=sample_tracks,
        scores=sample_scores
    )
    print(f"  - Result type: {type(result)}")
    print(f"  - Descriptions generated: {len(result) if result else 0}")
    if result:
        for key, desc in result.items():
            print(f"  - {key}: {desc[:60]}...")
except Exception as e:
    print(f"  - FAILED: {e}")
    import traceback
    traceback.print_exc()

print("\n[4/4] Testing generate_future_you_persona...")
try:
    result = gpt_profiler_service.generate_future_you_persona(
        responses=sample_responses,
        recommended_track='defender',
        track_info={'name': 'Defender', 'description': 'Protect systems and detect threats'}
    )
    print(f"  - Result type: {type(result)}")
    print(f"  - Persona name: {result.get('name', 'N/A')}")
    print(f"  - Archetype: {result.get('archetype', 'N/A')}")
    print(f"  - Skills count: {len(result.get('projected_skills', []))}")
    print(f"  - Strengths count: {len(result.get('strengths', []))}")
    print(f"  - Has career vision: {'Yes' if result.get('career_vision') else 'No'}")
    print(f"  - Confidence: {result.get('confidence', 0)}")
except Exception as e:
    print(f"  - FAILED: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
print("TEST COMPLETE")
print("=" * 70)
