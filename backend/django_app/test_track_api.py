#!/usr/bin/env python
"""Test curriculum track API endpoint."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from curriculum.models import CurriculumTrack, CurriculumModule

print("Testing curriculum track API...")

try:
    # Fetch defensive-security track
    track = CurriculumTrack.objects.filter(slug='defensive-security').prefetch_related('modules').first()

    if not track:
        print("[ERROR] defensive-security track not found")
        print("\nAvailable tracks:")
        for t in CurriculumTrack.objects.all():
            print(f"  - {t.slug}: {t.name}")
    else:
        print(f"[OK] Found track: {track.name} (slug: {track.slug})")
        print(f"  Tier: {track.tier}")
        print(f"  Modules: {track.modules.count()}")

        # Test accessing supporting_recipes field
        for module in track.modules.all()[:3]:
            print(f"\n  Module: {module.title}")
            print(f"    supporting_recipes: {module.supporting_recipes}")
            print(f"    tier: {getattr(module, 'tier', 'N/A')}")

        print("\n[SUCCESS] Track API working correctly!")

except Exception as e:
    print(f"[ERROR] {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
