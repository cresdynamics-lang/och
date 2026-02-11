# Generated migration for profiler_session_id field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0001_initial'),  # Adjust based on your actual migration history
    ]

    operations = [
        migrations.AddField(
            model_name='portfolioitem',
            name='profiler_session_id',
            field=models.UUIDField(blank=True, db_index=True, help_text='Link to profiler session that created this entry', null=True),
        ),
    ]
