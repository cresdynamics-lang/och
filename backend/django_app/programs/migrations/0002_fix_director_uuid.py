from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('programs', '0001_initial'),  # Replace with your latest migration
        ('users', '0001_initial'),
    ]

    operations = [
        # Remove the old foreign key
        migrations.RunSQL(
            "ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_director_id_fkey;",
            reverse_sql="-- No reverse needed"
        ),
        
        # Change the column type
        migrations.RunSQL(
            "ALTER TABLE tracks ALTER COLUMN director_id TYPE VARCHAR(36);",
            reverse_sql="ALTER TABLE tracks ALTER COLUMN director_id TYPE BIGINT;"
        ),
        
        # Add the foreign key back with correct reference
        migrations.RunSQL(
            "ALTER TABLE tracks ADD CONSTRAINT tracks_director_id_fkey FOREIGN KEY (director_id) REFERENCES users(id) ON DELETE SET NULL;",
            reverse_sql="ALTER TABLE tracks DROP CONSTRAINT tracks_director_id_fkey;"
        ),
    ]