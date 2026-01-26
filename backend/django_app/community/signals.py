"""
Community module signals for updating stats, triggering notifications,
and cache invalidation for performance optimization.
"""
import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import F
from django.utils import timezone

from .models import (
    Post, Comment, Reaction, UserCommunityStats,
    UniversityMembership, University, UserBadge, UniversityDomain
)
from users.models import User
from .cache import FeedCacheManager

logger = logging.getLogger(__name__)


@receiver(post_save, sender=UniversityMembership)
def update_university_member_count(sender, instance, created, **kwargs):
    """Update university member count when membership changes."""
    if created or instance.status == 'active':
        university = instance.university
        university.member_count = university.memberships.filter(status='active').count()
        university.save(update_fields=['member_count'])


@receiver(post_delete, sender=UniversityMembership)
def decrease_university_member_count(sender, instance, **kwargs):
    """Decrease university member count on membership deletion."""
    university = instance.university
    university.member_count = university.memberships.filter(status='active').count()
    university.save(update_fields=['member_count'])


@receiver(post_save, sender=Reaction)
def update_reaction_stats(sender, instance, created, **kwargs):
    """Update user stats when reaction is created."""
    if created:
        # Update the person giving the reaction
        stats, _ = UserCommunityStats.objects.get_or_create(user=instance.user)
        stats.total_reactions_given = F('total_reactions_given') + 1
        stats.last_activity_at = timezone.now()
        stats.save(update_fields=['total_reactions_given', 'last_activity_at'])
        
        # Update the person receiving the reaction
        target_user = None
        if instance.post:
            target_user = instance.post.author
        elif instance.comment:
            target_user = instance.comment.author
        
        if target_user and target_user != instance.user:
            target_stats, _ = UserCommunityStats.objects.get_or_create(user=target_user)
            target_stats.total_reactions_received = F('total_reactions_received') + 1
            target_stats.save(update_fields=['total_reactions_received'])


@receiver(post_save, sender=UserBadge)
def update_badge_stats(sender, instance, created, **kwargs):
    """Update user stats when badge is earned."""
    if created:
        stats, _ = UserCommunityStats.objects.get_or_create(user=instance.user)
        stats.total_badges = F('total_badges') + 1
        stats.total_points = F('total_points') + instance.badge.points
        stats.save(update_fields=['total_badges', 'total_points'])


# ============================================================
# AUTO-MAPPING WORKFLOW: Map students to universities by email
# ============================================================

def extract_email_domain(email: str) -> str | None:
    """Extract domain from email address."""
    if not email or '@' not in email:
        return None
    return email.split('@')[1].lower()


def find_university_by_domain(domain: str):
    """
    Find university matching an email domain.
    Returns (University, UniversityDomain) or (None, None).
    """
    try:
        university_domain = UniversityDomain.objects.select_related('university').get(
            domain=domain,
            is_active=True
        )
        return university_domain.university, university_domain
    except UniversityDomain.DoesNotExist:
        return None, None


def auto_map_user_to_university(user: User) -> UniversityMembership | None:
    """
    Automatically map a user to their university based on email domain.
    
    Returns:
        UniversityMembership if mapping successful, None otherwise.
    """
    if not user.email:
        logger.debug(f"User {user.id} has no email, skipping auto-map")
        return None
    
    domain = extract_email_domain(user.email)
    if not domain:
        logger.debug(f"Could not extract domain from {user.email}")
        return None
    
    university, university_domain = find_university_by_domain(domain)
    if not university:
        logger.debug(f"No university found for domain {domain}")
        return None
    
    # Check if user already has membership at this university
    existing = UniversityMembership.objects.filter(
        user=user,
        university=university
    ).first()
    
    if existing:
        logger.debug(f"User {user.id} already has membership at {university.code}")
        return existing
    
    # Create new membership
    membership = UniversityMembership.objects.create(
        user=user,
        university=university,
        role=university_domain.default_role,
        status='active' if university_domain.auto_verify else 'pending',
        mapped_method='email_domain',
        is_primary=True,
        auto_mapped=True,
        verified_at=timezone.now() if university_domain.auto_verify else None
    )
    
    logger.info(f"Auto-mapped user {user.id} to university {university.code}")
    return membership


