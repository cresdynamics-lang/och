#!/usr/bin/env python
"""Query leadership tracks and user profile data from Django database."""
import os
import sys
import django

# Setup Django environment - use the correct path
django_path = '/home/caleb/kiptoo/och/ongozaCyberHub/backend/django_app'
sys.path.insert(0, django_path)
os.chdir(django_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import models
from curriculum.models import CurriculumTrack
from users.models import User
from student_dashboard.models import StudentDashboardCache
from profiler.models import ProfilerSession

print("=" * 80)
print("1. ALL CurriculumTrack objects with 'leadership' in code or name (is_active=True)")
print("=" * 80)

leadership_tracks = CurriculumTrack.objects.filter(
    is_active=True
).filter(
    models.Q(code__icontains='leadership') | models.Q(name__icontains='leadership')
)

if not leadership_tracks.exists():
    # Try without the is_active filter first to see if any exist
    all_leadership = CurriculumTrack.objects.filter(
        models.Q(code__icontains='leadership') | models.Q(name__icontains='leadership')
    )
    print(f"Found {all_leadership.count()} leadership tracks (all statuses):")
    for track in all_leadership:
        print(f"  - Code: {track.code}, Name: {track.name}, Tier: {track.tier}, Level: {track.level}, is_active: {track.is_active}")
else:
    print(f"Found {leadership_tracks.count()} active leadership tracks:")
    for track in leadership_tracks.values('code', 'name', 'tier', 'level', 'is_active'):
        print(f"  - Code: {track['code']}, Name: {track['name']}, Tier: {track['tier']}, Level: {track['level']}, is_active: {track['is_active']}")

print("\n" + "=" * 80)
print("2. Test users - Sampling all users")
print("=" * 80)

# Sample some users to see what exists
all_users = User.objects.values('id', 'email', 'first_name', 'last_name').order_by('id')[:20]
print(f"First 20 users in database:")
for user in all_users:
    print(f"  - {user['email']} ({user['first_name']} {user['last_name']})")

print(f"\n(Total {User.objects.count()} users in database)")

# Now try to find a user and check their profile
# Use the first user (could be admin or test user)
first_user = User.objects.first()
if first_user:
    print(f"\nQuerying profile for: {first_user.email}")
    try:
        dashboard_cache = StudentDashboardCache.objects.get(user=first_user)
        print(f"  StudentDashboardCache.recommended_track: {dashboard_cache.recommended_track}")
        print(f"  Matches 'leadership': {dashboard_cache.recommended_track == 'leadership' if dashboard_cache.recommended_track else False}")
    except StudentDashboardCache.DoesNotExist:
        print("  StudentDashboardCache not found for this user")
        
    try:
        profiler_session = ProfilerSession.objects.filter(user=first_user).first()
        if profiler_session:
            print(f"  ProfilerSession.recommended_track: {profiler_session.recommended_track}")
            print(f"  ProfilerSession.recommended_track_id: {profiler_session.recommended_track_id}")
        else:
            print("  ProfilerSession not found for this user")
    except Exception as e:
        print(f"  Error querying ProfilerSession: {e}")

print("\n" + "=" * 80)
print("3. ALL beginner-tier leadership tracks (tier=2)")
print("=" * 80)

beginner_leadership = CurriculumTrack.objects.filter(
    tier=2
).filter(
    models.Q(code__icontains='leadership') | models.Q(name__icontains='leadership')
)

if beginner_leadership.exists():
    print(f"Found {beginner_leadership.count()} beginner-tier leadership tracks:")
    for track in beginner_leadership.values('id', 'code', 'name', 'tier', 'level', 'is_active'):
        print(f"  - ID: {track['id']}, Code: {track['code']}, Name: {track['name']}, Tier: {track['tier']}, Level: {track['level']}, is_active: {track['is_active']}")
else:
    print("Found 0 beginner-tier leadership tracks")
    # Show what tier=2 tracks exist
    tier2_tracks = CurriculumTrack.objects.filter(tier=2)
    print(f"\nNote: Found {tier2_tracks.count()} total tier=2 tracks:")
    for track in tier2_tracks.values('code', 'name')[:10]:
        print(f"  - {track['code']}: {track['name']}")

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"Total CurriculumTrack records: {CurriculumTrack.objects.count()}")
print(f"Active CurriculumTrack records: {CurriculumTrack.objects.filter(is_active=True).count()}")
print(f"Total User records: {User.objects.count()}")
