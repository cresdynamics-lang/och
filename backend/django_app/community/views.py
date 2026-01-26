"""
Community module API views.
University-centric social layer with feeds, posts, events, and gamification.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, F, Case, When, Value, IntegerField, DecimalField
from django.utils import timezone
from django.db import transaction
from datetime import timedelta

from .models import (
    University, UniversityMembership, Post, Comment, Reaction,
    CommunityEvent, EventParticipant, Badge, UserBadge,
    Leaderboard, UserCommunityStats, PollVote, Follow, ModerationLog,
    # Advanced features
    Channel, ChannelMembership, StudySquad, SquadMembership,
    CommunityReputation, AISummary, CollabRoom, CollabRoomParticipant,
    CommunityContribution, EnterpriseCohort
)
from .serializers import (
    UniversitySerializer, UniversityListSerializer, UniversityMembershipSerializer,
    PostSerializer, PostListSerializer, PostCreateSerializer,
    CommentSerializer, CommentCreateSerializer, ReactionSerializer,
    CommunityEventSerializer, CommunityEventListSerializer, EventParticipantSerializer,
    BadgeSerializer, UserBadgeSerializer, LeaderboardSerializer,
    UserCommunityStatsSerializer, FollowSerializer, ModerationLogSerializer,
    FeedQuerySerializer, SearchQuerySerializer, UserMiniSerializer,
    # Advanced features
    ChannelSerializer, ChannelListSerializer, ChannelCreateSerializer, ChannelMembershipSerializer,
    StudySquadSerializer, StudySquadCreateSerializer, SquadMembershipSerializer,
    CommunityReputationSerializer, CommunityReputationPublicSerializer,
    AISummarySerializer, AISummaryRequestSerializer,
    CollabRoomSerializer, CollabRoomListSerializer, CollabRoomCreateSerializer, CollabRoomParticipantSerializer,
    CommunityContributionSerializer, EnterpriseCohortSerializer, AwardPointsSerializer
)


class IsAuthenticatedOrReadOnly(permissions.BasePermission):
    """Allow read access to anyone, write access to authenticated users."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated


