"""
Management command to create mission_progress and mission_files tables if they do not exist.
Fixes: ProgrammingError - relation "mission_progress" does not exist
"""
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Create mission_progress and mission_files tables if they do not exist'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Check if mission_progress exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'mission_progress'
                );
            """)
            if cursor.fetchone()[0]:
                self.stdout.write(self.style.SUCCESS('mission_progress table already exists.'))
            else:
                self.stdout.write('Creating mission_progress table...')
                cursor.execute("""
                    CREATE TABLE mission_progress (
                        id UUID PRIMARY KEY,
                        user_id UUID NOT NULL,
                        mission_id UUID NOT NULL,
                        status VARCHAR(20) NOT NULL DEFAULT 'locked',
                        current_subtask INTEGER NOT NULL DEFAULT 1,
                        subtasks_progress JSONB DEFAULT '{}'::jsonb,
                        started_at TIMESTAMP WITH TIME ZONE,
                        submitted_at TIMESTAMP WITH TIME ZONE,
                        ai_score DECIMAL(5, 2),
                        mentor_score DECIMAL(5, 2),
                        final_status VARCHAR(20),
                        reflection TEXT DEFAULT '',
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        UNIQUE(mission_id, user_id)
                    );
                """)
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_mp_user_status ON mission_progress(user_id, status);")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_mp_mission_status ON mission_progress(mission_id, status);")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_mp_user_mission ON mission_progress(user_id, mission_id);")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_mp_user_final ON mission_progress(user_id, final_status);")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_mp_submitted ON mission_progress(submitted_at);")
                self.stdout.write(self.style.SUCCESS('mission_progress table created.'))

            # Check if mission_files exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'mission_files'
                );
            """)
            if cursor.fetchone()[0]:
                self.stdout.write(self.style.SUCCESS('mission_files table already exists.'))
            else:
                self.stdout.write('Creating mission_files table...')
                cursor.execute("""
                    CREATE TABLE mission_files (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        mission_progress_id UUID NOT NULL REFERENCES mission_progress(id) ON DELETE CASCADE,
                        subtask_number INTEGER NOT NULL,
                        file_url VARCHAR(500) NOT NULL,
                        file_type VARCHAR(50) DEFAULT 'other',
                        filename VARCHAR(255) NOT NULL,
                        file_size BIGINT,
                        metadata JSONB DEFAULT '{}'::jsonb,
                        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """)
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_mf_progress_subtask ON mission_files(mission_progress_id, subtask_number);")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_mf_progress_uploaded ON mission_files(mission_progress_id, uploaded_at);")
                self.stdout.write(self.style.SUCCESS('mission_files table created.'))

        self.stdout.write(self.style.SUCCESS('Done. mission_progress and mission_files are ready.'))
