"""
Seed placeholder video (and optional guide) URLs for curriculum lessons that have none.
Use until final learning videos are available. Targets Tier 2 (Beginner) and Tier 3 (Intermediate) by default.
"""
from django.core.management.base import BaseCommand
from django.db.models import Q

from curriculum.models import Lesson, CurriculumTrack

# Stable public sample video URLs (no download required; embed or link)
PLACEHOLDER_VIDEO_URLS = [
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
]
# Optional: placeholder for guide/iframe content (e.g. static HTML or sample doc)
PLACEHOLDER_GUIDE_URL = "https://www.w3.org/WAI/WCAG21/Understanding/"


class Command(BaseCommand):
    help = "Set placeholder content_url on video (and optionally guide) lessons that have none. Optional: limit by tier."

    def add_arguments(self, parser):
        parser.add_argument(
            "--tier",
            type=int,
            default=None,
            help="Only update lessons in tracks of this tier (e.g. 2=Beginner, 3=Intermediate). Default: 2 and 3.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be updated without writing.",
        )
        parser.add_argument(
            "--guide",
            action="store_true",
            help="Also set placeholder URL on guide lessons that have no content_url.",
        )

    def handle(self, *args, **options):
        tier = options["tier"]
        dry_run = options["dry_run"]
        include_guide = options["guide"]

        tracks = CurriculumTrack.objects.filter(is_active=True)
        if tier is not None:
            tracks = tracks.filter(tier=tier)
        else:
            tracks = tracks.filter(tier__in=[2, 3])

        lesson_types = ["video"]
        if include_guide:
            lesson_types.append("guide")

        lessons = Lesson.objects.filter(
            module__track__in=tracks,
            lesson_type__in=lesson_types,
        ).filter(Q(content_url="") | Q(content_url__isnull=True))

        total = lessons.count()
        if total == 0:
            self.stdout.write("No lessons need a placeholder URL.")
            return

        self.stdout.write(f"Updating {total} lesson(s) with placeholder URL(s)...")
        placeholder_urls = PLACEHOLDER_VIDEO_URLS
        updated = 0
        for idx, lesson in enumerate(lessons):
            if lesson.lesson_type == "guide":
                url = PLACEHOLDER_GUIDE_URL
            else:
                url = placeholder_urls[idx % len(placeholder_urls)]
            if not dry_run:
                lesson.content_url = url
                lesson.save(update_fields=["content_url"])
            updated += 1
            self.stdout.write(f"  {'[dry-run] ' if dry_run else ''}{lesson.module.track.code} / {lesson.title[:50]} -> {url[:50]}...")

        self.stdout.write(self.style.SUCCESS(f"{'Would update' if dry_run else 'Updated'} {updated} lesson(s)."))
