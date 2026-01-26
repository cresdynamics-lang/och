"""
Script to fix UUID issues in the database.
Run this directly to clean up any invalid UUID values.
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection
import uuid

def fix_invalid_uuids():
    """Fix invalid UUID values in profiling_session_id field."""
    print("Checking for invalid UUID values in profiling_session_id...")
    
    with connection.cursor() as cursor:
        # Get all users with profiling_session_id
        cursor.execute("""
            SELECT id, email, profiling_session_id 
            FROM users 
            WHERE profiling_session_id IS NOT NULL
        """)
        
        fixed_count = 0
        cleared_count = 0
        
        for row in cursor.fetchall():
            user_id, email, profiling_session_id = row
            
            # Try to validate the UUID
            is_valid = False
            try:
                if profiling_session_id:
                    # Try to create UUID object from the value
                    if isinstance(profiling_session_id, str):
                        uuid.UUID(profiling_session_id)
                    elif isinstance(profiling_session_id, uuid.UUID):
                        pass  # Already valid
                    is_valid = True
            except (ValueError, TypeError, AttributeError) as e:
                print(f"Invalid UUID for user {email}: {profiling_session_id} - {e}")
                is_valid = False
            
            if not is_valid:
                # Try to find a valid session for this user
                cursor.execute("""
                    SELECT id FROM profilersessions 
                    WHERE user_id = %s 
                    AND status = 'finished' 
                    AND is_locked = true
                    ORDER BY completed_at DESC 
                    LIMIT 1
                """, [user_id])
                
                session_row = cursor.fetchone()
                if session_row:
                    valid_session_id = session_row[0]
                    cursor.execute("""
                        UPDATE users 
                        SET profiling_session_id = %s::uuid
                        WHERE id = %s
                    """, [str(valid_session_id), user_id])
                    fixed_count += 1
                    print(f"Fixed profiling_session_id for user {email}")
                else:
                    # Clear the invalid value
                    cursor.execute("""
                        UPDATE users 
                        SET profiling_session_id = NULL
                        WHERE id = %s
                    """, [user_id])
                    cleared_count += 1
                    print(f"Cleared invalid profiling_session_id for user {email}")
        
        print(f"\nSummary:")
        print(f"  Fixed: {fixed_count}")
        print(f"  Cleared: {cleared_count}")
        print(f"  Total processed: {fixed_count + cleared_count}")

if __name__ == '__main__':
    fix_invalid_uuids()






