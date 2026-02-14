# Generated manually - mentor assignment to curriculum track (no program link required)

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('curriculum', '0014_curriculumvideo_curriculumquiz'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CurriculumTrackMentorAssignment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('role', models.CharField(choices=[('primary', 'Primary'), ('support', 'Support'), ('guest', 'Guest')], default='support', max_length=20)),
                ('assigned_at', models.DateTimeField(auto_now_add=True)),
                ('active', models.BooleanField(default=True)),
                ('curriculum_track', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='mentor_assignments', to='curriculum.curriculumtrack')),
                ('mentor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='curriculum_track_mentor_assignments', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'curriculum_track_mentor_assignments',
                'ordering': ['-assigned_at'],
                'unique_together': {('curriculum_track', 'mentor')},
            },
        ),
    ]
