# Add missing CurriculumTrack fields used by current model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("curriculum", "0008_curriculumtrack_slug_title"),
    ]

    operations = [
        migrations.AddField(
            model_name="curriculumtrack",
            name="thumbnail_url",
            field=models.URLField(blank=True, help_text="Track thumbnail image"),
        ),
        migrations.AddField(
            model_name="curriculumtrack",
            name="order_number",
            field=models.IntegerField(default=1, help_text="Display order"),
        ),
    ]

