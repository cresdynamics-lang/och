"""
Management command to aggregate and update community leaderboards.

Run daily/weekly via cron or Celery beat:
    python manage.py aggregate_leaderboards --period=daily
    python manage.py aggregate_leaderboards --period=weekly
    python manage.py aggregate_leaderboards --period=monthly
"""
import logging
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Count, Sum, F, Q
from django.utils import timezone

from community.models import (
    Leaderboard, UserCommunityStats, University, UniversityMembership,
    Post, Comment, Reaction, EventParticipant, UserBadge
)
from users.models import User

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Aggregate and update community leaderboards for students and universities'

    def add_arguments(self, parser):
        parser.add_argument(
            '--period',
            type=str,
            choices=['daily', 'weekly', 'monthly', 'all'],
            default='daily',
            help='Period to aggregate: daily, weekly, monthly, or all'
        )
        parser.add_argument(
            '--university',
            type=str,
            help='Specific university code to aggregate (default: all)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes'
        )

    def handle(self, *args, **options):
        period = options['period']
        university_code = options.get('university')
        dry_run = options['dry_run']

        self.stdout.write(f"Starting leaderboard aggregation for period: {period}")
        
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN - no changes will be made"))

        now = timezone.now()
        
        # Define time windows
        periods = {
            'daily': (now - timedelta(days=1), now),
            'weekly': (now - timedelta(days=7), now),
            'monthly': (now - timedelta(days=30), now),
        }

        if period == 'all':
            for p in ['daily', 'weekly', 'monthly']:
                self._aggregate_period(p, periods[p], university_code, dry_run)
        else:
            self._aggregate_period(period, periods[period], university_code, dry_run)

        # Update global and university ranks
        if not dry_run:
            self._update_user_ranks(university_code)
            self._update_university_scores()

        self.stdout.write(self.style.SUCCESS("Leaderboard aggregation complete"))

    def _aggregate_period(self, period_name: str, time_range: tuple, university_code: str, dry_run: bool):
        """Aggregate scores for a specific time period."""
        start_time, end_time = time_range
        self.stdout.write(f"  Aggregating {period_name}: {start_time} to {end_time}")

        # Get universities to process
        universities = University.objects.filter(is_active=True)
        if university_code:
            universities = universities.filter(code=university_code)

        # Process each university
        for university in universities:
            self._aggregate_university_leaderboard(
                university, period_name, start_time, end_time, dry_run
            )

        # Process global leaderboard
        self._aggregate_global_leaderboard(period_name, start_time, end_time, dry_run)

    def _calculate_user_score(self, user_id, start_time, end_time, university_id=None) -> dict:
        """
        Calculate engagement score for a user within a time period.
        
        Scoring weights:
        - Posts: 10 points each
        - Comments: 3 points each
        - Reactions given: 1 point each
        - Reactions received: 2 points each
        - Events participated: 15 points each
        - Badges earned: 20 points each
        """
        # Posts created
        post_query = Post.objects.filter(
            author_id=user_id,
            created_at__range=(start_time, end_time),
            status='published'
        )
        if university_id:
            post_query = post_query.filter(university_id=university_id)
        posts_count = post_query.count()

        # Comments made
        comments_count = Comment.objects.filter(
            author_id=user_id,
            created_at__range=(start_time, end_time),
            is_deleted=False
        ).count()

        # Reactions given
        reactions_given = Reaction.objects.filter(
            user_id=user_id,
            created_at__range=(start_time, end_time)
        ).count()

        # Reactions received (on user's posts and comments)
        reactions_on_posts = Reaction.objects.filter(
            post__author_id=user_id,
            created_at__range=(start_time, end_time)
        ).count()
        reactions_on_comments = Reaction.objects.filter(
            comment__author_id=user_id,
            created_at__range=(start_time, end_time)
        ).count()
        reactions_received = reactions_on_posts + reactions_on_comments

        # Events participated
        events_count = EventParticipant.objects.filter(
            user_id=user_id,
            registered_at__range=(start_time, end_time),
            status__in=['registered', 'attended', 'completed']
        ).count()

        # Badges earned
        badges_count = UserBadge.objects.filter(
            user_id=user_id,
            earned_at__range=(start_time, end_time)
        ).count()

        # Calculate total score
        score = (
            posts_count * 10 +
            comments_count * 3 +
            reactions_given * 1 +
            reactions_received * 2 +
            events_count * 15 +
            badges_count * 20
        )

        return {
            'score': score,
            'posts': posts_count,
            'comments': comments_count,
            'reactions_given': reactions_given,
            'reactions_received': reactions_received,
            'events_participated': events_count,
            'badges_earned': badges_count
        }

    def _aggregate_university_leaderboard(
        self, university, period_name: str, start_time, end_time, dry_run: bool
    ):
        """Aggregate leaderboard for a specific university."""
        self.stdout.write(f"    Processing university: {university.code}")

        # Get all active members of this university
        memberships = UniversityMembership.objects.filter(
            university=university,
            status='active'
        ).select_related('user')

        rankings = []
        for membership in memberships:
            user = membership.user
            scores = self._calculate_user_score(
                user.id, start_time, end_time, university.id
            )
            if scores['score'] > 0:
                rankings.append({
                    'user_id': str(user.id),
                    'university_id': str(university.id),
                    **scores
                })

        # Sort by score descending
        rankings.sort(key=lambda x: x['score'], reverse=True)

        # Add rank to each entry
        for i, entry in enumerate(rankings, 1):
            entry['rank'] = i

        if dry_run:
            self.stdout.write(f"      Would create leaderboard with {len(rankings)} entries")
            return

        # Create or update leaderboard snapshot
        with transaction.atomic():
            # Mark previous leaderboards as not current
            Leaderboard.objects.filter(
                scope='university',
                university=university,
                leaderboard_type=period_name,
                is_current=True
            ).update(is_current=False)

            # Create new leaderboard
            Leaderboard.objects.create(
                leaderboard_type=period_name,
                scope='university',
                university=university,
                period_start=start_time,
                period_end=end_time,
                rankings=rankings,
                is_current=True
            )

        self.stdout.write(f"      Created leaderboard with {len(rankings)} entries")

    def _aggregate_global_leaderboard(self, period_name: str, start_time, end_time, dry_run: bool):
        """Aggregate global leaderboard across all universities."""
        self.stdout.write("    Processing global leaderboard")

        # Get all active users with university memberships
        users = User.objects.filter(
            university_memberships__status='active',
            is_active=True
        ).distinct()

        rankings = []
        for user in users:
            # Get user's primary university
            primary_membership = UniversityMembership.objects.filter(
                user=user,
                is_primary=True,
                status='active'
            ).select_related('university').first()

            university_id = str(primary_membership.university.id) if primary_membership else None

            scores = self._calculate_user_score(user.id, start_time, end_time)
            if scores['score'] > 0:
                rankings.append({
                    'user_id': str(user.id),
                    'university_id': university_id,
                    **scores
                })

        # Sort by score descending
        rankings.sort(key=lambda x: x['score'], reverse=True)

        # Add rank to each entry (top 100)
        for i, entry in enumerate(rankings[:100], 1):
            entry['rank'] = i

        if dry_run:
            self.stdout.write(f"      Would create global leaderboard with {len(rankings[:100])} entries")
            return

        # Create or update leaderboard snapshot
        with transaction.atomic():
            Leaderboard.objects.filter(
                scope='global',
                leaderboard_type=period_name,
                is_current=True
            ).update(is_current=False)

            Leaderboard.objects.create(
                leaderboard_type=period_name,
                scope='global',
                period_start=start_time,
                period_end=end_time,
                rankings=rankings[:100],
                is_current=True
            )

        self.stdout.write(f"      Created global leaderboard with {len(rankings[:100])} entries")

    def _update_user_ranks(self, university_code: str = None):
        """Update user community stats with current ranks."""
        self.stdout.write("  Updating user ranks...")

        # Get current global leaderboard
        global_lb = Leaderboard.objects.filter(
            scope='global',
            leaderboard_type='weekly',
            is_current=True
        ).first()

        if global_lb:
            for entry in global_lb.rankings:
                UserCommunityStats.objects.filter(
                    user_id=entry['user_id']
                ).update(global_rank=entry['rank'])

        # Update university ranks
        universities = University.objects.filter(is_active=True)
        if university_code:
            universities = universities.filter(code=university_code)

        for university in universities:
            uni_lb = Leaderboard.objects.filter(
                scope='university',
                university=university,
                leaderboard_type='weekly',
                is_current=True
            ).first()

            if uni_lb:
                for entry in uni_lb.rankings:
                    UserCommunityStats.objects.filter(
                        user_id=entry['user_id']
                    ).update(university_rank=entry['rank'])

    def _update_university_scores(self):
        """Update university engagement scores based on aggregate activity."""
        self.stdout.write("  Updating university engagement scores...")

        universities = University.objects.filter(is_active=True)

        for university in universities:
            # Calculate engagement score based on:
            # - Active members (members who posted/commented this week)
            # - Total posts this week
            # - Average reactions per post
            # - Event participation rate

            week_ago = timezone.now() - timedelta(days=7)

            active_members = Post.objects.filter(
                university=university,
                created_at__gte=week_ago,
                status='published'
            ).values('author').distinct().count()

            total_posts = Post.objects.filter(
                university=university,
                created_at__gte=week_ago,
                status='published'
            ).count()

            # Engagement score formula
            engagement_score = Decimal(
                (active_members * 10) +
                (total_posts * 2) +
                (university.member_count * 0.1 if university.member_count else 0)
            )

            University.objects.filter(id=university.id).update(
                engagement_score=engagement_score,
                active_student_count=active_members
            )

        self.stdout.write("  University scores updated")

