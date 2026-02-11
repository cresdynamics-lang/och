# Add slug and title to CurriculumTrack (required by seed_all_tracks)

from django.db import migrations, models


def backfill_slug_title(apps, schema_editor):
    CurriculumTrack = apps.get_model("curriculum", "CurriculumTrack")
    for t in CurriculumTrack.objects.all():
        if not getattr(t, "slug", ""):
            t.slug = (t.code or "").lower().replace(" ", "_")[:50]
        if not getattr(t, "title", ""):
            t.title = t.name or t.code or ""
        t.save(update_fields=["slug", "title"])


class Migration(migrations.Migration):

    dependencies = [
        ("curriculum", "0007_tier3_completion_config"),
    ]

    operations = [
        migrations.AddField(
            model_name="curriculumtrack",
            name="slug",
            field=models.SlugField(blank=True, default="", max_length=50),
        ),
        migrations.AddField(
            model_name="curriculumtrack",
            name="title",
            field=models.CharField(
                blank=True, default="", help_text="Display title", max_length=255
            ),
        ),
        migrations.RunPython(backfill_slug_title, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="curriculumtrack",
            name="slug",
            field=models.SlugField(
                unique=True,
                max_length=50,
                help_text="'defender', 'offensive', 'grc', 'innovation', 'leadership'",
            ),
        ),
    ]