@receiver(post_save, sender=User)
def auto_map_user_on_create(sender, instance, created, **kwargs):
    """
    Auto-map user to university when account is created.
    Also triggers for updates in case email was changed.
    """
    if not instance.email:
        return
    
    try:
        # Check if user already has a primary university
        has_primary = UniversityMembership.objects.filter(
            user=instance,
            is_primary=True
        ).exists()
        
        if has_primary:
            return
        
        # Try to auto-map
        auto_map_user_to_university(instance)
    except Exception as e:
        # Handle case where community_university_memberships table doesn't exist yet
        # This can happen if migrations haven't been run
        # Import ProgrammingError to catch database errors specifically
        from django.db.utils import ProgrammingError, OperationalError
        if isinstance(e, (ProgrammingError, OperationalError)):
            logger.debug(f"UniversityMembership table not available yet (migrations pending): {e}")
        else:
            logger.warning(f"Could not auto-map user to university: {e}")
        return


# ============================================================
# POST AND COMMENT STAT UPDATES
# ============================================================

@receiver(post_save, sender=Post)
def update_post_stats(sender, instance, created, **kwargs):
    """Update user and university stats when post is created."""
    if created and instance.status == 'published':
        # Update user community stats
        stats, _ = UserCommunityStats.objects.get_or_create(user=instance.author)
        stats.total_posts = F('total_posts') + 1
        stats.last_activity_at = timezone.now()
        stats.save(update_fields=['total_posts', 'last_activity_at'])
        
        # Update university post count
        if instance.university:
            instance.university.post_count = F('post_count') + 1
            instance.university.save(update_fields=['post_count'])
    
    # Invalidate feed caches
    try:
        FeedCacheManager.invalidate_post(str(instance.id))
        if instance.university_id:
            FeedCacheManager.invalidate_university_feed(str(instance.university_id))
        FeedCacheManager.invalidate_global_feed()
    except Exception as e:
        logger.warning(f"Cache invalidation failed for post {instance.id}: {e}")


@receiver(post_save, sender=Comment)
def update_comment_stats(sender, instance, created, **kwargs):
    """Update user stats when comment is created."""
    if created:
        stats, _ = UserCommunityStats.objects.get_or_create(user=instance.author)
        stats.total_comments = F('total_comments') + 1
        stats.last_activity_at = timezone.now()
        stats.save(update_fields=['total_comments', 'last_activity_at'])
    
    # Invalidate post cache when comment is added
    try:
        if instance.post_id:
            FeedCacheManager.invalidate_post(str(instance.post_id))
    except Exception as e:
        logger.warning(f"Cache invalidation failed for comment on post {instance.post_id}: {e}")


# ============================================================
# CACHE INVALIDATION SIGNALS
# ============================================================

@receiver(post_delete, sender=Post)
def invalidate_post_cache_on_delete(sender, instance, **kwargs):
    """Invalidate caches when post is deleted."""
    try:
        FeedCacheManager.invalidate_post(str(instance.id))
        if instance.university_id:
            FeedCacheManager.invalidate_university_feed(str(instance.university_id))
        FeedCacheManager.invalidate_global_feed()
    except Exception as e:
        logger.warning(f"Cache invalidation failed on post delete {instance.id}: {e}")


@receiver(post_save, sender=Reaction)
def invalidate_cache_on_reaction(sender, instance, created, **kwargs):
    """Invalidate post cache when reaction is added."""
    if created:
        try:
            if instance.post_id:
                FeedCacheManager.invalidate_post(str(instance.post_id))
        except Exception as e:
            logger.warning(f"Cache invalidation failed for reaction: {e}")

