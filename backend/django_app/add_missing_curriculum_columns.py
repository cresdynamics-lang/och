#!/usr/bin/env python
"""Add missing columns to curriculum tables."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection

print("Adding missing columns to curriculum tables...\n")

columns_to_add = [
    {
        'table': 'curriculummodules',
        'column': 'slug',
        'type': 'VARCHAR(100)',
        'default': "''",
        'nullable': False
    },
    {
        'table': 'curriculummodules',
        'column': 'tier',
        'type': 'INTEGER',
        'default': '2',
        'nullable': True
    },
    {
        'table': 'curriculummodules',
        'column': 'is_locked_by_default',
        'type': 'BOOLEAN',
        'default': 'TRUE',
        'nullable': False
    },
    {
        'table': 'curriculummodules',
        'column': 'competencies',
        'type': 'JSONB',
        'default': "'[]'::jsonb",
        'nullable': False
    },
    {
        'table': 'curriculummodules',
        'column': 'mentor_notes',
        'type': 'TEXT',
        'default': "''",
        'nullable': False
    },
]

with connection.cursor() as cursor:
    for col_info in columns_to_add:
        table = col_info['table']
        column = col_info['column']

        try:
            # Check if column exists
            cursor.execute(f"""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name='{table}'
                AND column_name='{column}';
            """)

            if cursor.fetchone():
                print(f"[SKIP] {table}.{column} already exists")
            else:
                # Build ALTER TABLE statement
                nullable = 'NULL' if col_info['nullable'] else 'NOT NULL'
                sql = f"""
                    ALTER TABLE {table}
                    ADD COLUMN {column} {col_info['type']} DEFAULT {col_info['default']} {nullable};
                """

                cursor.execute(sql)
                print(f"[OK] Added {table}.{column}")

        except Exception as e:
            print(f"[ERROR] Failed to add {table}.{column}: {e}")

print("\nDone!")
