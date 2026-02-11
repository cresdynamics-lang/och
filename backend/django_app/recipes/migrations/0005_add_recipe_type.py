# Generated migration for Recipe recipe_type field
# Date: 2026-02-09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('recipes', '0004_recipe_inputs_recipe_steps_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='recipe',
            name='recipe_type',
            field=models.CharField(
                choices=[
                    ('technical', 'Technical'),
                    ('analysis', 'Analysis'),
                    ('documentation', 'Documentation'),
                    ('leadership', 'Leadership'),
                    ('decision', 'Decision'),
                    ('innovation', 'Innovation'),
                ],
                db_index=True,
                default='technical',
                help_text='Recipe type: technical/analysis/documentation/leadership/decision/innovation',
                max_length=20
            ),
        ),
    ]
