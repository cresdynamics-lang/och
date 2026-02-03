# Simple migration for programs

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.RunSQL(
            """
            CREATE TABLE IF NOT EXISTS programs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(200) NOT NULL,
                category VARCHAR(20) NOT NULL DEFAULT 'technical',
                categories JSONB DEFAULT '[]',
                description TEXT DEFAULT '',
                duration_months INTEGER NOT NULL DEFAULT 6,
                default_price DECIMAL(10,2) DEFAULT 0.00,
                currency VARCHAR(3) DEFAULT 'USD',
                outcomes JSONB DEFAULT '[]',
                structure JSONB DEFAULT '{}',
                missions_registry_link TEXT DEFAULT '',
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            """,
            reverse_sql="DROP TABLE IF EXISTS programs;"
        ),
    ]