class IsFacultyOrAdmin(permissions.BasePermission):
    """Check if user is faculty/staff or admin for moderation."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # Check for admin role
        if request.user.is_staff or request.user.is_superuser:
            return True
        # Check for faculty membership
        return UniversityMembership.objects.filter(
            user=request.user,
            role__in=['faculty', 'staff', 'admin'],
            status='active'
        ).exists()


class UniversityViewSet(viewsets.ModelViewSet):
    """
    University management and listing.
    """
    queryset = University.objects.filter(is_active=True)
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UniversityListSerializer
        return UniversitySerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by country
        country = self.request.query_params.get('country')
        if country:
            queryset = queryset.filter(country=country)
        
        # Filter by verified
        verified = self.request.query_params.get('verified')
        if verified and verified.lower() == 'true':
            queryset = queryset.filter(is_verified=True)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(short_name__icontains=search)
            )
        
        return queryset.order_by('-member_count', 'name')
    
    @action(detail=True, methods=['get'])
    def members(self, request, slug=None):
        """Get university members."""
        university = self.get_object()
        memberships = UniversityMembership.objects.filter(
            university=university,
            status='active'
        ).select_related('user')[:100]
        
        serializer = UniversityMembershipSerializer(memberships, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def feed(self, request, slug=None):
        """Get university-specific feed."""
        university = self.get_object()
        posts = Post.objects.filter(
            university=university,
            status='published'
        ).select_related('author').order_by('-is_pinned', '-created_at')[:50]
        
        serializer = PostListSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def leaderboard(self, request, slug=None):
        """Get university leaderboard."""
        university = self.get_object()
        leaderboard = Leaderboard.objects.filter(
            university=university,
            scope='university',
            is_current=True
        ).first()
        
        if leaderboard:
            serializer = LeaderboardSerializer(leaderboard)
            return Response(serializer.data)
        return Response({'rankings': []})


class UniversityMembershipViewSet(viewsets.ModelViewSet):
    """
    User's university memberships.
    """
    serializer_class = UniversityMembershipSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UniversityMembership.objects.filter(
            user=self.request.user
        ).select_related('university')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        # Update university member count
        university = serializer.instance.university
        university.member_count = university.memberships.filter(status='active').count()
        university.save(update_fields=['member_count'])
    
    @action(detail=False, methods=['post'])
    def auto_join(self, request):
        """Auto-join university based on email domain."""
        email_domain = request.user.email.split('@')[-1]
        
        university = University.objects.filter(
            email_domains__contains=[email_domain],
            is_active=True
        ).first()
        
        if not university:
            return Response(
                {'error': 'No university found for your email domain'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        membership, created = UniversityMembership.objects.get_or_create(
            user=request.user,
            university=university,
            defaults={
                'role': 'student',
                'status': 'active',
                'is_primary': True,
                'auto_mapped': True
            }
        )
        
        if created:
            # Update university member count
            university.member_count = university.memberships.filter(status='active').count()
            university.save(update_fields=['member_count'])
        
        serializer = UniversityMembershipSerializer(membership)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class FeedView(APIView):
    """
    Main feed endpoint with multiple feed types.
    
    Feed types:
    - my-university: Home university posts with pinned boost
    - global: Trending posts across all universities
    - following: Posts from followed users/tags
    - competitions: Event/competition posts only
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get personalized feed."""
        query_serializer = FeedQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        params = query_serializer.validated_data
        
        feed_type = params.get('feed_type', 'my-university')
        post_type = params.get('post_type', 'all')
        circle = params.get('circle')
        phase = params.get('phase')
        page = params.get('page', 1)
        page_size = params.get('page_size', 20)
        
        # Base queryset with prefetching for performance
        posts = Post.objects.filter(
            status='published'
        ).select_related(
            'author', 'university', 'pinned_by'
        ).prefetch_related('reactions')
        
        # Get user's primary university membership
        user_membership = UniversityMembership.objects.filter(
            user=request.user,
            is_primary=True,
            status='active'
        ).select_related('university').first()
        
        # Filter by feed type
        if feed_type in ['university', 'my-university']:
            posts = self._get_university_feed(posts, user_membership)
        elif feed_type == 'global':
            posts = self._get_global_feed(posts)
        elif feed_type == 'following':
            posts = self._get_following_feed(posts, request.user)
        elif feed_type == 'competitions':
            posts = self._get_competitions_feed(posts, user_membership)
        elif feed_type == 'achievements':
            posts = posts.filter(post_type='achievement')
        
        # Filter by post type
        if post_type and post_type != 'all':
            posts = posts.filter(post_type=post_type)
        
        # Filter by Circle/Phase (for students at similar stage)
        if circle:
            posts = posts.filter(
                achievement_data__circle_level=circle
            )
        if phase:
            posts = posts.filter(
                achievement_data__phase=phase
            )
        
        # Filter by tags
        tags = params.get('tags', [])
        if tags:
            posts = posts.filter(tags__overlap=tags)
        
        # Pagination
        offset = (page - 1) * page_size
        total_count = posts.count()
        posts = posts[offset:offset + page_size]
        
        serializer = PostListSerializer(posts, many=True, context={'request': request})
        
        return Response({
            'feed_type': feed_type,
            'posts': serializer.data,
            'page': page,
            'page_size': page_size,
            'total_count': total_count,
            'has_more': (page * page_size) < total_count,
            'user_university': {
                'id': str(user_membership.university.id) if user_membership else None,
                'name': user_membership.university.name if user_membership else None,
                'code': user_membership.university.code if user_membership else None,
            } if user_membership else None
        })
    
    def _get_university_feed(self, posts, membership):
        """
        My University feed with pinned posts boost.
        
        Order:
        1. Pinned posts (sorted by pinned_at desc)
        2. Featured posts (sorted by created_at desc)
        3. Recent posts (sorted by engagement + recency)
        """
        from django.db.models import Case, When, Value, IntegerField
        from datetime import timedelta
        
        if not membership:
            # No university - show global feed instead
            return self._get_global_feed(posts)
        
        # Filter to university posts + cross-university highlights
        posts = posts.filter(
            Q(university=membership.university) |
            Q(visibility='global', is_featured=True)
        )
        
        # Calculate time decay factor (posts older than 7 days get lower priority)
        now = timezone.now()
        seven_days_ago = now - timedelta(days=7)
        
        # Custom ordering with pinned boost
        # Priority: 1=pinned+active, 2=featured, 3=recent+engaged, 4=older
        posts = posts.annotate(
            ordering_priority=Case(
                # Pinned posts that haven't expired get top priority
                When(
                    is_pinned=True,
                    pin_expires_at__isnull=True,
                    then=Value(1)
                ),
                When(
                    is_pinned=True,
                    pin_expires_at__gt=now,
                    then=Value(1)
                ),
                # Featured posts second
                When(is_featured=True, then=Value(2)),
                # Recent posts (within 7 days) with engagement
                When(
                    created_at__gte=seven_days_ago,
                    then=Value(3)
                ),
                # Older posts
                default=Value(4),
                output_field=IntegerField()
            ),
            engagement=F('reaction_count') + F('comment_count') * 2 + F('view_count') / 10
        ).order_by(
            'ordering_priority',
            '-pinned_at',
            '-engagement',
            '-created_at'
        )
        
        return posts
    
    def _get_global_feed(self, posts):
        """
        Global feed with trending algorithm.
        
        Trending score based on:
        - Recency (exponential decay)
        - Engagement (reactions, comments, views)
        - Author reputation
        - Is from competition/event
        """
        from django.db.models import Case, When, Value, IntegerField, DecimalField
        from django.db.models.functions import Extract
        from datetime import timedelta
        
        now = timezone.now()
        one_day_ago = now - timedelta(days=1)
        three_days_ago = now - timedelta(days=3)
        
        # Only global visibility or featured posts
        posts = posts.filter(
            Q(visibility='global') | Q(is_featured=True)
        )
        
        # Calculate trending score
        # Higher weight for: recent posts, events/competitions, achievements
        posts = posts.annotate(
            recency_boost=Case(
                When(created_at__gte=one_day_ago, then=Value(3.0)),
                When(created_at__gte=three_days_ago, then=Value(2.0)),
                default=Value(1.0),
                output_field=DecimalField()
            ),
            type_boost=Case(
                When(post_type='event', then=Value(2.0)),
                When(post_type='achievement', then=Value(1.5)),
                default=Value(1.0),
                output_field=DecimalField()
            ),
            calculated_trending=(
                (F('reaction_count') * 2 + F('comment_count') * 3 + F('view_count') / 100) *
                F('recency_boost') * F('type_boost')
            )
        ).order_by(
            '-is_featured',
            '-calculated_trending',
            '-created_at'
        )
        
        return posts
    
    def _get_following_feed(self, posts, user):
        """Feed from followed users, universities, and tags."""
        followed_users = Follow.objects.filter(
            follower=user,
            follow_type='user'
        ).values_list('followed_user_id', flat=True)
        
        followed_universities = Follow.objects.filter(
            follower=user,
            follow_type='university'
        ).values_list('followed_university_id', flat=True)
        
        followed_tags = Follow.objects.filter(
            follower=user,
            follow_type='tag'
        ).values_list('followed_tag', flat=True)
        
        posts = posts.filter(
            Q(author_id__in=followed_users) |
            Q(university_id__in=followed_universities) |
            Q(tags__overlap=list(followed_tags))
        ).order_by('-created_at')
        
        return posts
    
    def _get_competitions_feed(self, posts, membership):
        """Feed of competitions and events."""
        from datetime import timedelta
        
        # Get event posts and posts with event_details
        posts = posts.filter(
            Q(post_type='event') |
            Q(event_details__is_competition=True)
        )
        
        # Prioritize upcoming events and user's university events
        if membership:
            posts = posts.annotate(
                university_boost=Case(
                    When(university=membership.university, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField()
                )
            ).order_by('-university_boost', '-created_at')
        else:
            posts = posts.order_by('-created_at')
        
        return posts


class PostViewSet(viewsets.ModelViewSet):
    """
    Post CRUD operations.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PostCreateSerializer
        if self.action == 'list':
            return PostListSerializer
        return PostSerializer
    
    def get_queryset(self):
        return Post.objects.filter(
            status__in=['published', 'draft']
        ).select_related('author', 'university')
    
    def perform_create(self, serializer):
        post = serializer.save(
            author=self.request.user,
            status='published',
            published_at=timezone.now()
        )
        
        # Update university post count
        if post.university:
            post.university.post_count = post.university.posts.filter(status='published').count()
            post.university.save(update_fields=['post_count'])
        
        # Update user stats
        stats, _ = UserCommunityStats.objects.get_or_create(user=self.request.user)
        stats.total_posts = F('total_posts') + 1
        stats.last_post_at = timezone.now()
        stats.last_activity_at = timezone.now()
        stats.save(update_fields=['total_posts', 'last_post_at', 'last_activity_at'])
    
    @action(detail=True, methods=['post'])
    def react(self, request, pk=None):
        """Add/update reaction to post."""
        post = self.get_object()
        reaction_type = request.data.get('reaction_type')
        
        if reaction_type not in dict(Reaction.REACTION_TYPES):
            return Response(
                {'error': 'Invalid reaction type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove existing reaction of same type or create new
        existing = Reaction.objects.filter(
            user=request.user,
            post=post,
            reaction_type=reaction_type
        ).first()
        
        if existing:
            existing.delete()
            created = False
        else:
            # Remove any other reaction types first
            Reaction.objects.filter(user=request.user, post=post).delete()
            Reaction.objects.create(
                user=request.user,
                post=post,
                reaction_type=reaction_type
            )
            created = True
        
        # Update post reaction count
        post.reaction_count = post.reactions.count()
        post.save(update_fields=['reaction_count'])
        
        return Response({
            'action': 'created' if created else 'removed',
            'reaction_type': reaction_type,
            'reaction_count': post.reaction_count
        })
    
    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, pk=None):
        """Get or create comments on post."""
        post = self.get_object()
        
        if request.method == 'GET':
            comments = post.comments.filter(
                parent=None,
                is_deleted=False
            ).select_related('author').order_by('-created_at')[:50]
            serializer = CommentSerializer(comments, many=True, context={'request': request})
            return Response(serializer.data)
        
        # POST - create comment
        serializer = CommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        comment = Comment.objects.create(
            post=post,
            author=request.user,
            content=serializer.validated_data['content'],
            parent=serializer.validated_data.get('parent'),
            mentions=serializer.validated_data.get('mentions', [])
        )
        
        # Update post comment count
        post.comment_count = post.comments.filter(is_deleted=False).count()
        post.save(update_fields=['comment_count'])
        
        # Update parent reply count if this is a reply
        if comment.parent:
            comment.parent.reply_count = comment.parent.replies.filter(is_deleted=False).count()
            comment.parent.save(update_fields=['reply_count'])
        
        # Update user stats
        stats, _ = UserCommunityStats.objects.get_or_create(user=request.user)
        stats.total_comments = F('total_comments') + 1
        stats.last_activity_at = timezone.now()
        stats.save(update_fields=['total_comments', 'last_activity_at'])
        
        return Response(
            CommentSerializer(comment, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        """Vote on poll post."""
        post = self.get_object()
        
        if post.post_type != 'poll':
            return Response(
                {'error': 'This is not a poll post'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if post.poll_ends_at and post.poll_ends_at < timezone.now():
            return Response(
                {'error': 'This poll has ended'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        option_id = request.data.get('option_id')
        if option_id is None or option_id >= len(post.poll_options):
            return Response(
                {'error': 'Invalid option'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if already voted (for single choice polls)
        if not post.poll_multiple_choice:
            if PollVote.objects.filter(post=post, user=request.user).exists():
                return Response(
                    {'error': 'You have already voted on this poll'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create vote
        vote, created = PollVote.objects.get_or_create(
            post=post,
            user=request.user,
            option_id=option_id
        )
        
        if created:
            # Update poll options vote count
            poll_options = post.poll_options
            poll_options[option_id]['votes'] = poll_options[option_id].get('votes', 0) + 1
            post.poll_options = poll_options
            post.save(update_fields=['poll_options'])
        
        return Response({
            'voted': True,
            'option_id': option_id,
            'poll_options': post.poll_options
        })


class CommentViewSet(viewsets.ModelViewSet):
    """
    Comment operations.
    """
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Comment.objects.filter(is_deleted=False).select_related('author', 'post')
    
    @action(detail=True, methods=['post'])
    def react(self, request, pk=None):
        """Add reaction to comment."""
        comment = self.get_object()
        reaction_type = request.data.get('reaction_type')
        
        if reaction_type not in dict(Reaction.REACTION_TYPES):
            return Response(
                {'error': 'Invalid reaction type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        existing = Reaction.objects.filter(
            user=request.user,
            comment=comment,
            reaction_type=reaction_type
        ).first()
        
        if existing:
            existing.delete()
            created = False
        else:
            Reaction.objects.filter(user=request.user, comment=comment).delete()
            Reaction.objects.create(
                user=request.user,
                comment=comment,
                reaction_type=reaction_type
            )
            created = True
        
        comment.reaction_count = comment.reactions.count()
        comment.save(update_fields=['reaction_count'])
        
        return Response({
            'action': 'created' if created else 'removed',
            'reaction_type': reaction_type,
            'reaction_count': comment.reaction_count
        })
    
    def perform_destroy(self, instance):
        """Soft delete comment."""
        instance.is_deleted = True
        instance.content = '[deleted]'
        instance.save(update_fields=['is_deleted', 'content'])
        
        # Update post comment count
        instance.post.comment_count = instance.post.comments.filter(is_deleted=False).count()
        instance.post.save(update_fields=['comment_count'])


class EventViewSet(viewsets.ModelViewSet):
    """
    Community events, competitions, hackathons.
    """
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CommunityEventListSerializer
        return CommunityEventSerializer
    
    def get_queryset(self):
        queryset = CommunityEvent.objects.select_related('created_by', 'university')
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        else:
            queryset = queryset.exclude(status__in=['draft', 'cancelled'])
        
        # Filter by event type
        event_type = self.request.query_params.get('type')
        if event_type:
            queryset = queryset.filter(event_type=event_type)
        
        # Filter by university
        university_id = self.request.query_params.get('university')
        if university_id:
            queryset = queryset.filter(university_id=university_id)
        
        return queryset.order_by('starts_at')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def register(self, request, slug=None):
        """Register for event."""
        event = self.get_object()
        
        if event.status not in ['upcoming', 'ongoing']:
            return Response(
                {'error': 'Registration is not open for this event'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if event.registration_deadline and event.registration_deadline < timezone.now():
            return Response(
                {'error': 'Registration deadline has passed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if event.max_participants and event.participant_count >= event.max_participants:
            return Response(
                {'error': 'Event is at full capacity'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        participant, created = EventParticipant.objects.get_or_create(
            event=event,
            user=request.user,
            defaults={
                'status': 'registered',
                'team_name': request.data.get('team_name'),
                'team_role': request.data.get('team_role')
            }
        )
        
        if created:
            event.participant_count = event.participants.count()
            event.save(update_fields=['participant_count'])
        
        serializer = EventParticipantSerializer(participant)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def unregister(self, request, slug=None):
        """Unregister from event."""
        event = self.get_object()
        
        deleted, _ = EventParticipant.objects.filter(
            event=event,
            user=request.user
        ).delete()
        
        if deleted:
            event.participant_count = event.participants.count()
            event.save(update_fields=['participant_count'])
            return Response({'unregistered': True})
        
        return Response(
            {'error': 'You are not registered for this event'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['get'])
    def participants(self, request, slug=None):
        """Get event participants."""
        event = self.get_object()
        participants = event.participants.select_related('user').order_by('placement', 'registered_at')
        serializer = EventParticipantSerializer(participants, many=True)
        return Response(serializer.data)


class BadgeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Badge listing and details.
    """
    queryset = Badge.objects.filter(is_active=True)
    serializer_class = BadgeSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Hide secret badges unless user has earned them
        if not self.request.user.is_staff:
            earned_badges = self.request.user.earned_badges.values_list('badge_id', flat=True)
            queryset = queryset.filter(
                Q(is_secret=False) | Q(id__in=earned_badges)
            )
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        return queryset


class UserBadgeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    User's earned badges.
    """
    serializer_class = UserBadgeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
            return UserBadge.objects.filter(user_id=user_id).select_related('badge')
        return UserBadge.objects.filter(user=self.request.user).select_related('badge')


class LeaderboardViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Leaderboard access.
    """
    serializer_class = LeaderboardSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Leaderboard.objects.filter(is_current=True)
        
        # Filter by type
        lb_type = self.request.query_params.get('type')
        if lb_type:
            queryset = queryset.filter(leaderboard_type=lb_type)
        
        # Filter by scope
        scope = self.request.query_params.get('scope')
        if scope:
            queryset = queryset.filter(scope=scope)
        
        # Filter by university
        university_id = self.request.query_params.get('university')
        if university_id:
            queryset = queryset.filter(university_id=university_id)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def my_rank(self, request):
        """Get current user's rank."""
        stats = UserCommunityStats.objects.filter(user=request.user).first()
        if stats:
            return Response({
                'global_rank': stats.global_rank,
                'university_rank': stats.university_rank,
                'total_points': stats.total_points
            })
        return Response({
            'global_rank': None,
            'university_rank': None,
            'total_points': 0
        })


class UserStatsView(APIView):
    """
    User community statistics.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, user_id=None):
        """Get user stats."""
        if user_id:
            stats = get_object_or_404(UserCommunityStats, user_id=user_id)
        else:
            stats, _ = UserCommunityStats.objects.get_or_create(user=request.user)
        
        serializer = UserCommunityStatsSerializer(stats)
        return Response(serializer.data)


class FollowViewSet(viewsets.ModelViewSet):
    """
    Follow relationships.
    """
    serializer_class = FollowSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Follow.objects.filter(follower=self.request.user)
    
    @action(detail=False, methods=['post'])
    def user(self, request):
        """Follow/unfollow user."""
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        follow, created = Follow.objects.get_or_create(
            follower=request.user,
            follow_type='user',
            followed_user_id=user_id
        )
        
        if not created:
            follow.delete()
            return Response({'following': False})
        
        return Response({'following': True}, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def university(self, request):
        """Follow/unfollow university."""
        university_id = request.data.get('university_id')
        if not university_id:
            return Response({'error': 'university_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        follow, created = Follow.objects.get_or_create(
            follower=request.user,
            follow_type='university',
            followed_university_id=university_id
        )
        
        if not created:
            follow.delete()
            return Response({'following': False})
        
        return Response({'following': True}, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def tag(self, request):
        """Follow/unfollow tag."""
        tag = request.data.get('tag')
        if not tag:
            return Response({'error': 'tag required'}, status=status.HTTP_400_BAD_REQUEST)
        
        follow, created = Follow.objects.get_or_create(
            follower=request.user,
            follow_type='tag',
            followed_tag=tag.lower()
        )
        
        if not created:
            follow.delete()
            return Response({'following': False})
        
        return Response({'following': True}, status=status.HTTP_201_CREATED)


class SearchView(APIView):
    """
    Community search.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Search across community."""
        query_serializer = SearchQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        params = query_serializer.validated_data
        
        q = params['q']
        search_type = params.get('search_type', 'posts')
        page = params.get('page', 1)
        page_size = params.get('page_size', 20)
        offset = (page - 1) * page_size
        
        results = []
        
        if search_type == 'posts':
            posts = Post.objects.filter(
                Q(title__icontains=q) | Q(content__icontains=q) | Q(tags__contains=[q]),
                status='published'
            ).select_related('author', 'university').order_by('-created_at')[offset:offset + page_size]
            results = PostListSerializer(posts, many=True, context={'request': request}).data
        
        elif search_type == 'users':
            from django.contrib.auth import get_user_model
            User = get_user_model()
            users = User.objects.filter(
                Q(first_name__icontains=q) | Q(last_name__icontains=q) | Q(email__icontains=q),
                is_active=True
            )[offset:offset + page_size]
            results = UserMiniSerializer(users, many=True).data
        
        elif search_type == 'universities':
            universities = University.objects.filter(
                Q(name__icontains=q) | Q(short_name__icontains=q),
                is_active=True
            )[offset:offset + page_size]
            results = UniversityListSerializer(universities, many=True).data
        
        elif search_type == 'events':
            events = CommunityEvent.objects.filter(
                Q(title__icontains=q) | Q(description__icontains=q),
                status__in=['upcoming', 'ongoing']
            )[offset:offset + page_size]
            results = CommunityEventListSerializer(events, many=True, context={'request': request}).data
        
        elif search_type == 'tags':
            # Get unique tags matching query
            from django.db.models import Func, Value
            posts = Post.objects.filter(
                status='published'
            ).exclude(tags=[])
            
            # Simple approach: get posts and extract matching tags
            all_tags = set()
            for post in posts[:100]:
                for tag in post.tags:
                    if q.lower() in tag.lower():
                        all_tags.add(tag)
            
            results = list(all_tags)[:page_size]
        
        return Response({
            'query': q,
            'search_type': search_type,
            'results': results,
            'page': page,
            'page_size': page_size
        })


class ModerationViewSet(viewsets.ModelViewSet):
    """
    Moderation actions (faculty/admin only).
    """
    serializer_class = ModerationLogSerializer
    permission_classes = [IsFacultyOrAdmin]
    
    def get_queryset(self):
        queryset = ModerationLog.objects.select_related('moderator', 'target_user', 'university')
        
        # Filter by university if faculty
        if not self.request.user.is_staff:
            faculty_universities = UniversityMembership.objects.filter(
                user=self.request.user,
                role__in=['faculty', 'staff', 'admin'],
                status='active'
            ).values_list('university_id', flat=True)
            queryset = queryset.filter(university_id__in=faculty_universities)
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['post'])
    def hide_post(self, request):
        """Hide a post."""
        post_id = request.data.get('post_id')
        reason = request.data.get('reason', '')
        
        post = get_object_or_404(Post, id=post_id)
        post.status = 'hidden'
        post.save(update_fields=['status'])
        
        ModerationLog.objects.create(
            moderator=request.user,
            action='hide_post',
            target_post=post,
            target_user=post.author,
            reason=reason,
            university=post.university
        )
        
        return Response({'hidden': True})
    
    @action(detail=False, methods=['post'])
    def pin_post(self, request):
        """Pin/unpin a post."""
        post_id = request.data.get('post_id')
        pin = request.data.get('pin', True)
        
        post = get_object_or_404(Post, id=post_id)
        post.is_pinned = pin
        post.save(update_fields=['is_pinned'])
        
        ModerationLog.objects.create(
            moderator=request.user,
            action='pin_post' if pin else 'unpin_post',
            target_post=post,
            reason=request.data.get('reason', ''),
            university=post.university
        )
        
        return Response({'pinned': pin})
    
    @action(detail=False, methods=['post'])
    def feature_post(self, request):
        """Feature/unfeature a post."""
        post_id = request.data.get('post_id')
        feature = request.data.get('feature', True)
        
        post = get_object_or_404(Post, id=post_id)
        post.is_featured = feature
        post.save(update_fields=['is_featured'])
        
        ModerationLog.objects.create(
            moderator=request.user,
            action='feature_post' if feature else 'unfeature_post',
            target_post=post,
            reason=request.data.get('reason', ''),
            university=post.university
        )
        
        return Response({'featured': feature})


# =============================================================================
# ADVANCED FEATURES - Phase 2 Views
# =============================================================================

class ChannelViewSet(viewsets.ModelViewSet):
    """
    Topic Channels - Sub-communities within universities.
    """
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ChannelCreateSerializer
        if self.action == 'list':
            return ChannelListSerializer
        return ChannelSerializer
    
    def get_queryset(self):
        queryset = Channel.objects.filter(is_archived=False).select_related('university', 'created_by')
        
        # Filter by university
        university_id = self.request.query_params.get('university_id')
        if university_id:
            queryset = queryset.filter(university_id=university_id)
        else:
            # Default to user's primary university
            membership = UniversityMembership.objects.filter(
                user=self.request.user,
                is_primary=True,
                status='active'
            ).first()
            if membership:
                queryset = queryset.filter(university=membership.university)
        
        # Filter by type
        channel_type = self.request.query_params.get('type')
        if channel_type:
            queryset = queryset.filter(channel_type=channel_type)
        
        # Filter by track/circle
        track_key = self.request.query_params.get('track')
        if track_key:
            queryset = queryset.filter(track_key=track_key)
        
        circle_level = self.request.query_params.get('circle')
        if circle_level:
            queryset = queryset.filter(circle_level=circle_level)
        
        # Hide private channels unless member
        if not self.request.user.is_staff:
            user_channels = ChannelMembership.objects.filter(
                user=self.request.user
            ).values_list('channel_id', flat=True)
            queryset = queryset.filter(
                Q(is_private=False) | Q(id__in=user_channels)
            )
        
        return queryset.order_by('-member_count', 'name')
    
    def perform_create(self, serializer):
        # Get user's university
        membership = UniversityMembership.objects.filter(
            user=self.request.user,
            is_primary=True,
            status='active'
        ).first()
        
        if not membership:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("You must be a member of a university to create a channel")
        
        channel = serializer.save(
            university=membership.university,
            created_by=self.request.user
        )
        
        # Auto-join creator as admin
        ChannelMembership.objects.create(
            channel=channel,
            user=self.request.user,
            role='admin'
        )
        
        # Update member count
        channel.member_count = 1
        channel.save(update_fields=['member_count'])
        
        # Award reputation points
        self._award_points(self.request.user, 50, 'created_channel', {'channel_id': str(channel.id)})
    
    @action(detail=True, methods=['post'])
    def join(self, request, slug=None):
        """Join a channel."""
        channel = self.get_object()
        
        # Check if already member
        if ChannelMembership.objects.filter(channel=channel, user=request.user).exists():
            return Response({'error': 'Already a member'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check capacity
        if channel.member_limit and channel.member_count >= channel.member_limit:
            return Response({'error': 'Channel is full'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if requires approval
        if channel.requires_approval:
            # TODO: Implement approval flow
            pass
        
        ChannelMembership.objects.create(
            channel=channel,
            user=request.user,
            role='member'
        )
        
        # Update member count
        channel.member_count = channel.memberships.count()
        channel.save(update_fields=['member_count'])
        
        # Award reputation points
        self._award_points(request.user, 25, 'joined_channel', {'channel_id': str(channel.id)})
        
        return Response({'joined': True, 'member_count': channel.member_count})
    
    @action(detail=True, methods=['post'])
    def leave(self, request, slug=None):
        """Leave a channel."""
        channel = self.get_object()
        
        deleted, _ = ChannelMembership.objects.filter(
            channel=channel,
            user=request.user
        ).delete()
        
        if deleted:
            channel.member_count = channel.memberships.count()
            channel.save(update_fields=['member_count'])
            return Response({'left': True, 'member_count': channel.member_count})
        
        return Response({'error': 'Not a member'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def members(self, request, slug=None):
        """Get channel members."""
        channel = self.get_object()
        memberships = channel.memberships.select_related('user').order_by('-role', 'joined_at')
        serializer = ChannelMembershipSerializer(memberships, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def feed(self, request, slug=None):
        """Get channel-specific feed (posts tagged with this channel)."""
        channel = self.get_object()
        
        # Get posts that mention this channel or are from channel members
        posts = Post.objects.filter(
            Q(tags__contains=[channel.slug]) | 
            Q(tags__contains=[channel.name.lower()]),
            status='published'
        ).select_related('author', 'university').order_by('-created_at')[:50]
        
        serializer = PostListSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)
    
    def _award_points(self, user, points, reason, metadata=None):
        """Award reputation points to user."""
        try:
            rep, created = CommunityReputation.objects.get_or_create(user=user)
            rep.total_points += points
            rep.weekly_points += points
            rep.monthly_points += points
            
            # Calculate level
            new_level = rep.calculate_level()
            if new_level > rep.level:
                rep.level = new_level
                rep.level_up_at = timezone.now()
            
            rep.save()
            
            # Log contribution
            CommunityContribution.objects.create(
                user=user,
                contribution_type=reason,
                points_awarded=points,
                metadata=metadata or {}
            )
        except Exception as e:
            # Log error but don't fail the main operation
            import logging
            logging.error(f"Failed to award points: {e}")


class StudySquadViewSet(viewsets.ModelViewSet):
    """
    Study Squads - Micro-cohorts for focused collaboration.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return StudySquadCreateSerializer
        return StudySquadSerializer
    
    def get_queryset(self):
        queryset = StudySquad.objects.filter(is_active=True).select_related(
            'university', 'channel', 'created_by'
        )
        
        # Filter by university
        university_id = self.request.query_params.get('university_id')
        if university_id:
            queryset = queryset.filter(university_id=university_id)
        else:
            # Default to user's primary university
            membership = UniversityMembership.objects.filter(
                user=self.request.user,
                is_primary=True,
                status='active'
            ).first()
            if membership:
                queryset = queryset.filter(university=membership.university)
        
        # Filter by channel
        channel_id = self.request.query_params.get('channel_id')
        if channel_id:
            queryset = queryset.filter(channel_id=channel_id)
        
        # Filter by circle/track
        circle_level = self.request.query_params.get('circle')
        if circle_level:
            queryset = queryset.filter(circle_level=circle_level)
        
        track_key = self.request.query_params.get('track')
        if track_key:
            queryset = queryset.filter(track_key=track_key)
        
        # Filter by open for joining
        open_only = self.request.query_params.get('open')
        if open_only and open_only.lower() == 'true':
            queryset = queryset.filter(is_open=True)
        
        return queryset.order_by('-total_points', '-member_count')
    
    def perform_create(self, serializer):
        # Get user's university
        membership = UniversityMembership.objects.filter(
            user=self.request.user,
            is_primary=True,
            status='active'
        ).first()
        
        if not membership:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("You must be a member of a university to create a squad")
        
        squad = serializer.save(
            university=membership.university,
            created_by=self.request.user
        )
        
        # Auto-join creator as leader
        SquadMembership.objects.create(
            squad=squad,
            user=self.request.user,
            role='leader'
        )
        
        # Update member count
        squad.member_count = 1
        squad.save(update_fields=['member_count'])
        
        # Award reputation points
        self._award_points(self.request.user, 100, 'squad_leader', {'squad_id': str(squad.id)})
        
        # Update reputation squads_led count
        try:
            rep = self.request.user.community_reputation
            rep.squads_led += 1
            rep.save(update_fields=['squads_led'])
        except CommunityReputation.DoesNotExist:
            pass
    
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Join a squad."""
        squad = self.get_object()
        
        if SquadMembership.objects.filter(squad=squad, user=request.user).exists():
            return Response({'error': 'Already a member'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not squad.is_open:
            return Response({'error': 'Squad is not open for new members'}, status=status.HTTP_400_BAD_REQUEST)
        
        if squad.member_count >= squad.max_members:
            return Response({'error': 'Squad is full'}, status=status.HTTP_400_BAD_REQUEST)
        
        SquadMembership.objects.create(
            squad=squad,
            user=request.user,
            role='member'
        )
        
        squad.member_count = squad.memberships.count()
        squad.save(update_fields=['member_count'])
        
        # Award reputation points
        self._award_points(request.user, 25, 'joined_squad', {'squad_id': str(squad.id)})
        
        return Response({'joined': True, 'member_count': squad.member_count})
    
    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """Leave a squad."""
        squad = self.get_object()
        
        membership = SquadMembership.objects.filter(squad=squad, user=request.user).first()
        if not membership:
            return Response({'error': 'Not a member'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Leaders can't leave if they're the only leader
        if membership.role == 'leader':
            other_leaders = squad.memberships.filter(role='leader').exclude(user=request.user).exists()
            if not other_leaders and squad.member_count > 1:
                return Response(
                    {'error': 'Assign another leader before leaving'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        membership.delete()
        squad.member_count = squad.memberships.count()
        squad.save(update_fields=['member_count'])
        
        return Response({'left': True, 'member_count': squad.member_count})
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get squad members."""
        squad = self.get_object()
        memberships = squad.memberships.select_related('user').order_by('-role', 'joined_at')
        serializer = SquadMembershipSerializer(memberships, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def promote(self, request, pk=None):
        """Promote member to co-leader."""
        squad = self.get_object()
        user_id = request.data.get('user_id')
        
        # Check if requester is leader
        requester_membership = squad.memberships.filter(user=request.user, role='leader').first()
        if not requester_membership:
            return Response({'error': 'Only leaders can promote members'}, status=status.HTTP_403_FORBIDDEN)
        
        target_membership = squad.memberships.filter(user_id=user_id).first()
        if not target_membership:
            return Response({'error': 'User not found in squad'}, status=status.HTTP_404_NOT_FOUND)
        
        target_membership.role = 'co_leader'
        target_membership.save(update_fields=['role'])
        
        return Response({'promoted': True, 'new_role': 'co_leader'})
    
    def _award_points(self, user, points, reason, metadata=None):
        """Award reputation points."""
        try:
            rep, created = CommunityReputation.objects.get_or_create(user=user)
            rep.total_points += points
            rep.weekly_points += points
            rep.monthly_points += points
            new_level = rep.calculate_level()
            if new_level > rep.level:
                rep.level = new_level
                rep.level_up_at = timezone.now()
            rep.save()
            
            CommunityContribution.objects.create(
                user=user,
                contribution_type=reason,
                points_awarded=points,
                metadata=metadata or {}
            )
        except Exception:
            pass


class ReputationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Community Reputation System.
    """
    serializer_class = CommunityReputationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return CommunityReputation.objects.select_related('user', 'university')
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user's reputation."""
        rep, created = CommunityReputation.objects.get_or_create(
            user=request.user,
            defaults={
                'university': self._get_user_university(request.user)
            }
        )
        serializer = CommunityReputationSerializer(rep)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def profile(self, request):
        """Get public reputation profile for a user."""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': 'user_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            rep = CommunityReputation.objects.select_related('user', 'university').get(user_id=user_id)
            serializer = CommunityReputationPublicSerializer(rep)
            return Response(serializer.data)
        except CommunityReputation.DoesNotExist:
            return Response({
                'user_name': 'Unknown',
                'level': 1,
                'total_points': 0,
                'badges': [],
                'titles': []
            })
    
    @action(detail=False, methods=['get'])
    def leaderboard(self, request):
        """Get reputation leaderboard."""
        scope = request.query_params.get('scope', 'global')
        period = request.query_params.get('period', 'all')  # all, weekly, monthly
        limit = int(request.query_params.get('limit', 50))
        
        queryset = CommunityReputation.objects.select_related('user', 'university')
        
        # Filter by scope
        if scope == 'university':
            university_id = request.query_params.get('university_id')
            if university_id:
                queryset = queryset.filter(university_id=university_id)
            else:
                # Use user's university
                uni = self._get_user_university(request.user)
                if uni:
                    queryset = queryset.filter(university=uni)
        
        # Order by period
        if period == 'weekly':
            queryset = queryset.order_by('-weekly_points')
            points_field = 'weekly_points'
        elif period == 'monthly':
            queryset = queryset.order_by('-monthly_points')
            points_field = 'monthly_points'
        else:
            queryset = queryset.order_by('-total_points')
            points_field = 'total_points'
        
        entries = []
        for rank, rep in enumerate(queryset[:limit], 1):
            entries.append({
                'rank': rank,
                'user_id': str(rep.user_id),
                'user_name': f"{rep.user.first_name} {rep.user.last_name}".strip() or rep.user.email,
                'user_avatar': rep.user.avatar_url,
                'level': rep.level,
                'points': getattr(rep, points_field),
                'badges': rep.badges[:3],  # Top 3 badges
                'university_name': rep.university.name if rep.university else None
            })
        
        return Response({
            'scope': scope,
            'period': period,
            'entries': entries
        })
    
    @action(detail=False, methods=['post'])
    def award_points(self, request):
        """Award points to a user (admin only)."""
        if not request.user.is_staff:
            return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = AwardPointsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        try:
            rep = CommunityReputation.objects.get(user_id=data['user_id'])
        except CommunityReputation.DoesNotExist:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(id=data['user_id'])
            rep = CommunityReputation.objects.create(user=user)
        
        rep.total_points += data['points']
        rep.weekly_points += data['points']
        rep.monthly_points += data['points']
        
        new_level = rep.calculate_level()
        if new_level > rep.level:
            rep.level = new_level
            rep.level_up_at = timezone.now()
        
        rep.save()
        
        CommunityContribution.objects.create(
            user_id=data['user_id'],
            contribution_type=data['reason'],
            points_awarded=data['points'],
            metadata=data.get('metadata', {})
        )
        
        return Response({
            'awarded': True,
            'new_total': rep.total_points,
            'new_level': rep.level
        })
    
    def _get_user_university(self, user):
        """Get user's primary university."""
        membership = UniversityMembership.objects.filter(
            user=user,
            is_primary=True,
            status='active'
        ).first()
        return membership.university if membership else None


class AISummaryViewSet(viewsets.ModelViewSet):
    """
    AI Thread Summaries.
    """
    serializer_class = AISummarySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return AISummary.objects.filter(
            Q(post__author=self.request.user) |
            Q(requested_by=self.request.user) |
            Q(post__visibility='global')
        ).select_related('post', 'channel', 'requested_by')
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate AI summary for a post or channel."""
        serializer = AISummaryRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        post = None
        channel = None
        
        if data.get('post_id'):
            post = get_object_or_404(Post, id=data['post_id'])
        elif data.get('channel_id'):
            channel = get_object_or_404(Channel, id=data['channel_id'])
        
        # Check if recent summary exists
        existing = AISummary.objects.filter(
            post=post,
            channel=channel,
            summary_type=data['summary_type'],
            created_at__gte=timezone.now() - timedelta(hours=1)
        ).first()
        
        if existing:
            return Response(AISummarySerializer(existing).data)
        
        # Generate summary (placeholder - integrate with actual AI service)
        summary_text, key_takeaways = self._generate_summary(post, channel, data['summary_type'])
        
        ai_summary = AISummary.objects.create(
            post=post,
            channel=channel,
            summary_type=data['summary_type'],
            summary=summary_text,
            key_takeaways=key_takeaways,
            source_comment_count=post.comment_count if post else 0,
            requested_by=request.user
        )
        
        return Response(AISummarySerializer(ai_summary).data, status=status.HTTP_201_CREATED)
    
    def _generate_summary(self, post, channel, summary_type):
        """Generate AI summary - placeholder for actual AI integration."""
        if post:
            # Collect post content and comments
            comments = post.comments.filter(is_deleted=False).values_list('content', flat=True)[:50]
            content = f"Post: {post.content}\n\nComments:\n" + "\n".join(comments)
            
            # Placeholder summary - replace with actual AI call
            summary = f"This thread discusses: {post.title or post.content[:100]}..."
            takeaways = [
                "Key point 1 from the discussion",
                "Key point 2 from the discussion",
                "Key point 3 from the discussion"
            ]
        else:
            summary = "Channel summary placeholder"
            takeaways = ["Point 1", "Point 2"]
        
        return summary, takeaways


class CollabRoomViewSet(viewsets.ModelViewSet):
    """
    Cross-University Collaboration Rooms.
    """
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CollabRoomCreateSerializer
        if self.action == 'list':
            return CollabRoomListSerializer
        return CollabRoomSerializer
    
    def get_queryset(self):
        queryset = CollabRoom.objects.prefetch_related('universities').select_related('created_by', 'event')
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        else:
            queryset = queryset.exclude(status__in=['draft', 'cancelled'])
        
        # Filter by type
        room_type = self.request.query_params.get('type')
        if room_type:
            queryset = queryset.filter(room_type=room_type)
        
        # Filter by university participation
        university_id = self.request.query_params.get('university_id')
        if university_id:
            queryset = queryset.filter(universities__id=university_id)
        
        return queryset.order_by('-starts_at')
    
    def perform_create(self, serializer):
        university_ids = serializer.validated_data.pop('university_ids', [])
        room = serializer.save(created_by=self.request.user)
        
        # Add universities
        universities = University.objects.filter(id__in=university_ids)
        room.universities.set(universities)
    
    @action(detail=True, methods=['post'])
    def join(self, request, slug=None):
        """Join a collaboration room."""
        room = self.get_object()
        
        if CollabRoomParticipant.objects.filter(room=room, user=request.user).exists():
            return Response({'error': 'Already a participant'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user's university
        membership = UniversityMembership.objects.filter(
            user=request.user,
            is_primary=True,
            status='active'
        ).first()
        
        if not membership:
            return Response({'error': 'You must be a university member'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user's university is participating
        if not room.universities.filter(id=membership.university_id).exists():
            return Response({'error': 'Your university is not participating'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check capacity
        uni_participants = room.participants.filter(university=membership.university).count()
        if uni_participants >= room.max_participants_per_uni:
            return Response({'error': 'Your university team is full'}, status=status.HTTP_400_BAD_REQUEST)
        
        CollabRoomParticipant.objects.create(
            room=room,
            user=request.user,
            university=membership.university,
            team_name=request.data.get('team_name', membership.university.short_name or membership.university.name)
        )
        
        room.participant_count = room.participants.count()
        room.save(update_fields=['participant_count'])
        
        return Response({'joined': True, 'participant_count': room.participant_count})
    
    @action(detail=True, methods=['get'])
    def participants(self, request, slug=None):
        """Get room participants grouped by university."""
        room = self.get_object()
        
        result = {}
        for uni in room.universities.all():
            participants = room.participants.filter(university=uni).select_related('user')
            result[str(uni.id)] = {
                'university': UniversityListSerializer(uni).data,
                'participants': CollabRoomParticipantSerializer(participants, many=True).data,
                'total_score': sum(p.individual_score for p in participants)
            }
        
        return Response(result)
    
    @action(detail=True, methods=['get'])
    def leaderboard(self, request, slug=None):
        """Get room leaderboard."""
        room = self.get_object()
        
        # Individual leaderboard
        individuals = room.participants.select_related('user', 'university').order_by('-individual_score')[:20]
        
        # University leaderboard
        from django.db.models import Sum
        university_scores = room.participants.values(
            'university__id', 'university__name', 'university__code'
        ).annotate(
            total_score=Sum('individual_score')
        ).order_by('-total_score')
        
        return Response({
            'individuals': CollabRoomParticipantSerializer(individuals, many=True).data,
            'universities': list(university_scores)
        })


class EnterpriseCohortViewSet(viewsets.ModelViewSet):
    """
    Enterprise Cohort Views.
    """
    serializer_class = EnterpriseCohortSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = EnterpriseCohort.objects.filter(is_active=True).select_related('university')
        
        # Only show cohorts user is part of, unless admin
        if not self.request.user.is_staff:
            user_id_str = str(self.request.user.id)
            queryset = queryset.filter(
                Q(members__contains=[user_id_str]) |
                Q(admin_users__contains=[user_id_str]) |
                Q(allow_external_view=True)
            )
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get cohort members."""
        cohort = self.get_object()
        
        # Check access
        user_id_str = str(request.user.id)
        if not request.user.is_staff:
            if user_id_str not in cohort.members and user_id_str not in cohort.admin_users:
                if not cohort.allow_external_view:
                    return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        members = User.objects.filter(id__in=cohort.members)
        serializer = UserMiniSerializer(members, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def feed(self, request, pk=None):
        """Get cohort-filtered feed."""
        cohort = self.get_object()
        
        # Get posts from cohort members
        posts = Post.objects.filter(
            author_id__in=cohort.members,
            status='published'
        ).select_related('author', 'university').order_by('-created_at')[:50]
        
        serializer = PostListSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)


class ContributionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Community Contributions - TalentScope signals.
    """
    serializer_class = CommunityContributionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = CommunityContribution.objects.select_related('user')
        
        # Filter by user
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        else:
            queryset = queryset.filter(user=self.request.user)
        
        # Filter by type
        contribution_type = self.request.query_params.get('type')
        if contribution_type:
            queryset = queryset.filter(contribution_type=contribution_type)
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get contribution summary for current user."""
        user_id = request.query_params.get('user_id', request.user.id)
        
        from django.db.models import Sum
        contributions = CommunityContribution.objects.filter(user_id=user_id)
        
        summary = contributions.values('contribution_type').annotate(
            count=Count('id'),
            total_points=Sum('points_awarded')
        ).order_by('-total_points')
        
        total_points = contributions.aggregate(total=Sum('points_awarded'))['total'] or 0
        
        return Response({
            'user_id': str(user_id),
            'total_contributions': contributions.count(),
            'total_points': total_points,
            'by_type': list(summary)
        })

