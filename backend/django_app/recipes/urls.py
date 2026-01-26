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
    RecipeGenerateView
)

router = DefaultRouter()
router.register(r'recipes', RecipeViewSet, basename='recipe')
router.register(r'my-progress', UserRecipeProgressViewSet, basename='my-recipe-progress')
router.register(r'context-links', RecipeContextLinkViewSet, basename='recipe-context-link')
router.register(r'recipe-sources', RecipeSourceViewSet, basename='recipe-source')

urlpatterns = [
    path('', include(router.urls)),
    path('bookmarks/', BookmarkedRecipesView.as_view(), name='recipe-bookmarks'),
    path('stats/', RecipeStatsView.as_view(), name='recipe-stats'),
    path('users/<uuid:user_id>/recipes/', UserRecipesView.as_view(), name='user-recipes'),
    path('users/<uuid:user_id>/recipes/<uuid:recipe_id>/progress/', UserRecipeProgressView.as_view(), name='user-recipe-progress'),
    path('recipe-sources/<uuid:source_id>/ingest/', RecipeSourceIngestView.as_view(), name='recipe-source-ingest'),
    path('llm/normalize-recipes/run-once/', LLMNormalizeRecipesView.as_view(), name='llm-normalize-recipes'),
    path('generate/', RecipeGenerateView.as_view(), name='recipe-generate'),
]


