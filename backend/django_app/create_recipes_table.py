#!/usr/bin/env python
"""Create recipes table manually."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection

print("Creating recipes table...\n")

with connection.cursor() as cursor:
    try:
            # Drop table if exists and recreate with all fields
            cursor.execute("DROP TABLE IF EXISTS recipes CASCADE;")

            # Create the recipes table with all fields
            cursor.execute("""
                CREATE TABLE recipes (
                    id UUID PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    slug VARCHAR(255) UNIQUE NOT NULL,
                    summary TEXT,
                    description TEXT,
                    track_codes JSONB DEFAULT '[]'::jsonb NOT NULL,
                    skill_codes JSONB DEFAULT '[]'::jsonb NOT NULL,
                    tools_used JSONB DEFAULT '[]'::jsonb NOT NULL,
                    difficulty VARCHAR(50) DEFAULT 'beginner',
                    estimated_minutes INTEGER DEFAULT 20,
                    steps JSONB DEFAULT '[]'::jsonb NOT NULL,
                    prerequisites JSONB DEFAULT '[]'::jsonb NOT NULL,
                    tools_and_environment JSONB DEFAULT '[]'::jsonb NOT NULL,
                    inputs JSONB DEFAULT '[]'::jsonb NOT NULL,
                    validation_checks JSONB DEFAULT '[]'::jsonb NOT NULL,
                    content JSONB DEFAULT '{}'::jsonb NOT NULL,
                    validation_steps JSONB DEFAULT '{}'::jsonb NOT NULL,
                    thumbnail_url VARCHAR(500),
                    mentor_curated BOOLEAN DEFAULT FALSE,
                    is_free_sample BOOLEAN DEFAULT FALSE,
                    usage_count INTEGER DEFAULT 0,
                    avg_rating DECIMAL(3,2) DEFAULT 0.0,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_by_id BIGINT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """)

            # Create indexes
            cursor.execute("CREATE INDEX idx_recipes_slug ON recipes(slug);")
            cursor.execute("CREATE INDEX idx_recipes_difficulty ON recipes(difficulty);")
            cursor.execute("CREATE INDEX idx_recipes_is_active ON recipes(is_active);")
            cursor.execute("CREATE INDEX idx_recipes_usage_active ON recipes(is_active, usage_count);")
            cursor.execute("CREATE INDEX idx_recipes_difficulty_active ON recipes(difficulty, is_active);")
            cursor.execute("CREATE INDEX idx_recipes_free ON recipes(is_free_sample);")
            cursor.execute("CREATE INDEX idx_recipes_track_codes ON recipes USING GIN(track_codes);")
            cursor.execute("CREATE INDEX idx_recipes_skill_codes ON recipes USING GIN(skill_codes);")
            cursor.execute("CREATE INDEX idx_recipes_tools_used ON recipes USING GIN(tools_used);")

            print("[OK] Successfully created 'recipes' table with indexes")

    except Exception as e:
        print(f"[ERROR] {e}")
        raise

print("\nDone!")
