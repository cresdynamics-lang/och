"""
Recipe Engine views - API endpoints for recipes and user progress.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Count, Prefetch, Q, Subquery, OuterRef, Avg
from django.utils import timezone
from django.utils.text import slugify

from .models import Recipe, UserRecipeProgress, RecipeContextLink, UserRecipeBookmark, RecipeSource, RecipeLLMJob
from .serializers import (
    RecipeListSerializer, RecipeDetailSerializer,
    UserRecipeProgressSerializer, RecipeContextLinkSerializer,
    RecipeBookmarkSerializer, RecipeProgressUpdateSerializer,
    RecipeSourceSerializer
)


class RecipeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for recipes.

    Endpoints:
    - GET /recipes/ - List all active recipes (with search/filter) - PUBLIC
    - GET /recipes/{slug}/ - Get recipe details - PUBLIC
    - GET /recipes/{slug}/related/ - Get related recipes - PUBLIC
    - POST /recipes/{slug}/progress/ - Update user progress - REQUIRES AUTH
    - POST /recipes/{slug}/bookmark/ - Bookmark/unbookmark recipe - REQUIRES AUTH
    """
    queryset = Recipe.objects.filter(is_active=True)
    lookup_field = 'slug'

    def get_permissions(self):
        """
        Allow public access to GET methods (list, retrieve, related)
        Require authentication for POST/PUT/DELETE methods
        """
        if self.request.method in ['GET']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RecipeDetailSerializer
        return RecipeListSerializer
    
    def list(self, request):
        """Override list to use raw SQL for demo purposes."""
        try:
            from django.db import connection
            import json

            with connection.cursor() as cursor:
                # Check if user is free user (simplified - students can access recipes)
                user = request.user
                is_free_user = not user.is_authenticated or not hasattr(user, 'is_staff') or not user.is_staff

                if is_free_user:
                    cursor.execute("""
                        SELECT id, title, slug, summary, description, difficulty,
                               estimated_minutes, track_codes, skill_codes, source_type,
                               prerequisites, tools_and_environment, inputs,
                               steps, validation_checks, is_free_sample
                        FROM recipes_recipe
                        WHERE is_active = 1 AND is_free_sample = 1
                        ORDER BY created_at DESC
                    """)
                else:
                    cursor.execute("""
                        SELECT id, title, slug, summary, description, difficulty,
                               estimated_minutes, track_codes, skill_codes, source_type,
                               prerequisites, tools_and_environment, inputs,
                               steps, validation_checks, is_free_sample
                        FROM recipes_recipe
                        WHERE is_active = 1
                        ORDER BY created_at DESC
                    """)

                rows = cursor.fetchall()

                recipes = []
                for row in rows:
                    try:
                        track_codes = json.loads(row[7]) if row[7] else []
                        skill_codes = json.loads(row[8]) if row[8] else []

                        recipes.append({
                            'id': row[0],
                            'title': row[1],
                            'slug': row[2],
                            'description': row[3] or row[4] or '',
                            'difficulty': row[5],
                            'expected_duration_minutes': row[6] or 20,
                            'track_code': track_codes[0] if track_codes else None,
                            'skill_code': skill_codes[0] if skill_codes else None,
                            'level': row[5],  # Map difficulty to level
                            'source_type': row[9] or 'manual',
                            'tags': track_codes + skill_codes,
                            'prerequisites': json.loads(row[10]) if row[10] else [],
                            'tools_and_environment': json.loads(row[11]) if row[11] else [],
                            'inputs': json.loads(row[12]) if row[12] else [],
                            'steps': json.loads(row[13]) if row[13] else [],
                            'validation_checks': json.loads(row[14]) if row[14] else [],
                            'is_free_sample': bool(row[15])
                        })
                    except Exception as e:
                        print(f"Error processing row {row[0]}: {e}")
                        continue

                return Response({
                    'recipes': recipes,
                    'total': len(recipes),
                    'page': 1,
                    'page_size': len(recipes)
                })
        except Exception as e:
            print(f"Database error: {e}")
            return Response({'error': 'Database error'}, status=500)

    def get_queryset(self):
        queryset = super().get_queryset()

        # REMOVED: Free user restrictions - all recipes are now accessible to everyone

        # Search
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(summary__icontains=search) |
                Q(description__icontains=search) |
                Q(skill_codes__icontains=search) |
                Q(tools_used__icontains=search)
            )

        # Filters
        track = self.request.query_params.get('track_code', None)
        if track:
            queryset = queryset.filter(track_codes__contains=[track])

        difficulty = self.request.query_params.get('difficulty', None)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)

        max_time = self.request.query_params.get('max_duration', None)
        if max_time:
            try:
                queryset = queryset.filter(estimated_minutes__lte=int(max_time))
            except ValueError:
                pass

        # Free samples filter
        is_free_sample = self.request.query_params.get('is_free_sample', None)
        if is_free_sample:
            queryset = queryset.filter(is_free_sample=is_free_sample.lower() == 'true')

        # Context filter (mission, module, project)
        context_type = self.request.query_params.get('context', None)
        if context_type:
            # Filter recipes that have context links of this type
            context_ids = RecipeContextLink.objects.filter(
                context_type=context_type
            ).values_list('recipe_id', flat=True)
            queryset = queryset.filter(id__in=context_ids)

        # Sort
        sort = self.request.query_params.get('sort', 'relevance')
        if sort == 'popular':
            queryset = queryset.order_by('-usage_count', '-avg_rating')
        elif sort == 'recent':
            queryset = queryset.order_by('-created_at')
        elif sort == 'rating':
            queryset = queryset.order_by('-avg_rating', '-usage_count')
        else:  # relevance default
            queryset = queryset.order_by('-usage_count', '-avg_rating')

        return queryset.select_related('created_by').prefetch_related('context_links')

    def retrieve(self, request, *args, **kwargs):
        """Get individual recipe with free user restrictions using raw SQL."""
        slug = kwargs.get('slug')
        if not slug:
            return Response({'error': 'Recipe slug required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from django.db import connection
            import json

            # REMOVED: Free user restrictions - all recipes are now accessible to everyone
            user = request.user

            with connection.cursor() as cursor:
                # All users can see all recipes
                cursor.execute("""
                    SELECT id, title, slug, summary, description, difficulty,
                           estimated_minutes, track_codes, skill_codes, source_type,
                           prerequisites, tools_and_environment, inputs,
                           steps, validation_checks, is_free_sample
                    FROM recipes_recipe
                    WHERE slug = %s AND is_active = 1
                """, [slug])

                row = cursor.fetchone()

                if not row:
                    return Response({'error': 'Recipe not found'}, status=status.HTTP_404_NOT_FOUND)

                try:
                    recipe_data = {
                        'id': row[0],
                        'title': row[1],
                        'slug': row[2],
                        'description': row[3] or row[4] or '',
                        'difficulty': row[5],
                        'expected_duration_minutes': row[6] or 20,
                        'track_code': json.loads(row[7])[0] if row[7] else None,
                        'skill_code': json.loads(row[8])[0] if row[8] else None,
                        'level': row[5],  # Map difficulty to level
                        'source_type': row[9] or 'manual',
                        'prerequisites': json.loads(row[10]) if row[10] else [],
                        'tools_and_environment': json.loads(row[11]) if row[11] else [],
                        'inputs': json.loads(row[12]) if row[12] else [],
                        'steps': json.loads(row[13]) if row[13] else [],
                        'validation_checks': json.loads(row[14]) if row[14] else [],
                        'is_free_sample': bool(row[15])
                    }

                    return Response(recipe_data)
                except Exception as json_error:
                    return Response({'error': f'JSON parsing error: {str(json_error)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            return Response({'error': f'Database error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def related(self, request, slug=None):
        """Get related recipes based on skills/tools."""
        recipe = self.get_object()
        related = Recipe.objects.filter(
            Q(is_active=True) &
            (
                Q(skill_codes__overlap=recipe.skill_codes) |
                Q(tools_used__overlap=recipe.tools_used)
            )
        ).exclude(id=recipe.id)[:6]
        
        serializer = RecipeListSerializer(related, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post', 'get'], permission_classes=[permissions.IsAuthenticated])
    def progress(self, request, slug=None):
        """Update user progress for a recipe."""
        recipe = self.get_object()
        user = request.user
        
        if request.method == 'GET':
            progress = UserRecipeProgress.objects.filter(user=user, recipe=recipe).first()
            if progress:
                serializer = UserRecipeProgressSerializer(progress)
                return Response(serializer.data)
            return Response({'status': None})
        
        # POST - Update progress
        progress, created = UserRecipeProgress.objects.get_or_create(
            user=user,
            recipe=recipe
        )
        
        serializer = RecipeProgressUpdateSerializer(data=request.data)
        if serializer.is_valid():
            if 'status' in serializer.validated_data:
                progress.status = serializer.validated_data['status']
                if serializer.validated_data['status'] == 'completed' and not progress.completed_at:
                    progress.completed_at = timezone.now()
                    # Update recipe stats
                    recipe.usage_count += 1
                    recipe.save(update_fields=['usage_count'])
            
            if 'rating' in serializer.validated_data:
                progress.rating = serializer.validated_data['rating']
                # Update recipe avg_rating
                avg_rating = UserRecipeProgress.objects.filter(
                    recipe=recipe,
                    rating__isnull=False
                ).aggregate(Avg('rating'))['rating__avg']
                if avg_rating:
                    recipe.avg_rating = round(avg_rating, 2)
                    recipe.save(update_fields=['avg_rating'])
            
            if 'notes' in serializer.validated_data:
                progress.notes = serializer.validated_data['notes']
            
            if 'time_spent_minutes' in serializer.validated_data:
                progress.time_spent_minutes = serializer.validated_data['time_spent_minutes']
            
            progress.save()
            
            response_serializer = UserRecipeProgressSerializer(progress)
            return Response(response_serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post', 'delete'], permission_classes=[permissions.IsAuthenticated])
    def bookmark(self, request, slug=None):
        """Bookmark or unbookmark a recipe."""
        recipe = self.get_object()
        user = request.user
        
        if request.method == 'DELETE':
            UserRecipeBookmark.objects.filter(user=user, recipe=recipe).delete()
            return Response({'bookmarked': False}, status=status.HTTP_200_OK)
        
        # POST - Create bookmark
        bookmark, created = UserRecipeBookmark.objects.get_or_create(
            user=user,
            recipe=recipe
        )
        
        serializer = RecipeBookmarkSerializer(bookmark)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def bulk_import(self, request):
        """Bulk import recipes from JSON data (for seeding)."""
        recipes_data = request.data
        if not isinstance(recipes_data, list):
            recipes_data = [recipes_data]

        created_recipes = []
        for recipe_data in recipes_data:
            try:
                # Transform Next.js format to Django format
                django_recipe_data = {
                    'title': recipe_data['title'],
                    'summary': recipe_data['description'][:200],  # Truncate for summary
                    'description': recipe_data['description'],
                    'difficulty': recipe_data['level'],  # Map level to difficulty
                    'estimated_minutes': recipe_data['expected_duration_minutes'],
                    'track_codes': [recipe_data['track_code']],
                    'skill_codes': [recipe_data['skill_code']],
                    'level': recipe_data['level'],
                    'source_type': recipe_data['source_type'],
                    'prerequisites': recipe_data.get('prerequisites', []),
                    'tools_used': recipe_data.get('tools_and_environment', []),
                    'inputs': recipe_data.get('inputs', []),
                    'steps': recipe_data.get('steps', []),
                    'validation_checks': recipe_data.get('validation_checks', []),
                    'tags': recipe_data.get('tags', []),
                    'is_free_sample': recipe_data.get('is_free_sample', False),
                    'is_active': True,
                }

                # Generate slug if not provided
                if 'slug' not in recipe_data:
                    import re
                    base_slug = f"{recipe_data['track_code']}-{recipe_data['level']}-{recipe_data['skill_code']}".lower()
                    base_slug = re.sub(r'[^a-z0-9\-]+', '-', base_slug)
                    django_recipe_data['slug'] = self._ensure_unique_slug(base_slug)
                else:
                    django_recipe_data['slug'] = recipe_data['slug']

                recipe = Recipe.objects.create(**django_recipe_data)
                created_recipes.append({
                    'id': recipe.id,
                    'slug': recipe.slug,
                    'title': recipe.title,
                    'track_code': recipe.track_codes[0] if recipe.track_codes else None,
                    'level': recipe.level
                })

            except Exception as e:
                return Response({'error': f'Failed to create recipe: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'message': f'Successfully imported {len(created_recipes)} recipes',
            'recipes': created_recipes
        }, status=status.HTTP_201_CREATED)

    def _ensure_unique_slug(self, base_slug):
        """Ensure slug uniqueness."""
        slug = base_slug
        counter = 1
        while Recipe.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        return slug


class UserRecipeProgressViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for user recipe progress."""
    serializer_class = UserRecipeProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserRecipeProgress.objects.filter(
            user=self.request.user
        ).select_related('recipe').order_by('-updated_at')


class RecipeContextLinkViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for recipe context links."""
    serializer_class = RecipeContextLinkSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = RecipeContextLink.objects.select_related('recipe')
        
        context_type = self.request.query_params.get('context_type', None)
        if context_type:
            queryset = queryset.filter(context_type=context_type)
        
        context_id = self.request.query_params.get('context_id', None)
        if context_id:
            queryset = queryset.filter(context_id=context_id)
        
        return queryset.order_by('position_order')


class BookmarkedRecipesView(APIView):
    """View for user's bookmarked recipes."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        bookmarks = UserRecipeBookmark.objects.filter(
            user=request.user
        ).select_related('recipe').order_by('-bookmarked_at')
        
        serializer = RecipeBookmarkSerializer(bookmarks, many=True)
        return Response(serializer.data)


class RecipeStatsView(APIView):
    """View for recipe library statistics."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        total = Recipe.objects.filter(is_active=True).count()
        user = request.user

        bookmarked = 0
        if user.is_authenticated:
            bookmarked = UserRecipeBookmark.objects.filter(user=user).count()

        return Response({
            'total': total,
            'bookmarked': bookmarked
        })


class UserRecipesView(APIView):
    """View for user's recipe progress."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        # Check if user can access this data
        if str(request.user.id) != user_id:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Get recipes with user progress
        recipes_with_progress = Recipe.objects.filter(
            is_active=True,
            user_progress__user=request.user
        ).select_related('created_by').prefetch_related(
            'user_progress',
            Prefetch('context_links', queryset=RecipeContextLink.objects.select_related('recipe'))
        ).annotate(
            user_status=Subquery(
                UserRecipeProgress.objects.filter(
                    user=request.user,
                    recipe=OuterRef('pk')
                ).values('status')[:1]
            ),
            user_rating=Subquery(
                UserRecipeProgress.objects.filter(
                    user=request.user,
                    recipe=OuterRef('pk')
                ).values('rating')[:1]
            )
        )

        serializer = RecipeListSerializer(recipes_with_progress, many=True, context={'request': request})
        return Response(serializer.data)


class UserRecipeProgressView(APIView):
    """View for updating user recipe progress."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id, recipe_id):
        # Check if user can access this data
        if str(request.user.id) != user_id:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        try:
            recipe = Recipe.objects.get(id=recipe_id, is_active=True)
        except Recipe.DoesNotExist:
            return Response({'error': 'Recipe not found'}, status=status.HTTP_404_NOT_FOUND)

        # Get or create progress record
        progress, created = UserRecipeProgress.objects.get_or_create(
            user=request.user,
            recipe=recipe
        )

        # Update progress
        serializer = RecipeProgressUpdateSerializer(data=request.data)
        if serializer.is_valid():
            old_status = progress.status
            new_status = serializer.validated_data.get('status', progress.status)

            progress.status = new_status
            if new_status == 'completed' and old_status != 'completed':
                progress.completed_at = timezone.now()
                # Update recipe stats
                recipe.usage_count += 1
                recipe.save(update_fields=['usage_count'])

            if 'rating' in serializer.validated_data:
                progress.rating = serializer.validated_data['rating']
                # Update recipe avg_rating
                avg_rating = UserRecipeProgress.objects.filter(
                    recipe=recipe,
                    rating__isnull=False
                ).aggregate(Avg('rating'))['rating__avg']
                if avg_rating:
                    recipe.avg_rating = round(avg_rating, 2)
                    recipe.save(update_fields=['avg_rating'])

            if 'notes' in serializer.validated_data:
                progress.notes = serializer.validated_data['notes']

            if 'time_spent_minutes' in serializer.validated_data:
                progress.time_spent_minutes = serializer.validated_data['time_spent_minutes']

            progress.save()

            # Emit skill signal (placeholder - integrate with TalentScope)
            # emitSkillSignalFromRecipeCompletion(request.user.id, recipe, new_status)

            response_serializer = UserRecipeProgressSerializer(progress)
            return Response(response_serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RecipeSourceViewSet(viewsets.ModelViewSet):
    """ViewSet for recipe sources."""
    queryset = RecipeSource.objects.all()
    serializer_class = RecipeSourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Only admin/system can create sources
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)


class RecipeSourceIngestView(APIView):
    """View for triggering recipe source ingestion."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, source_id):
        # Only admin/system can trigger ingestion
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        try:
            source = RecipeSource.objects.get(id=source_id)
        except RecipeSource.DoesNotExist:
            return Response({'error': 'Source not found'}, status=status.HTTP_404_NOT_FOUND)

        # Placeholder - implement actual ingestion logic
        # This would create RecipeLLMJob records based on source config

        return Response({'message': 'Ingestion started', 'source_id': source_id})


class LLMNormalizeRecipesView(APIView):
    """View for triggering LLM normalization worker."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Only admin/system can trigger LLM jobs
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Placeholder - implement LLM worker logic
        # This would pick pending RecipeLLMJob records and process them

        return Response({'message': 'LLM normalization worker triggered'})


class RecipeGenerateView(APIView):
    """View for generating recipes using LLM."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Only admin/system can generate recipes
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Get parameters
        track_code = request.data.get('track_code')
        level = request.data.get('level', 'beginner')
        skill_code = request.data.get('skill_code')
        goal_description = request.data.get('goal_description')

        if not all([track_code, skill_code, goal_description]):
            return Response({'error': 'Missing required parameters'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Import LLM service (this would be implemented)
            from recipes.services.llm_service import generate_recipe_with_llm

            # Generate recipe using LLM
            recipe_data = generate_recipe_with_llm(
                track_code=track_code,
                level=level,
                skill_code=skill_code,
                goal_description=goal_description
            )

            # Create recipe in database
            recipe = Recipe.objects.create(
                title=recipe_data['title'],
                slug=recipe_data['slug'],
                summary=recipe_data['description'],
                description=recipe_data['description'],
                track_codes=[track_code],
                skill_codes=[skill_code],
                difficulty=level,  # Map level to difficulty
                source_type='llm_generated',
                estimated_minutes=recipe_data.get('expected_duration_minutes', 20),
                steps=recipe_data.get('steps', []),
                prerequisites=recipe_data.get('prerequisites', []),
                tools_and_environment=recipe_data.get('tools_and_environment', []),
                inputs=recipe_data.get('inputs', []),
                validation_checks=recipe_data.get('validation_checks', []),
                is_active=True,
                created_by=request.user
            )

            serializer = RecipeDetailSerializer(recipe)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
