#!/usr/bin/env python3
"""Check what data exists for the mission."""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from missions.models import Mission
from django.db import connection

print("=" * 80)
print("MISSION DATA INSPECTION")
print("=" * 80)

# Get the mission
mission = Mission.objects.first()

print(f"\nMission: {mission.title}")
print(f"ID: {mission.id}")
print("\nALL FIELDS:")
print("-" * 80)

# Print all field values
for field in mission._meta.fields:
    field_name = field.name
    field_value = getattr(mission, field_name)
    print(f"{field_name:30} = {field_value}")

print("\n" + "=" * 80)
print("CHECKING DATABASE TABLE SCHEMA")
print("=" * 80)

with connection.cursor() as cursor:
    cursor.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'missions'
        ORDER BY ordinal_position;
    """)

    print("\nColumns in 'missions' table:")
    print("-" * 80)
    for row in cursor.fetchall():
        print(f"  {row[0]:30} {row[1]:20} Nullable: {row[2]}")

print("\n" + "=" * 80)
print("CHECKING FOR RELATED TABLES")
print("=" * 80)

with connection.cursor() as cursor:
    # Check for mission_objectives table
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'mission_objectives'
        );
    """)
    has_objectives = cursor.fetchone()[0]
    print(f"\nmission_objectives table exists: {has_objectives}")

    # Check for mission_subtasks table
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'mission_subtasks'
        );
    """)
    has_subtasks = cursor.fetchone()[0]
    print(f"mission_subtasks table exists: {has_subtasks}")

print("\n" + "=" * 80)
