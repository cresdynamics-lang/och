#!/usr/bin/env python
"""
Create foundations_modules table
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection

print("=" * 70)
print("CREATE FOUNDATIONS_MODULES TABLE")
print("=" * 70)

sql = """
CREATE TABLE IF NOT EXISTS foundations_modules (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    module_type VARCHAR(20) DEFAULT 'video' NOT NULL,
    video_url TEXT,
    diagram_url TEXT,
    content TEXT DEFAULT '',
    "order" INTEGER DEFAULT 0 NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE NOT NULL,
    estimated_minutes INTEGER DEFAULT 10 NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS foundations_modules_order_idx ON foundations_modules("order");
CREATE INDEX IF NOT EXISTS foundations_modules_is_active_idx ON foundations_modules(is_active);
CREATE INDEX IF NOT EXISTS foundations_modules_module_type_idx ON foundations_modules(module_type);
"""

try:
    with connection.cursor() as cursor:
        cursor.execute(sql)
    print("[OK] foundations_modules table created successfully")
except Exception as e:
    print(f"[ERROR] Error creating table: {e}")
    sys.exit(1)

print("=" * 70)
