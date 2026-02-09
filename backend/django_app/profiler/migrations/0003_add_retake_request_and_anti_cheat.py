# Generated migration for ProfilerRetakeRequest model and anti-cheat fields

from django.db import migrations, models
import django.db.models.deletion
import django.core.validators
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),  # Adjust based on your actual migration
        ('profiler', '0002_initial'),
    ]

    operations = [
        # Add anti-cheat fields to ProfilerSession
        migrations.AddField(
            model_name='profilersession',
            name='ip_address',
            field=models.GenericIPAddressField(blank=True, help_text='IP address of session start', null=True),
        ),
        migrations.AddField(
            model_name='profilersession',
            name='user_agent',
            field=models.TextField(blank=True, help_text='User agent string for device fingerprinting'),
        ),
        migrations.AddField(
            model_name='profilersession',
            name='device_fingerprint',
            field=models.CharField(blank=True, db_index=True, help_text='Device/browser fingerprint hash', max_length=255),
        ),
        migrations.AddField(
            model_name='profilersession',
            name='response_times',
            field=models.JSONField(blank=True, default=list, help_text='Response times in ms for each question: [{question_id: "...", time_ms: 1234}]'),
        ),
        migrations.AddField(
            model_name='profilersession',
            name='suspicious_patterns',
            field=models.JSONField(blank=True, default=list, help_text='Detected suspicious patterns: ["too_fast", "identical_responses", ...]'),
        ),
        migrations.AddField(
            model_name='profilersession',
            name='anti_cheat_score',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='Anti-cheat confidence score (0-100, higher = more suspicious)', max_digits=5, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)]),
        ),
        
        # Create ProfilerRetakeRequest model
        migrations.CreateModel(
            name='ProfilerRetakeRequest',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('reason', models.TextField(help_text='User-provided reason for retake request')),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('completed', 'Completed')], db_index=True, default='pending', max_length=20)),
                ('admin_notes', models.TextField(blank=True, help_text='Admin notes on approval/rejection')),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('admin_reset_by', models.ForeignKey(blank=True, help_text='Admin who reset this session', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='profiler_resets', to='users.user')),
                ('new_session', models.ForeignKey(blank=True, help_text='New session created after approval', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='retake_from_request', to='profiler.profilersession')),
                ('original_session', models.ForeignKey(blank=True, help_text='Original session that was locked', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='retake_requests', to='profiler.profilersession')),
                ('reviewed_by', models.ForeignKey(blank=True, help_text='Admin who reviewed this request', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='profiler_retake_reviews', to='users.user')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='profiler_retake_requests', to='users.user')),
            ],
            options={
                'db_table': 'profilerretakerequests',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='profilerretakerequest',
            index=models.Index(fields=['user', 'status'], name='profilerret_user_id_status_idx'),
        ),
        migrations.AddIndex(
            model_name='profilerretakerequest',
            index=models.Index(fields=['status', 'created_at'], name='profilerret_status_created_idx'),
        ),
    ]
