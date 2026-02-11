# Generated merge migration to resolve conflicts

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('programs', '0002_initial'),
        ('programs', '0002_create_missing_tables'),
        ('programs', '0002_fix_director_uuid'),
    ]

    operations = [
        # This is a merge migration - no operations needed
        # All three 0002 migrations are now merged into this 0003 migration
    ]
