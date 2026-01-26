"""
Django admin configuration for Recipe Engine.
"""
from django.contrib import admin
from .models import Recipe, UserRecipeProgress, RecipeContextLink, UserRecipeBookmark


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ['title', 'slug', 'difficulty', 'estimated_minutes', 'usage_count', 'avg_rating', 'is_active', 'created_at']
    list_filter = ['difficulty', 'is_active', 'mentor_curated', 'created_at']
    search_fields = ['title', 'slug', 'summary', 'description']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['id', 'usage_count', 'avg_rating', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'title', 'slug', 'summary', 'description')
        }),
        ('Metadata', {
            'fields': ('difficulty', 'estimated_minutes', 'track_codes', 'skill_codes', 'tools_used', 'prerequisites')
        }),
        ('Content', {
            'fields': ('content', 'validation_steps', 'thumbnail_url')
        }),
        ('Stats & Status', {
            'fields': ('usage_count', 'avg_rating', 'mentor_curated', 'is_active', 'created_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(UserRecipeProgress)
class UserRecipeProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'recipe', 'status', 'rating', 'time_spent_minutes', 'completed_at', 'updated_at']
    list_filter = ['status', 'rating', 'completed_at']
    search_fields = ['user__email', 'recipe__title']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(RecipeContextLink)
class RecipeContextLinkAdmin(admin.ModelAdmin):
    list_display = ['recipe', 'context_type', 'context_id', 'is_required', 'position_order']
    list_filter = ['context_type', 'is_required']
    search_fields = ['recipe__title']


@admin.register(UserRecipeBookmark)
class UserRecipeBookmarkAdmin(admin.ModelAdmin):
    list_display = ['user', 'recipe', 'bookmarked_at']
    search_fields = ['user__email', 'recipe__title']
    readonly_fields = ['id', 'bookmarked_at']
