#!/usr/bin/env python3
"""
One-time sync: Copy existing programs.Track entries -> curriculum.CurriculumTrack entries.
After this, the signal handler will keep them in sync automatically.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection, transaction
from django.utils.text import slugify
from programs.models import Track
from curriculum.models import CurriculumTrack

print("="*80)
print(" SYNCING programs.Track -> curriculum.CurriculumTrack")
print("="*80)

# Step 1: Remove manually-seeded curriculum tracks that have no program_track_id
print("\n[1] Cleaning up manually-seeded curriculum tracks...")
with connection.cursor() as cursor:
    cursor.execute("DELETE FROM curriculum_tracks WHERE program_track_id IS NULL")
    orphaned_count = cursor.rowcount
if orphaned_count:
    print(f"    Removed {orphaned_count} manually-seeded tracks (no program_track_id)")
else:
    print("    No orphaned tracks to clean up")

# Step 2: Sync each programs.Track -> curriculum.CurriculumTrack
print("\n[2] Syncing Director-created tracks to curriculum...")
program_tracks = Track.objects.all().select_related('program')
synced = 0
updated = 0

for pt in program_tracks:
    code = pt.key.upper().replace('-', '_').replace(' ', '_')[:50]
    slug = slugify(pt.key)[:50] or slugify(pt.name)[:50]
    
    # Determine tier
    tier = 6 if pt.track_type == 'cross_track' else 2
    
    # Determine icon/color from name
    name_lower = pt.name.lower()
    icon = ('shield' if 'defend' in name_lower else
            'target' if 'offensive' in name_lower else
            'scale' if 'grc' in name_lower or 'governance' in name_lower else
            'lightbulb' if 'innovation' in name_lower else
            'users' if 'leadership' in name_lower else
            'book')
    color = ('blue' if 'defend' in name_lower else
             'red' if 'offensive' in name_lower else
             'green' if 'grc' in name_lower or 'governance' in name_lower else
             'purple' if 'innovation' in name_lower else
             'gold' if 'leadership' in name_lower else
             'indigo')
    
    # Count missions
    mission_count = len(pt.missions) if isinstance(pt.missions, list) else 0
    
    # Check if already exists
    existing = CurriculumTrack.objects.filter(program_track_id=pt.id).first()
    if existing:
        existing.name = pt.name
        existing.title = pt.name
        existing.description = pt.description
        existing.tier = tier
        existing.mission_count = mission_count
        existing.save()
        updated += 1
        print(f"    [*] Updated: {pt.name} (code={existing.code})")
        continue
    
    # Check by code
    existing_by_code = CurriculumTrack.objects.filter(code=code).first()
    if existing_by_code:
        existing_by_code.program_track_id = pt.id
        existing_by_code.name = pt.name
        existing_by_code.title = pt.name
        existing_by_code.description = pt.description
        existing_by_code.tier = tier
        existing_by_code.mission_count = mission_count
        existing_by_code.save()
        updated += 1
        print(f"    [*] Linked: {pt.name} (code={code})")
        continue
    
    # Ensure slug is unique
    base_slug = slug
    counter = 1
    while CurriculumTrack.objects.filter(slug=slug).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    # Need to use raw SQL because of the 'level' column in DB not in model
    # (or use the model now that we added level field)
    try:
        CurriculumTrack.objects.create(
            code=code,
            slug=slug,
            name=pt.name,
            title=pt.name,
            description=pt.description,
            level='beginner',
            tier=tier,
            program_track_id=pt.id,
            icon=icon,
            color=color,
            mission_count=mission_count,
            is_active=True,
        )
        synced += 1
        print(f"    [+] Created: {pt.name} (code={code}, slug={slug}, program={pt.program.name})")
    except Exception as e:
        print(f"    [!] Failed to create {pt.name}: {e}")
        # Fallback to raw SQL for the level column issue
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO curriculum_tracks 
                    (id, code, slug, name, title, description, level, tier, 
                     program_track_id, icon, color, mission_count, module_count, 
                     lesson_count, is_active, created_at, updated_at, 
                     thumbnail_url, order_number, estimated_duration_weeks)
                    VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, 0, 0, true, NOW(), NOW(), '', 0, NULL)
                    ON CONFLICT (code) DO UPDATE SET
                        program_track_id = EXCLUDED.program_track_id,
                        name = EXCLUDED.name,
                        title = EXCLUDED.title,
                        description = EXCLUDED.description
                """, [code, slug, pt.name, pt.name, pt.description, 
                      'beginner', tier, str(pt.id), icon, color, mission_count])
            synced += 1
            print(f"    [+] Created (SQL): {pt.name} (code={code})")
        except Exception as e2:
            print(f"    [!!] SQL fallback also failed: {e2}")

# Step 3: Verify
print(f"\n[3] Summary:")
print(f"    - Programs tracks: {program_tracks.count()}")
print(f"    - Synced (new): {synced}")
print(f"    - Updated (existing): {updated}")
print(f"    - Total curriculum tracks: {CurriculumTrack.objects.count()}")

print(f"\n[4] Final curriculum_tracks state:")
for ct in CurriculumTrack.objects.filter(is_active=True).order_by('tier', 'order_number'):
    linked = "[LINKED]" if ct.program_track_id else "[ORPHAN]"
    print(f"    {linked} Tier {ct.tier}: {ct.name} (code={ct.code})")

print("\n" + "="*80)
print(" [DONE] From now on, the signal handler will auto-sync new tracks.")
print(" When a Director creates a track, it auto-appears in student curriculum.")
print("="*80)
