#!/usr/bin/env python3
"""Add sample subtasks to the alpha mission."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from missions.models import Mission

print("Adding sample subtasks to alpha mission...")

mission = Mission.objects.first()
print(f"\nMission: {mission.title}")

# Add sample subtasks
mission.subtasks = [
    {
        "id": 1,
        "title": "Set up lab environment",
        "description": "Configure your virtual lab with the required tools and software",
        "order_index": 1,
        "is_required": True
    },
    {
        "id": 2,
        "title": "Complete reconnaissance phase",
        "description": "Perform network scanning and identify potential vulnerabilities",
        "order_index": 2,
        "is_required": True
    },
    {
        "id": 3,
        "title": "Document findings",
        "description": "Create a detailed report of your findings and recommendations",
        "order_index": 3,
        "is_required": True
    }
]

mission.save()

print(f"\n[OK] Added {len(mission.subtasks)} subtasks to '{mission.title}'")

# Verify
mission.refresh_from_db()
print("\nSubtasks:")
for subtask in mission.subtasks:
    print(f"  {subtask['id']}. {subtask['title']}")
    print(f"     {subtask['description']}")

print("\n[DONE]")
