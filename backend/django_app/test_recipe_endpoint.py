#!/usr/bin/env python
"""Test recipe generate endpoint."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.urls import resolve, reverse
from django.test import RequestFactory
from recipes.views import RecipeGenerateView

print("Testing recipe generate endpoint...\n")

# Test URL reverse
try:
    url = reverse('recipe-generate')
    print(f"[OK] URL reverse: {url}")
except Exception as e:
    print(f"[ERROR] URL reverse failed: {e}")

# Test URL resolution
try:
    match = resolve('/api/v1/recipes/generate/')
    print(f"[OK] URL resolves to: {match.view_name}")
    print(f"     View class: {match.func.__name__}")
except Exception as e:
    print(f"[ERROR] URL resolution failed: {e}")

# Test view accepts POST
try:
    from rest_framework.test import APIRequestFactory
    factory = APIRequestFactory()
    request = factory.post('/api/v1/recipes/generate/', {
        'track_code': 'TEST',
        'level': 'beginner',
        'skill_code': 'test_skills',
        'goal_description': 'Test recipe'
    }, format='json')

    # Add mock user
    from users.models import User
    user = User.objects.filter(is_staff=True).first()
    if user:
        request.user = user
        view = RecipeGenerateView.as_view()
        response = view(request)
        print(f"[OK] View accepts POST: status {response.status_code}")
    else:
        print("[WARN] No staff user found for testing")
except Exception as e:
    print(f"[INFO] View test: {e}")

print("\nDone!")
