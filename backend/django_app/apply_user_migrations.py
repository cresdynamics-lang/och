#!/usr/bin/env python
"""
Script to safely apply user migrations even if columns are missing.
This can be run directly to fix the database schema.
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection

def apply_migrations():
    """Apply user migrations manually to fix missing columns."""
    db_table = 'users'
    
    with connection.cursor() as cursor:
        print("🔍 Checking database schema...")
        
        # Check current state - get all relevant columns
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = %s 
            AND column_name IN (
                'email_verification_token_created',
                'email_token_created_at',
                'email_verification_token',
                'verification_hash',
                'token_expires_at',
                'password_reset_token',
                'password_reset_token_created'
            )
            ORDER BY column_name
        """, [db_table])
        
        existing_columns = {row[0] for row in cursor.fetchall()}
        print(f"📊 Existing columns: {sorted(existing_columns)}")
        
        # Step 1: Rename email_verification_token_created if it exists
        if 'email_verification_token_created' in existing_columns and 'email_token_created_at' not in existing_columns:
            print("🔄 Renaming 'email_verification_token_created' to 'email_token_created_at'...")
            cursor.execute("""
                ALTER TABLE users 
                RENAME COLUMN email_verification_token_created TO email_token_created_at
            """)
            print("✅ Renamed successfully")
            existing_columns.discard('email_verification_token_created')
            existing_columns.add('email_token_created_at')
        elif 'email_token_created_at' in existing_columns:
            print("✅ 'email_token_created_at' already exists")
        else:
            print("➕ Creating 'email_token_created_at' column...")
            cursor.execute("""
                ALTER TABLE users 
                ADD COLUMN email_token_created_at TIMESTAMP WITH TIME ZONE NULL
            """)
            print("✅ Created successfully")
            existing_columns.add('email_token_created_at')
        
        # Step 2: Add missing columns
        columns_to_add = [
            ('email_verification_token', 'VARCHAR(255) NULL'),
            ('verification_hash', 'VARCHAR(64) NULL'),
            ('token_expires_at', 'TIMESTAMP WITH TIME ZONE NULL'),
            ('password_reset_token', 'VARCHAR(255) NULL'),
            ('password_reset_token_created', 'TIMESTAMP WITH TIME ZONE NULL'),
        ]
        
        for column_name, column_def in columns_to_add:
            if column_name not in existing_columns:
                print(f"➕ Adding '{column_name}' column...")
                cursor.execute(f"""
                    ALTER TABLE {db_table} 
                    ADD COLUMN {column_name} {column_def}
                """)
                print(f"✅ Added '{column_name}' successfully")
            else:
                print(f"✅ Column '{column_name}' already exists")
        
        # Step 3: Add indexes
        # Use %% to escape % in LIKE patterns
        cursor.execute("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = %s AND indexname LIKE %s
        """, [db_table, '%verification_hash%'])
        
        if not cursor.fetchone():
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = %s AND column_name = 'verification_hash'
            """, [db_table])
            if cursor.fetchone():
                print("➕ Creating index on 'verification_hash'...")
                cursor.execute(f"""
                    CREATE INDEX IF NOT EXISTS users_verification_hash_idx 
                    ON {db_table} (verification_hash)
                """)
                print("✅ Index created")
        
        cursor.execute("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = %s AND indexname LIKE %s
        """, [db_table, '%token_expires_at%'])
        
        if not cursor.fetchone():
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = %s AND column_name = 'token_expires_at'
            """, [db_table])
            if cursor.fetchone():
                print("➕ Creating index on 'token_expires_at'...")
                cursor.execute(f"""
                    CREATE INDEX IF NOT EXISTS users_token_expires_at_idx 
                    ON {db_table} (token_expires_at)
                """)
                print("✅ Index created")
        
        print("\n✅ All columns and indexes are now in place!")
        print("📝 Next step: Run 'python manage.py migrate users' to update Django's migration state")

if __name__ == '__main__':
    try:
        apply_migrations()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


