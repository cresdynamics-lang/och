#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection

def add_missing_columns():
    with connection.cursor() as cursor:
        # Check if columns exist first
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'user_track_progress' 
            AND column_name IN ('tier2_quizzes_passed', 'tier2_mini_missions_completed', 'tier2_reflections_submitted', 'tier2_mentor_approval', 'tier2_completion_requirements_met');
        """)
        existing_columns = [row[0] for row in cursor.fetchall()]
        
        columns_to_add = [
            ('tier2_quizzes_passed', 'INTEGER DEFAULT 0'),
            ('tier2_mini_missions_completed', 'INTEGER DEFAULT 0'), 
            ('tier2_reflections_submitted', 'INTEGER DEFAULT 0'),
            ('tier2_mentor_approval', 'BOOLEAN DEFAULT FALSE'),
            ('tier2_completion_requirements_met', 'BOOLEAN DEFAULT FALSE')
        ]
        
        for column_name, column_def in columns_to_add:
            if column_name not in existing_columns:
                try:
                    cursor.execute(f'ALTER TABLE user_track_progress ADD COLUMN {column_name} {column_def};')
                    print(f'Added column: {column_name}')
                except Exception as e:
                    print(f'Error adding {column_name}: {e}')
            else:
                print(f'Column {column_name} already exists')
        
        # Add index for tier2_completion_requirements_met if it doesn't exist
        try:
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_user_track_progress_tier2_completion 
                ON user_track_progress(tier2_completion_requirements_met);
            """)
            print('Added index for tier2_completion_requirements_met')
        except Exception as e:
            print(f'Error adding index: {e}')

if __name__ == '__main__':
    add_missing_columns()
    print('Database schema update completed!')