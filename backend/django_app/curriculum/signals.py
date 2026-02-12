"""
Signals for Curriculum Engine — keeps denormalized counts in sync.
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


@receiver([post_save, post_delete], sender='curriculum.Lesson')
def update_module_lesson_count(sender, instance, **kwargs):
    """Keep CurriculumModule.lesson_count in sync whenever a Lesson is saved/deleted."""
    module = instance.module
    if module:
        count = module.lessons.count()
        module.lesson_count = count
        module.save(update_fields=['lesson_count'])
