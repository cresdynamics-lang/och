"""
Signals for programs app.
Auto-syncs programs.Track -> curriculum.CurriculumTrack when Directors create/update tracks.
This ensures Director-created tracks appear in the student curriculum automatically.
"""
import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils.text import slugify

logger = logging.getLogger(__name__)


@receiver(post_save, sender='programs.Track')
def sync_track_to_curriculum(sender, instance, created, **kwargs):
    """
    When a Director creates or updates a programs.Track,
    automatically create/update the corresponding curriculum.CurriculumTrack.
    
    This bridges the Director management system with the student-facing curriculum.
    """
    try:
        from curriculum.models import CurriculumTrack
        
        # Determine tier based on track_type
        tier = 2  # Default: Tier 2 (Beginner Tracks)
        if instance.track_type == 'cross_track':
            tier = 6  # Tier 6 (Cross-Track Programs)
        
        # Generate a unique code from the track key
        code = instance.key.upper().replace('-', '_').replace(' ', '_')[:50]
        slug = slugify(instance.key)[:50] or slugify(instance.name)[:50]
        
        # Determine level from tier
        level = 'beginner'
        
        # Count missions linked to this track
        mission_count = len(instance.missions) if isinstance(instance.missions, list) else 0
        
        # Try to find existing curriculum track linked to this programs.Track
        curriculum_track = CurriculumTrack.objects.filter(
            program_track_id=instance.id
        ).first()
        
        if curriculum_track:
            # Update existing curriculum track
            curriculum_track.name = instance.name
            curriculum_track.title = instance.name
            curriculum_track.description = instance.description
            curriculum_track.tier = tier
            curriculum_track.mission_count = mission_count
            curriculum_track.save()
            logger.info(
                f"[SYNC] Updated CurriculumTrack '{curriculum_track.name}' "
                f"(code={curriculum_track.code}) from programs.Track '{instance.name}'"
            )
        else:
            # Also check by code to avoid duplicates
            existing_by_code = CurriculumTrack.objects.filter(code=code).first()
            if existing_by_code:
                # Link existing curriculum track to this programs.Track
                existing_by_code.program_track_id = instance.id
                existing_by_code.name = instance.name
                existing_by_code.title = instance.name
                existing_by_code.description = instance.description
                existing_by_code.tier = tier
                existing_by_code.mission_count = mission_count
                existing_by_code.save()
                logger.info(
                    f"[SYNC] Linked existing CurriculumTrack '{existing_by_code.name}' "
                    f"to programs.Track '{instance.name}'"
                )
            else:
                # Ensure slug is unique
                base_slug = slug
                counter = 1
                while CurriculumTrack.objects.filter(slug=slug).exists():
                    slug = f"{base_slug}-{counter}"
                    counter += 1
                
                # Create new curriculum track
                CurriculumTrack.objects.create(
                    code=code,
                    slug=slug,
                    name=instance.name,
                    title=instance.name,
                    description=instance.description,
                    level=level,
                    tier=tier,
                    program_track_id=instance.id,
                    icon='shield' if 'defend' in instance.name.lower() else
                          'target' if 'offensive' in instance.name.lower() else
                          'scale' if 'grc' in instance.name.lower() or 'governance' in instance.name.lower() else
                          'lightbulb' if 'innovation' in instance.name.lower() else
                          'users' if 'leadership' in instance.name.lower() else
                          'book',
                    color='blue' if 'defend' in instance.name.lower() else
                          'red' if 'offensive' in instance.name.lower() else
                          'green' if 'grc' in instance.name.lower() or 'governance' in instance.name.lower() else
                          'purple' if 'innovation' in instance.name.lower() else
                          'gold' if 'leadership' in instance.name.lower() else
                          'indigo',
                    mission_count=mission_count,
                    is_active=True,
                )
                logger.info(
                    f"[SYNC] Created CurriculumTrack '{instance.name}' "
                    f"(code={code}, slug={slug}) from programs.Track"
                )
    except Exception as e:
        logger.error(f"[SYNC] Failed to sync Track -> CurriculumTrack: {e}", exc_info=True)


@receiver(post_delete, sender='programs.Track')
def deactivate_curriculum_track_on_delete(sender, instance, **kwargs):
    """
    When a Director deletes a programs.Track,
    deactivate (don't delete) the corresponding CurriculumTrack.
    Students may have progress data linked to it.
    """
    try:
        from curriculum.models import CurriculumTrack
        
        updated = CurriculumTrack.objects.filter(
            program_track_id=instance.id
        ).update(is_active=False)
        
        if updated:
            logger.info(
                f"[SYNC] Deactivated CurriculumTrack for deleted programs.Track '{instance.name}'"
            )
    except Exception as e:
        logger.error(f"[SYNC] Failed to deactivate CurriculumTrack on delete: {e}", exc_info=True)
