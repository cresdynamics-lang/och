# Generated manually for ManualFinanceInvoice (Finance create-invoice)

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('sponsors', '0003_revenuesharetracking_sponsorcohortbilling_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ManualFinanceInvoice',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('sponsor_name', models.CharField(help_text='Client / sponsor name', max_length=255)),
                ('amount_kes', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('currency', models.CharField(default='KES', max_length=3)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('paid', 'Paid'), ('waived', 'Waived')], default='pending', max_length=20)),
                ('line_items', models.JSONField(blank=True, default=list)),
                ('due_date', models.DateField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='manual_invoices_created', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'manual_finance_invoices',
                'ordering': ['-created_at'],
            },
        ),
    ]
