# Generated manually for support app

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ProblemCode',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(db_index=True, max_length=32, unique=True)),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('category', models.CharField(
                    choices=[
                        ('auth', 'Authentication & Access'),
                        ('billing', 'Billing & Payments'),
                        ('curriculum', 'Curriculum & Learning'),
                        ('mentorship', 'Mentorship'),
                        ('technical', 'Technical / Bug'),
                        ('account', 'Account & Profile'),
                        ('platform', 'Platform General'),
                        ('other', 'Other'),
                    ],
                    db_index=True,
                    default='other',
                    max_length=32,
                )),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'support_problem_codes',
                'ordering': ['category', 'code'],
            },
        ),
        migrations.CreateModel(
            name='SupportTicket',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reporter_id', models.IntegerField(blank=True, db_index=True, null=True)),
                ('reporter_email', models.EmailField(blank=True, max_length=254)),
                ('reporter_name', models.CharField(blank=True, max_length=255)),
                ('subject', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('status', models.CharField(
                    choices=[
                        ('open', 'Open'),
                        ('in_progress', 'In Progress'),
                        ('pending_customer', 'Pending Customer'),
                        ('resolved', 'Resolved'),
                        ('closed', 'Closed'),
                    ],
                    db_index=True,
                    default='open',
                    max_length=32,
                )),
                ('priority', models.CharField(
                    choices=[
                        ('low', 'Low'),
                        ('medium', 'Medium'),
                        ('high', 'High'),
                        ('urgent', 'Urgent'),
                    ],
                    db_index=True,
                    default='medium',
                    max_length=32,
                )),
                ('internal_notes', models.TextField(blank=True)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('resolution_notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('assigned_to', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='assigned_support_tickets',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('created_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='created_support_tickets',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('problem_code', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='tickets',
                    to='support.problemcode',
                )),
            ],
            options={
                'db_table': 'support_tickets',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='problemcode',
            index=models.Index(fields=['category', 'is_active'], name='support_pro_category_7a0f0d_idx'),
        ),
        migrations.AddIndex(
            model_name='supportticket',
            index=models.Index(fields=['status', '-created_at'], name='support_ti_status_8b0e2a_idx'),
        ),
        migrations.AddIndex(
            model_name='supportticket',
            index=models.Index(fields=['priority', 'status'], name='support_ti_priorit_9c1f3b_idx'),
        ),
        migrations.AddIndex(
            model_name='supportticket',
            index=models.Index(fields=['assigned_to', 'status'], name='support_ti_assigne_d2e4a5_idx'),
        ),
    ]
