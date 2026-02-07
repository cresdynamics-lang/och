#!/usr/bin/env python3
"""Fix duplicate defensive-security tracks."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from programs.models import Track
from curriculum.models import CurriculumTrack

print("=" * 80)
print("FIXING DUPLICATE TRACKS")
print("=" * 80)

# Find the curriculum track
ct = CurriculumTrack.objects.get(code='DEFENSIVE_SECURITY')
print(f"\n[1] DEFENSIVE_SECURITY curriculum track is linked to program_track_id:")
print(f"    {ct.program_track_id}")

# Get the linked track
linked_track = Track.objects.get(id=ct.program_track_id)
print(f"\n[2] Linked program track:")
print(f"    Name: {linked_track.name}")
print(f"    Key: {linked_track.key}")
print(f"    Created: {linked_track.created_at}")

# Find duplicates
duplicates = Track.objects.filter(key='defensive-security').exclude(id=ct.program_track_id)
print(f"\n[3] Found {duplicates.count()} duplicate track(s) with same key")

if duplicates.exists():
    for dup in duplicates:
        print(f"\n    Deleting duplicate:")
        print(f"      ID: {dup.id}")
        print(f"      Name: {dup.name}")
        print(f"      Created: {dup.created_at}")

        # Check if any curriculum tracks link to this
        linked_ct = CurriculumTrack.objects.filter(program_track_id=dup.id).first()
        if linked_ct:
            print(f"      WARNING: This track is linked to curriculum track '{linked_ct.code}'")
            print(f"      Unlinking curriculum track first...")
            linked_ct.program_track_id = linked_track.id
            linked_ct.save()
            print(f"      [OK] Relinked to correct track")

        dup.delete()
        print(f"      [OK] Deleted")
else:
    print("    No duplicates found")

print("\n" + "=" * 80)
print("DONE")
print("=" * 80)
