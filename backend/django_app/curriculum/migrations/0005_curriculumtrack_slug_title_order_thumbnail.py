# Generated manually to fix: column curriculum_tracks.slug does not exist

from django.db import migrations, models


def backfill_slug_from_code(apps, schema_editor):
    CurriculumTrack = apps.get_model('curriculum', 'CurriculumTrack')
    for track in CurriculumTrack.objects.filter(slug__isnull=True):
        track.slug = (track.code or '').lower().replace(' ', '-').replace('_', '-') or 'track'
        # Ensure uniqueness
        base = track.slug
        n = 1
        while CurriculumTrack.objects.filter(slug=track.slug).exclude(id=track.id).exists():
            track.slug = f'{base}-{n}'
            n += 1
        track.save(update_fields=['slug'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('curriculum', '0004_crosstrackprogramprogress_crosstracksubmission'),
    ]

    operations = [
        migrations.AddField(
            model_name='curriculumtrack',
            name='slug',
            field=models.SlugField(help_text="'defender', 'offensive', 'grc', 'innovation', 'leadership'", max_length=50, null=True, unique=False),
        ),
        migrations.AddField(
            model_name='curriculumtrack',
            name='title',
            field=models.CharField(default='', help_text='Display title', max_length=255),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='curriculumtrack',
            name='order_number',
            field=models.IntegerField(default=1, help_text='Display order'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='curriculumtrack',
            name='thumbnail_url',
            field=models.URLField(blank=True, default='', help_text='Track thumbnail image'),
            preserve_default=True,
        ),
        migrations.RunPython(backfill_slug_from_code, noop),
        migrations.AlterField(
            model_name='curriculumtrack',
            name='slug',
            field=models.SlugField(help_text="'defender', 'offensive', 'grc', 'innovation', 'leadership'", max_length=50, unique=True),
        ),
    ]
