# Generated manually to fix ProgrammingError: operator does not exist: bigint = uuid
# device_trust.user_id was created as bigint (FK to users.id) but the model uses to_field='uuid_id' (UUID).

from django.db import migrations, models


def alter_device_trust_user_id_to_uuid(apps, schema_editor):
    """Change device_trust.user_id from bigint to uuid, mapping via users.uuid_id."""
    if schema_editor.connection.vendor != "postgresql":
        return
    with schema_editor.connection.cursor() as cursor:
        # Drop the existing FK constraint
        cursor.execute("""
            DO $$
            DECLARE
                r RECORD;
            BEGIN
                FOR r IN (
                    SELECT conname FROM pg_constraint
                    WHERE conrelid = 'device_trust'::regclass
                    AND contype = 'f'
                    AND conname LIKE '%%user_id%%'
                ) LOOP
                    EXECUTE format('ALTER TABLE device_trust DROP CONSTRAINT IF EXISTS %I', r.conname);
                END LOOP;
            END $$;
        """)
        # Add temporary UUID column and backfill from users.uuid_id
        cursor.execute("""
            ALTER TABLE device_trust ADD COLUMN IF NOT EXISTS user_id_uuid uuid;
        """)
        cursor.execute("""
            UPDATE device_trust dt
            SET user_id_uuid = u.uuid_id
            FROM users u
            WHERE u.id = dt.user_id;
        """)
        # Drop old column and rename new one
        cursor.execute("ALTER TABLE device_trust DROP COLUMN user_id;")
        cursor.execute("ALTER TABLE device_trust RENAME COLUMN user_id_uuid TO user_id;")
        cursor.execute("ALTER TABLE device_trust ALTER COLUMN user_id SET NOT NULL;")
        # Re-add FK to users(uuid_id)
        cursor.execute("""
            ALTER TABLE device_trust
            ADD CONSTRAINT device_trust_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(uuid_id) ON DELETE CASCADE;
        """)


def reverse_alter(apps, schema_editor):
    """Reverse: convert uuid back to bigint (map users.uuid_id -> users.id)."""
    if schema_editor.connection.vendor != "postgresql":
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            ALTER TABLE device_trust DROP CONSTRAINT IF EXISTS device_trust_user_id_fkey;
        """)
        cursor.execute("ALTER TABLE device_trust ADD COLUMN user_id_old bigint;")
        cursor.execute("""
            UPDATE device_trust dt
            SET user_id_old = u.id
            FROM users u
            WHERE u.uuid_id = dt.user_id;
        """)
        cursor.execute("ALTER TABLE device_trust DROP COLUMN user_id;")
        cursor.execute("ALTER TABLE device_trust RENAME COLUMN user_id_old TO user_id;")
        cursor.execute("ALTER TABLE device_trust ALTER COLUMN user_id SET NOT NULL;")
        cursor.execute("""
            ALTER TABLE device_trust
            ADD CONSTRAINT device_trust_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        """)


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_sqlite_compatible'),
    ]

    operations = [
        migrations.RunPython(alter_device_trust_user_id_to_uuid, reverse_alter),
        # Ensure Django state: FK points to uuid_id (model already has to_field='uuid_id';
        # this migration only fixes the DB column type; no AlterField needed if model matches).
    ]
