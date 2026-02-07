#!/usr/bin/env python
"""Create all recipe-related tables manually."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection

print("Creating recipe-related tables...\n")

with connection.cursor() as cursor:
    try:
        # Create recipe_context_links table
        print("Creating recipe_context_links table...")
        cursor.execute("DROP TABLE IF EXISTS recipe_context_links CASCADE;")
        cursor.execute("""
            CREATE TABLE recipe_context_links (
                id UUID PRIMARY KEY,
                recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
                context_type VARCHAR(20) NOT NULL,
                context_id UUID NOT NULL,
                is_required BOOLEAN DEFAULT FALSE,
                position_order INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Create indexes for recipe_context_links
        cursor.execute("CREATE INDEX idx_recipe_context_links_context ON recipe_context_links(context_type, context_id, position_order);")
        cursor.execute("CREATE INDEX idx_recipe_context_links_recipe ON recipe_context_links(recipe_id, context_type);")
        print("[OK] Created recipe_context_links table\n")

        # Create user_recipe_progress table
        print("Creating user_recipe_progress table...")
        cursor.execute("DROP TABLE IF EXISTS user_recipe_progress CASCADE;")
        cursor.execute("""
            CREATE TABLE user_recipe_progress (
                id UUID PRIMARY KEY,
                user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'started',
                completed_at TIMESTAMP WITH TIME ZONE,
                rating INTEGER,
                notes TEXT,
                time_spent_minutes INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, recipe_id)
            );
        """)

        # Create indexes for user_recipe_progress
        cursor.execute("CREATE INDEX idx_user_recipe_progress_user_status ON user_recipe_progress(user_id, status);")
        cursor.execute("CREATE INDEX idx_user_recipe_progress_recipe_status ON user_recipe_progress(recipe_id, status);")
        print("[OK] Created user_recipe_progress table\n")

        # Create user_recipe_bookmarks table
        print("Creating user_recipe_bookmarks table...")
        cursor.execute("DROP TABLE IF EXISTS user_recipe_bookmarks CASCADE;")
        cursor.execute("""
            CREATE TABLE user_recipe_bookmarks (
                id UUID PRIMARY KEY,
                user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
                bookmarked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, recipe_id)
            );
        """)

        # Create indexes for user_recipe_bookmarks
        cursor.execute("CREATE INDEX idx_user_recipe_bookmarks_user ON user_recipe_bookmarks(user_id);")
        cursor.execute("CREATE INDEX idx_user_recipe_bookmarks_recipe ON user_recipe_bookmarks(recipe_id);")
        print("[OK] Created user_recipe_bookmarks table\n")

        # Create recipe_sources table (for future AI generation tracking)
        print("Creating recipe_sources table...")
        cursor.execute("DROP TABLE IF EXISTS recipe_sources CASCADE;")
        cursor.execute("""
            CREATE TABLE recipe_sources (
                id UUID PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                source_type VARCHAR(50) NOT NULL,
                url TEXT,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("[OK] Created recipe_sources table\n")

        # Create recipe_llm_jobs table (for AI generation job tracking)
        print("Creating recipe_llm_jobs table...")
        cursor.execute("DROP TABLE IF EXISTS recipe_llm_jobs CASCADE;")
        cursor.execute("""
            CREATE TABLE recipe_llm_jobs (
                id UUID PRIMARY KEY,
                status VARCHAR(50) DEFAULT 'pending',
                prompt TEXT,
                result JSONB,
                error TEXT,
                created_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("[OK] Created recipe_llm_jobs table\n")

        print("\n[SUCCESS] All recipe tables created successfully!")

    except Exception as e:
        print(f"[ERROR] {e}")
        raise

print("\nDone!")
