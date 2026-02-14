# Generated manually for track-level mentor assignment

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('programs', '0003_merge_0002_initial_0002_create_missing_tables_0002_fix_director_uuid'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='TrackMentorAssignment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('role', models.CharField(choices=[('primary', 'Primary'), ('support', 'Support'), ('guest', 'Guest')], default='support', max_length=20)),
                ('assigned_at', models.DateTimeField(auto_now_add=True)),
                ('active', models.BooleanField(default=True)),
                ('mentor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='track_mentor_assignments', to=settings.AUTH_USER_MODEL)),
                ('track', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='mentor_assignments', to='programs.track')),
            ],
            options={
                'db_table': 'track_mentor_assignments',
                'ordering': ['-assigned_at'],
                'unique_together': {('track', 'mentor')},
            },
        ),
    ]
