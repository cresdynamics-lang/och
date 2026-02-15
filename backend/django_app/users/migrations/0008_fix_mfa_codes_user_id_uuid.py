# Fix mfa_codes.user_id: column was created as bigint (FK to users.id) but model uses to_field='uuid_id' (UUID).

from django.db import migrations


def alter_mfa_codes_user_id_to_uuid(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            DO $$
            DECLARE
                r RECORD;
            BEGIN
                FOR r IN (
                    SELECT conname FROM pg_constraint
                    WHERE conrelid = 'mfa_codes'::regclass
                    AND contype = 'f'
                    AND conname LIKE '%%user_id%%'
                ) LOOP
                    EXECUTE format('ALTER TABLE mfa_codes DROP CONSTRAINT IF EXISTS %I', r.conname);
                END LOOP;
            END $$;
        """)
        cursor.execute("ALTER TABLE mfa_codes ADD COLUMN IF NOT EXISTS user_id_uuid uuid;")
        cursor.execute("""
            UPDATE mfa_codes mc
            SET user_id_uuid = u.uuid_id
            FROM users u
            WHERE u.id = mc.user_id;
        """)
        cursor.execute("ALTER TABLE mfa_codes DROP COLUMN user_id;")
        cursor.execute("ALTER TABLE mfa_codes RENAME COLUMN user_id_uuid TO user_id;")
        cursor.execute("ALTER TABLE mfa_codes ALTER COLUMN user_id SET NOT NULL;")
        cursor.execute("""
            ALTER TABLE mfa_codes
            ADD CONSTRAINT mfa_codes_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(uuid_id) ON DELETE CASCADE;
        """)


def reverse_alter(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("ALTER TABLE mfa_codes DROP CONSTRAINT IF EXISTS mfa_codes_user_id_fkey;")
        cursor.execute("ALTER TABLE mfa_codes ADD COLUMN user_id_old bigint;")
        cursor.execute("""
            UPDATE mfa_codes mc
            SET user_id_old = u.id
            FROM users u
            WHERE u.uuid_id = mc.user_id;
        """)
        cursor.execute("ALTER TABLE mfa_codes DROP COLUMN user_id;")
        cursor.execute("ALTER TABLE mfa_codes RENAME COLUMN user_id_old TO user_id;")
        cursor.execute("ALTER TABLE mfa_codes ALTER COLUMN user_id SET NOT NULL;")
        cursor.execute("""
            ALTER TABLE mfa_codes
            ADD CONSTRAINT mfa_codes_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        """)


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_fix_device_trust_user_id_uuid'),
    ]

    operations = [
        migrations.RunPython(alter_mfa_codes_user_id_to_uuid, reverse_alter),
    ]
