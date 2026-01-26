# Generated manually to add missing email verification columns
# This fixes ProgrammingErrors when columns don't exist in the database

from django.db import migrations


def add_missing_columns(apps, schema_editor):
    """Add missing email verification and token columns if they don't exist."""
    db_table = 'users'
    
    columns_to_add = [
        ('email_verification_token', 'VARCHAR(255) NULL'),
        ('verification_hash', 'VARCHAR(64) NULL'),
        ('token_expires_at', 'TIMESTAMP WITH TIME ZONE NULL'),
        ('password_reset_token', 'VARCHAR(255) NULL'),
        ('password_reset_token_created', 'TIMESTAMP WITH TIME ZONE NULL'),
    ]
    
    with schema_editor.connection.cursor() as cursor:
        for column_name, column_def in columns_to_add:
            # Check if column exists
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = %s AND column_name = %s
            """, [db_table, column_name])
            
            if cursor.fetchone() is None:
                # Column doesn't exist, add it
                cursor.execute(f"""
                    ALTER TABLE {db_table} 
                    ADD COLUMN {column_name} {column_def}
                """)
                print(f"✅ Added '{column_name}' column to {db_table} table")
            else:
                print(f"✅ Column '{column_name}' already exists")
        
        # Add indexes if columns exist and indexes don't
        # Check for verification_hash index
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
                cursor.execute(f"""
                    CREATE INDEX IF NOT EXISTS users_verification_hash_idx 
                    ON {db_table} (verification_hash)
                """)
                print("✅ Added index on 'verification_hash' column")
        
        # Check for token_expires_at index
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
                cursor.execute(f"""
                    CREATE INDEX IF NOT EXISTS users_token_expires_at_idx 
                    ON {db_table} (token_expires_at)
                """)
                print("✅ Added index on 'token_expires_at' column")


def remove_columns(apps, schema_editor):
    """Remove columns during reverse migration."""
    db_table = 'users'
    
    columns_to_remove = [
        'email_verification_token',
        'verification_hash',
        'token_expires_at',
        'password_reset_token',
        'password_reset_token_created',
    ]
    
    with schema_editor.connection.cursor() as cursor:
        for column_name in columns_to_remove:
            cursor.execute(f"""
                ALTER TABLE {db_table} 
                DROP COLUMN IF EXISTS {column_name}
            """)


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_rename_email_verification_token_created_user_email_token_created_at'),
    ]

    operations = [
        migrations.RunPython(
            add_missing_columns,
            reverse_code=remove_columns
        ),
    ]

