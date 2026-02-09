"""
Recipe Engine URL configuration.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RecipeViewSet,
    UserRecipeProgressViewSet,
    RecipeContextLinkViewSet,
    BookmarkedRecipesView,
    RecipeStatsView,
    UserRecipesView,
    UserRecipeProgressView,
    RecipeSourceViewSet,
    RecipeSourceIngestView,
    LLMNormalizeRecipesView,
    RecipeEnvStatusView,
    RecipeGenerateView,
    get_profiler_based_recipes,
    get_sample_recipe,
    get_mission_stage_recipes,
    recipe_effectiveness_analytics
)

router = DefaultRouter()
router.register(r'recipes', RecipeViewSet, basename='recipe')
router.register(r'my-progress', UserRecipeProgressViewSet, basename='my-recipe-progress')
router.register(r'context-links', RecipeContextLinkViewSet, basename='recipe-context-link')
router.register(r'recipe-sources', RecipeSourceViewSet, basename='recipe-source')

urlpatterns = [
    # Specific paths must come BEFORE router.urls to avoid conflicts
    path('recipes/generate/', RecipeGenerateView.as_view(), name='recipe-generate'),
    path('recipes/profiler-recommendations', get_profiler_based_recipes, name='profiler-recipe-recommendations'),
    path('recipes/mission/<uuid:mission_id>/recommendations', get_mission_stage_recipes, name='mission-stage-recipes'),
    path('recipes/sample', get_sample_recipe, name='recipe-sample'),
    path('recipes/analytics/effectiveness', recipe_effectiveness_analytics, name='recipe-effectiveness-analytics'),
    path('bookmarks/', BookmarkedRecipesView.as_view(), name='recipe-bookmarks'),
    path('stats/', RecipeStatsView.as_view(), name='recipe-stats'),
    path('env-status/', RecipeEnvStatusView.as_view(), name='recipe-env-status'),
    path('users/<uuid:user_id>/recipes/', UserRecipesView.as_view(), name='user-recipes'),
    path('users/<uuid:user_id>/recipes/<uuid:recipe_id>/progress/', UserRecipeProgressView.as_view(), name='user-recipe-progress'),
    path('recipe-sources/<uuid:source_id>/ingest/', RecipeSourceIngestView.as_view(), name='recipe-source-ingest'),
    path('llm/normalize-recipes/run-once/', LLMNormalizeRecipesView.as_view(), name='llm-normalize-recipes'),

    # Router URLs last
    path('', include(router.urls)),
]


