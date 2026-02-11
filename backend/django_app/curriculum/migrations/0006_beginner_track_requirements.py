# Beginner Track requirements: progression_mode, lesson bookmarks, mentor feedback

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('curriculum', '0005_curriculumtrack_tier2_completion_config'),
    ]

    operations = [
        migrations.AddField(
            model_name='curriculumtrack',
            name='progression_mode',
            field=models.CharField(
                choices=[('sequential', 'Sequential'), ('flexible', 'Flexible')],
                default='sequential',
                help_text='Sequential = unlock modules in order; Flexible = all modules available',
                max_length=20
            ),
        ),
        migrations.CreateModel(
            name='UserLessonBookmark',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('lesson', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bookmarked_by', to='curriculum.lesson')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lesson_bookmarks', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Lesson Bookmark',
                'verbose_name_plural': 'Lesson Bookmarks',
                'db_table': 'user_lesson_bookmarks',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='CurriculumMentorFeedback',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('comment_text', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('learner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='curriculum_feedback_received', to=settings.AUTH_USER_MODEL)),
                ('lesson', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='mentor_feedback', to='curriculum.lesson')),
                ('mentor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='curriculum_feedback_given', to=settings.AUTH_USER_MODEL)),
                ('module', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='mentor_feedback', to='curriculum.curriculummodule')),
            ],
            options={
                'verbose_name': 'Curriculum Mentor Feedback',
                'verbose_name_plural': 'Curriculum Mentor Feedback',
                'db_table': 'curriculum_mentor_feedback',
            },
        ),
        migrations.AddConstraint(
            model_name='userlessonbookmark',
            constraint=models.UniqueConstraint(fields=('user', 'lesson'), name='unique_user_lesson_bookmark'),
        ),
    ]
