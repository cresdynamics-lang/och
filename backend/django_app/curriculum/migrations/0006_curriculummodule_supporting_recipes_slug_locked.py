# Generated manually to fix: column curriculummodules.supporting_recipes does not exist

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('curriculum', '0005_curriculumtrack_slug_title_order_thumbnail'),
    ]

    operations = [
        migrations.AddField(
            model_name='curriculummodule',
            name='supporting_recipes',
            field=models.JSONField(blank=True, default=list, help_text='Recipe slugs that support this module'),
        ),
        migrations.AddField(
            model_name='curriculummodule',
            name='slug',
            field=models.SlugField(blank=True, help_text='URL-friendly identifier', max_length=100),
        ),
        migrations.AddField(
            model_name='curriculummodule',
            name='is_locked_by_default',
            field=models.BooleanField(default=True, help_text='Whether module starts locked'),
        ),
    ]
