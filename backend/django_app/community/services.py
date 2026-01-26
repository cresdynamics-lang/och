"""
Community module services.
Business logic for auto-posting achievements, TalentScope integration, etc.
"""
import logging
from typing import Optional
from django.db import transaction
from django.utils import timezone

from .models import Post, UniversityMembership, UserCommunityStats

logger = logging.getLogger(__name__)


class AchievementPostService:
    """
    Service for automatically creating achievement posts when users
    complete missions, advance Circles, earn badges, or gain certifications.
    """
    
    ACHIEVEMENT_TEMPLATES = {
        'circle_advance': {
            'title': '🎉 Advanced to Circle {circle_level}!',
            'content': 'Just leveled up to Circle {circle_level} - Phase {phase}! {custom_message}',
            'icon': '🔵',
        },
        'phase_complete': {
            'title': '✅ Completed Phase {phase} of Circle {circle_level}',
            'content': 'Successfully completed Phase {phase} in Circle {circle_level}. Onward to the next challenge! {custom_message}',
            'icon': '✅',
        },
        'mission_complete': {
            'title': '🎯 Mission Complete: {mission_name}',
            'content': 'Completed the {mission_name} mission with a score of {score}! {custom_message}',
            'icon': '🎯',
        },
        'badge_earned': {
            'title': '🏆 Earned the {badge_name} Badge!',
            'content': 'Just unlocked the {badge_name} badge! {badge_description} {custom_message}',
            'icon': '🏆',
        },
        'certification': {
            'title': '📜 Certified: {certification_name}',
            'content': 'Earned the {certification_name} certification! {custom_message}',
            'icon': '📜',
        },
        'portfolio_item': {
            'title': '📁 Added to Portfolio: {item_title}',
            'content': 'Just added a new {item_type} to my portfolio: {item_title}. {custom_message}',
            'icon': '📁',
        },
        'competition_win': {
            'title': '🥇 Placed #{placement} in {competition_name}!',
            'content': 'Achieved #{placement} place in the {competition_name} competition! {custom_message}',
            'icon': '🥇',
        },
    }
    
    @classmethod
    def create_achievement_post(
        cls,
        user,
        achievement_type: str,
        achievement_data: dict,
        visibility: str = 'university',
        custom_message: str = '',
        auto_post: bool = True
    ) -> Optional[Post]:
        """
        Create an achievement post for a user.
        
        Args:
            user: The user who earned the achievement
            achievement_type: Type of achievement (circle_advance, mission_complete, etc.)
            achievement_data: Dict with achievement details
            visibility: 'university' or 'global'
            custom_message: Optional custom message from the user
            auto_post: If True, post immediately. If False, save as draft.
        
        Returns:
            Created Post object or None if creation fails
        """
        try:
            template = cls.ACHIEVEMENT_TEMPLATES.get(achievement_type)
            if not template:
                logger.warning(f"Unknown achievement type: {achievement_type}")
                return None
            
            # Get user's primary university
            membership = UniversityMembership.objects.filter(
                user=user,
                is_primary=True,
                status='active'
            ).select_related('university').first()
            
            # Format title and content
            format_data = {**achievement_data, 'custom_message': custom_message}
            title = template['title'].format(**format_data)
            content = template['content'].format(**format_data)
            
            # Create achievement data payload
            achievement_payload = {
                'type': achievement_type,
                'icon': template.get('icon', '🎉'),
                **achievement_data
            }
            
            with transaction.atomic():
                post = Post.objects.create(
                    author=user,
                    university=membership.university if membership else None,
                    post_type='achievement',
                    title=title,
                    content=content,
                    visibility=visibility,
                    status='published' if auto_post else 'draft',
                    achievement_type=achievement_type,
                    achievement_data=achievement_payload,
                    published_at=timezone.now() if auto_post else None
                )
                
                # Update user stats
                if auto_post:
                    stats, _ = UserCommunityStats.objects.get_or_create(user=user)
                    stats.total_posts = (stats.total_posts or 0) + 1
                    stats.last_post_at = timezone.now()
                    stats.last_activity_at = timezone.now()
                    stats.save(update_fields=['total_posts', 'last_post_at', 'last_activity_at'])
                
                logger.info(f"Created achievement post {post.id} for user {user.id}: {achievement_type}")
                return post
                
        except Exception as e:
            logger.exception(f"Failed to create achievement post: {e}")
            return None
    
    @classmethod
    def create_circle_advance_post(
        cls,
        user,
        circle_level: int,
        phase: int,
        custom_message: str = ''
    ) -> Optional[Post]:
        """Convenience method for Circle advancement posts."""
        return cls.create_achievement_post(
            user=user,
            achievement_type='circle_advance',
            achievement_data={
                'circle_level': circle_level,
                'phase': phase,
            },
            visibility='global' if circle_level >= 3 else 'university',
            custom_message=custom_message
        )
    
    @classmethod
    def create_mission_complete_post(
        cls,
        user,
        mission_id: str,
        mission_name: str,
        score: int,
        mission_type: str = '',
        custom_message: str = ''
    ) -> Optional[Post]:
        """Convenience method for mission completion posts."""
        return cls.create_achievement_post(
            user=user,
            achievement_type='mission_complete',
            achievement_data={
                'mission_id': mission_id,
                'mission_name': mission_name,
                'score': score,
                'mission_type': mission_type,
            },
            visibility='global' if score >= 900 else 'university',
            custom_message=custom_message
        )
    
    @classmethod
    def create_badge_earned_post(
        cls,
        user,
        badge_id: str,
        badge_name: str,
        badge_description: str = '',
        badge_icon_url: str = '',
        badge_rarity: str = 'common',
        custom_message: str = ''
    ) -> Optional[Post]:
        """Convenience method for badge earned posts."""
        return cls.create_achievement_post(
            user=user,
            achievement_type='badge_earned',
            achievement_data={
                'badge_id': badge_id,
                'badge_name': badge_name,
                'badge_description': badge_description,
                'icon_url': badge_icon_url,
                'rarity': badge_rarity,
            },
            visibility='global' if badge_rarity in ['legendary', 'epic'] else 'university',
            custom_message=custom_message
        )


