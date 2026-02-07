#!/usr/bin/env python3
"""Check subscription schema vs model."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection
from subscriptions.models import SubscriptionPlan

print("Checking subscription_plans schema...")

with connection.cursor() as cursor:
    # Get actual columns in database
    cursor.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'subscription_plans'
        ORDER BY ordinal_position;
    """)

    db_columns = {row[0]: row[1] for row in cursor.fetchall()}

    print("\n[DATABASE COLUMNS]")
    for col, dtype in db_columns.items():
        print(f"  {col:30} {dtype}")

# Get model fields
print("\n[MODEL FIELDS]")
for field in SubscriptionPlan._meta.fields:
    print(f"  {field.name:30} {field.get_internal_type()}")

# Compare
print("\n[COMPARISON]")
model_fields = {f.name for f in SubscriptionPlan._meta.fields}
db_cols = set(db_columns.keys())

missing_in_db = model_fields - db_cols
missing_in_model = db_cols - model_fields

if missing_in_db:
    print(f"\nMissing in database: {missing_in_db}")
if missing_in_model:
    print(f"\nExtra in database (not in model): {missing_in_model}")

if not missing_in_db and not missing_in_model:
    print("\n[OK] Schema matches!")
