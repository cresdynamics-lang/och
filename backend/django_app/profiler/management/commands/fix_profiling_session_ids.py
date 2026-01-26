"""
Management command to fix invalid profiling_session_id values in the database.
"""
from django.core.management.base import BaseCommand
from django.db import connection
from users.models import User
import uuid


class Command(BaseCommand):
    help = 'Fix invalid profiling_session_id values in users table'

    def handle(self, *args, **options):
        self.stdout.write('Checking for invalid profiling_session_id values...')
        
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
                try:
                    # If it's already a valid UUID string, skip
                    if isinstance(profiling_session_id, str):
                        uuid.UUID(profiling_session_id)
                        continue
                    # If it's already a UUID object, skip
                    elif isinstance(profiling_session_id, uuid.UUID):
                        continue
                except (ValueError, TypeError, AttributeError):
                    # Invalid UUID - try to fix it
                    self.stdout.write(
                        self.style.WARNING(
                            f'Found invalid profiling_session_id for user {email}: {profiling_session_id}'
                        )
                    )
                    
                    # Try to find a valid session for this user
                    from profiler.models import ProfilerSession
                    valid_session = ProfilerSession.objects.filter(
                        user_id=user_id,
                        status='finished',
                        is_locked=True
                    ).order_by('-completed_at').first()
                    
                    if valid_session:
                        # Update with valid session ID
                        cursor.execute("""
                            UPDATE users 
                            SET profiling_session_id = %s::uuid
                            WHERE id = %s
                        """, [str(valid_session.id), user_id])
                        fixed_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'Fixed profiling_session_id for user {email}'
                            )
                        )
                    else:
                        # No valid session found - clear the invalid value
                        cursor.execute("""
                            UPDATE users 
                            SET profiling_session_id = NULL
                            WHERE id = %s
                        """, [user_id])
                        cleared_count += 1
                        self.stdout.write(
                            self.style.WARNING(
                                f'Cleared invalid profiling_session_id for user {email} (no valid session found)'
                            )
                        )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Fixed {fixed_count} invalid UUIDs, cleared {cleared_count} invalid values'
                )
            )