class TalentScopeEventEmitter:
    """
    Service for emitting community activity events to TalentScope.
    These events become behavioral signals for talent analytics.
    """
    
    EVENT_TYPES = {
        'post_created': 'community.post.created',
        'comment_created': 'community.comment.created',
        'reaction_given': 'community.reaction.given',
        'reaction_received': 'community.reaction.received',
        'event_registered': 'community.event.registered',
        'event_attended': 'community.event.attended',
        'competition_participated': 'community.competition.participated',
        'competition_placed': 'community.competition.placed',
        'badge_earned': 'community.badge.earned',
        'streak_maintained': 'community.streak.maintained',
    }
    
    # Event weights for engagement scoring
    EVENT_WEIGHTS = {
        'post_created': 10,
        'comment_created': 3,
        'reaction_given': 1,
        'reaction_received': 2,
        'event_registered': 5,
        'event_attended': 15,
        'competition_participated': 20,
        'competition_placed': 50,  # Multiplied by placement (1st=50, 2nd=30, 3rd=20)
        'badge_earned': 10,
        'streak_maintained': 5,
    }
    
    @classmethod
    def emit_event(
        cls,
        event_type: str,
        user_id: str,
        metadata: dict = None
    ) -> bool:
        """
        Emit a community event to TalentScope.
        
        In production, this would publish to a message queue (Redis, RabbitMQ)
        or call the TalentScope API. For now, we log the event.
        
        Args:
            event_type: Type of event from EVENT_TYPES
            user_id: ID of the user who performed the action
            metadata: Additional event data
        
        Returns:
            True if event was emitted successfully
        """
        try:
            event_name = cls.EVENT_TYPES.get(event_type, f'community.{event_type}')
            weight = cls.EVENT_WEIGHTS.get(event_type, 1)
            
            event_payload = {
                'event': event_name,
                'user_id': str(user_id),
                'weight': weight,
                'timestamp': timezone.now().isoformat(),
                'metadata': metadata or {}
            }
            
            # TODO: In production, publish to message queue or call TalentScope API
            # For now, log the event
            logger.info(f"TalentScope event: {event_payload}")
            
            # Could also store locally for batch processing
            # TalentScopeEventLog.objects.create(**event_payload)
            
            return True
            
        except Exception as e:
            logger.exception(f"Failed to emit TalentScope event: {e}")
            return False
    
    @classmethod
    def emit_post_created(cls, user_id: str, post_id: str, post_type: str) -> bool:
        return cls.emit_event('post_created', user_id, {
            'post_id': post_id,
            'post_type': post_type
        })
    
    @classmethod
    def emit_comment_created(cls, user_id: str, post_id: str, comment_id: str) -> bool:
        return cls.emit_event('comment_created', user_id, {
            'post_id': post_id,
            'comment_id': comment_id
        })
    
    @classmethod
    def emit_reaction_given(cls, user_id: str, target_type: str, target_id: str, reaction_type: str) -> bool:
        return cls.emit_event('reaction_given', user_id, {
            'target_type': target_type,
            'target_id': target_id,
            'reaction_type': reaction_type
        })
    
    @classmethod
    def emit_event_participation(cls, user_id: str, event_id: str, event_type: str, action: str) -> bool:
        event_key = 'event_attended' if action == 'attended' else 'event_registered'
        return cls.emit_event(event_key, user_id, {
            'event_id': event_id,
            'event_type': event_type,
            'action': action
        })
    
    @classmethod
    def emit_competition_result(cls, user_id: str, competition_id: str, placement: int) -> bool:
        return cls.emit_event('competition_placed', user_id, {
            'competition_id': competition_id,
            'placement': placement,
            'weight_multiplier': max(1, 5 - placement)  # 1st place = 5x, 2nd = 4x, etc.
        })


class UniversityAutoMapper:
    """
    Service for auto-mapping users to universities based on email domain.
    """
    
    @classmethod
    def map_user(cls, user) -> Optional[UniversityMembership]:
        """
        Auto-map a user to their university based on email domain.
        This is also available as a signal in signals.py.
        """
        from .signals import auto_map_user_to_university
        return auto_map_user_to_university(user)
    
    @classmethod
    def check_domain(cls, email: str) -> Optional[dict]:
        """
        Check if an email domain matches any university.
        
        Returns:
            Dict with university info if match found, None otherwise
        """
        from .models import UniversityDomain
        
        if not email or '@' not in email:
            return None
        
        domain = email.split('@')[1].lower()
        
        try:
            uni_domain = UniversityDomain.objects.select_related('university').get(
                domain=domain,
                is_active=True
            )
            return {
                'university_id': str(uni_domain.university.id),
                'university_name': uni_domain.university.name,
                'university_code': uni_domain.university.code,
                'domain': domain,
                'default_role': uni_domain.default_role,
                'auto_verify': uni_domain.auto_verify
            }
        except UniversityDomain.DoesNotExist:
            return None

