#!/usr/bin/env python3
"""
Test script to verify track assignment and curriculum filtering works correctly.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from users.models import User
from programs.models import Track
from curriculum.models import CurriculumTrack
from django.db.models import Q

print("=" * 80)
print("TRACK ASSIGNMENT & CURRICULUM FILTERING TEST")
print("=" * 80)

# Test user
user = User.objects.get(id=3)
print(f"\n[1] User: {user.email}")
print(f"    track_key: {user.track_key}")
print(f"    profiling_complete: {user.profiling_complete}")
print(f"    foundations_complete: {user.foundations_complete}")

# Simulate what happens when profiler sets track_key
print("\n[2] Simulating profiler setting track_key to 'defensive-security'...")
user.track_key = 'defensive-security'
user.save()
print(f"    [OK] User track_key set to: {user.track_key}")

# Find program track
program_track = Track.objects.filter(key=user.track_key, track_type='primary').first()
print(f"\n[3] Finding program track with key '{user.track_key}'...")
if program_track:
    print(f"    [OK] Found: {program_track.name} (id={program_track.id})")
else:
    print(f"    [ERROR] No program track found with key '{user.track_key}'")
    print(f"    Available tracks:")
    for t in Track.objects.filter(track_type='primary'):
        print(f"      - {t.key} -> {t.name}")

# Find curriculum tracks user should see
print(f"\n[4] Finding curriculum tracks user should see...")
if program_track:
    curriculum_tracks = CurriculumTrack.objects.filter(
        Q(program_track_id=program_track.id) | Q(tier=6),
        is_active=True
    ).order_by('tier', 'order_number')

    print(f"    Query: CurriculumTrack WHERE (program_track_id={program_track.id} OR tier=6) AND is_active=True")
    print(f"    Found {curriculum_tracks.count()} tracks:")
    for ct in curriculum_tracks:
        track_type = "User's Track" if ct.program_track_id == program_track.id else "Cross-Track"
        print(f"      [{track_type}] {ct.code} - {ct.name} (tier={ct.tier})")
else:
    print(f"    [ERROR] Cannot find curriculum tracks - no program track found")

# Verify the curriculum tracks are properly linked
print(f"\n[5] Verifying curriculum track linkage...")
all_curriculum_tracks = CurriculumTrack.objects.filter(is_active=True)
print(f"    Total active curriculum tracks: {all_curriculum_tracks.count()}")
for ct in all_curriculum_tracks:
    linked = "[LINKED]" if ct.program_track_id else "[NOT LINKED]"
    print(f"      {ct.code:25} tier={ct.tier} {linked}")

print("\n" + "=" * 80)
print("TEST COMPLETE")
print("=" * 80)

# Summary
print("\n[SUMMARY]")
print(f"   User track_key: {user.track_key}")
print(f"   Program track found: {'Yes' if program_track else 'No'}")
if program_track:
    print(f"   Curriculum tracks visible to user: {curriculum_tracks.count()}")
    print(f"     - User's primary track: {curriculum_tracks.filter(tier=2).count()}")
    print(f"     - Cross-track programs: {curriculum_tracks.filter(tier=6).count()}")

print("\n[RESULT] If user sees 1 primary track + N cross-tracks, filtering works correctly!")
print("[RESULT] If user sees ALL tracks, filtering is broken.\n")
