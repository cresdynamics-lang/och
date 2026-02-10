# Fix: user_subscriptions.user_id must be UUID to match User.uuid_id (FK to_field='uuid_id')
# Error was: operator does not exist: character varying = uuid

from django.db import migrations


def alter_user_id_to_uuid(apps, schema_editor):
    """Alter user_subscriptions.user_id from VARCHAR to UUID if needed."""
    if schema_editor.connection.vendor != 'postgresql':
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            SELECT data_type FROM information_schema.columns
            WHERE table_name = 'user_subscriptions' AND column_name = 'user_id';
        """)
        row = cursor.fetchone()
        if row and row[0].lower() != 'uuid':
            # Column is not UUID; convert (values must be valid UUID strings or integer IDs)
            cursor.execute("""
                ALTER TABLE user_subscriptions
                ALTER COLUMN user_id TYPE UUID
                USING (
                    CASE
                        WHEN user_id ~ '^[0-9]+$' THEN (SELECT uuid_id FROM users WHERE users.id = (user_id::bigint) LIMIT 1)
                        ELSE user_id::uuid
                    END
                );
            """)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0002_initial'),
    ]

    operations = [
        migrations.RunPython(alter_user_id_to_uuid, noop_reverse),
    ]
