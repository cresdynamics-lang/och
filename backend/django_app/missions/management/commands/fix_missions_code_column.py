"""
Management command to fix missing code column in missions table.
"""
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Add code column to missions table if it does not exist'

    def handle(self, *args, **options):
        db_table = 'missions'
        
        with connection.cursor() as cursor:
            # Check if column exists
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name=%s AND column_name='code'
            """, [db_table])
            
            column_exists = cursor.fetchone() is not None
            
            if not column_exists:
                self.stdout.write(f"Adding 'code' column to '{db_table}' table...")
                try:
                    # Add the column manually using raw SQL
                    cursor.execute("""
                        ALTER TABLE missions 
                        ADD COLUMN code VARCHAR(50) UNIQUE
                    """)
                    
                    # Create index
                    cursor.execute("""
                        CREATE INDEX IF NOT EXISTS missions_code_idx ON missions(code)
                    """)
                    
                    self.stdout.write(
                        self.style.SUCCESS(f"✅ Successfully added 'code' column to '{db_table}' table")
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f"❌ Error adding column: {e}")
                    )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f"✅ Column 'code' already exists in '{db_table}' table")
                )
                
            # Show all columns for debugging
            cursor.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name=%s 
                ORDER BY column_name
            """, [db_table])
            
            columns = cursor.fetchall()
            self.stdout.write(f"\nCurrent columns in '{db_table}' table:")
            for col_name, col_type in columns:
                self.stdout.write(f"  - {col_name} ({col_type})")

