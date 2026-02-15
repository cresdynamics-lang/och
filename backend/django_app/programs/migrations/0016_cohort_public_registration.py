# Generated manually for cohort public registration (homepage)

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('programs', '0015_trackmentorassignment'),
    ]

    operations = [
        migrations.AddField(
            model_name='cohort',
            name='published_to_homepage',
            field=models.BooleanField(default=False, help_text='When True, cohort appears on homepage for students and sponsors to apply'),
        ),
        migrations.AddField(
            model_name='cohort',
            name='profile_image',
            field=models.ImageField(blank=True, null=True, upload_to='cohorts/profile_images/', help_text='Profile image for the cohort displayed on homepage'),
        ),
        migrations.AddField(
            model_name='cohort',
            name='registration_form_fields',
            field=models.JSONField(blank=True, default=dict, help_text='Director-customizable fields: {student: [...], sponsor: [...]}'),
        ),
        migrations.CreateModel(
            name='CohortPublicApplication',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('applicant_type', models.CharField(choices=[('student', 'Student'), ('sponsor', 'Sponsor')], max_length=20)),
                ('form_data', models.JSONField(default=dict, help_text='Data from the customized registration form')),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('converted', 'Converted')], default='pending', max_length=20)),
                ('notes', models.TextField(blank=True, help_text='Director notes when reviewing')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('cohort', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='public_applications', to='programs.cohort')),
            ],
            options={
                'db_table': 'cohort_public_applications',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='cohortpublicapplication',
            index=models.Index(fields=['cohort', 'applicant_type'], name='cohort_pub_cohort_app_idx'),
        ),
        migrations.AddIndex(
            model_name='cohortpublicapplication',
            index=models.Index(fields=['status'], name='cohort_pub_status_idx'),
        ),
    ]
