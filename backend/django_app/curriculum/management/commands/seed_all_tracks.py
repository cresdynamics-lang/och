"""
Management command to seed comprehensive curriculum data for all 5 OCH tracks.
Tiers covered: Beginner (Tier 2), Intermediate (Tier 3), Advanced (Tier 4), Mastery (Tier 5).
"""
import uuid
from django.core.management.base import BaseCommand
from django.utils import timezone
from curriculum.models import (
    CurriculumTrack, CurriculumModule, Lesson, ModuleMission,
    RecipeRecommendation
)

class Command(BaseCommand):
    help = 'Seed comprehensive curriculum data for all 5 OCH tracks across 4 tiers'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing curriculum data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing curriculum data...')
            CurriculumTrack.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Cleared existing data'))

        self.stdout.write('Seeding comprehensive OCH curriculum data...')

        # Spec-aligned descriptions for Tier 2 (Beginner) — see docs/BEGINNER_TRACKS_SPEC.md
        beginner_descriptions = {
            'DEFENDER': 'Introductory SOC, monitoring, basic detection concepts.',
            'OFFENSIVE': 'Ethical hacking fundamentals, reconnaissance, attacker mindset.',
            'GRC': 'Governance, compliance basics, documentation, risk principles.',
            'INNOVATION': 'Cloud basics, scripting fundamentals, intro to automation.',
            'LEADERSHIP': 'Professional identity, VIP foundation, communication, decision basics.',
        }
        tracks_data = [
            {
                'code': 'DEFENDER',
                'name': 'Cyber Defender',
                'description': 'Master defensive security operations, threat detection, and incident response.',
                'beginner_description': beginner_descriptions['DEFENDER'],
                'icon': 'shield',
                'color': 'indigo',
            },
            {
                'code': 'OFFENSIVE',
                'name': 'Offensive Security',
                'description': 'Learn the art of ethical hacking, penetration testing, and red teaming.',
                'beginner_description': beginner_descriptions['OFFENSIVE'],
                'icon': 'zap',
                'color': 'crimson',
            },
            {
                'code': 'GRC',
                'name': 'GRC & Risk',
                'description': 'Governance, Risk, and Compliance. Master the strategic and regulatory side of cyber.',
                'beginner_description': beginner_descriptions['GRC'],
                'icon': 'file-text',
                'color': 'emerald',
            },
            {
                'code': 'INNOVATION',
                'name': 'Security Innovation',
                'description': 'Cloud security, DevSecOps, and building secure-by-design future systems.',
                'beginner_description': beginner_descriptions['INNOVATION'],
                'icon': 'rocket',
                'color': 'cyan',
            },
            {
                'code': 'LEADERSHIP',
                'name': 'VIP Leadership',
                'description': 'Value, Impact, and Purpose. Developing the next generation of cyber executives.',
                'beginner_description': beginner_descriptions['LEADERSHIP'],
                'icon': 'award',
                'color': 'gold',
            },
        ]

        tiers = [
            (2, 'Beginner', 'entry'),
            (3, 'Intermediate', 'intermediate'),
            (4, 'Advanced', 'advanced'),
            (5, 'Mastery', 'advanced'),
        ]

        for track_info in tracks_data:
            for tier_num, tier_name, level_choice in tiers:
                track_code = f"{track_info['code']}_{tier_num}"
                track_name = f"{track_info['name']} - {tier_name}"
                
                # Tier 2 (Beginner) uses spec-exact category descriptions
                if tier_num == 2 and track_info.get('beginner_description'):
                    desc = f"Beginner — {track_info['name']}. {track_info['beginner_description']}"
                else:
                    desc = f"{tier_name} level training for {track_info['name']}. {track_info['description']}"
                track, created = CurriculumTrack.objects.update_or_create(
                    code=track_code,
                    defaults={
                        # Must be unique across tiers
                        'slug': f"{track_info['code'].lower()}-{tier_num}",
                        'name': track_name,
                        'title': track_name,
                        'description': desc,
                        'tier': tier_num,
                        'icon': track_info['icon'],
                        'color': track_info['color'],
                        'estimated_duration_weeks': 4 + tier_num,
                        'is_active': True,
                    }
                )
                self.stdout.write(f"{'Created' if created else 'Updated'} track: {track.name}")

                # Create 3-5 modules per track per tier (Tier 3: 4 modules × 5 videos ≈ 20 intermediate videos)
                num_modules = 4 if tier_num == 3 else 3
                for m_idx in range(1, num_modules + 1):
                    module, _ = CurriculumModule.objects.update_or_create(
                        track=track,
                        track_key=track_code,
                        order_index=m_idx,
                        defaults={
                            'title': f"{tier_name} {track_info['name']} Module {m_idx}",
                            'description': f"Core concepts and practical skills for {track_info['name']} at the {tier_name} level.",
                            'level': 'beginner' if tier_num == 2 else ('intermediate' if tier_num == 3 else 'advanced'),
                            'entitlement_tier': 'all' if tier_num == 2 else ('starter_enhanced' if tier_num == 3 else 'professional'),
                            'is_core': True,
                            'is_required': True,
                            'estimated_duration_minutes': 60 * m_idx,
                            'competencies': [track_info['name'], tier_name, f"Skill {m_idx}"],
                            'is_active': True,
                        }
                    )

                    # Lessons: Tier 3 = ~20 videos per track (4 modules × 5 videos) + guides + quiz
                    if tier_num == 3:
                        lessons_data = [
                            {'title': f'Intro to {module.title}', 'type': 'video', 'duration': 12},
                            {'title': f'{module.title} — Core Concepts', 'type': 'video', 'duration': 18},
                            {'title': f'{module.title} — Hands-on Tutorial', 'type': 'video', 'duration': 22},
                            {'title': f'{module.title} — Tool Walkthrough', 'type': 'video', 'duration': 15},
                            {'title': f'{module.title} — Playbook Steps', 'type': 'video', 'duration': 20},
                            {'title': f'{module.title} — Step-by-Step Guide', 'type': 'guide', 'duration': 25},
                            {'title': f'{module.title} Knowledge Check', 'type': 'quiz', 'duration': 10},
                        ]
                    else:
                        lessons_data = [
                            {'title': f'Intro to {module.title}', 'type': 'video', 'duration': 15},
                            {'title': f'{module.title} Depth', 'type': 'guide', 'duration': 20},
                            {'title': f'{module.title} Knowledge Check', 'type': 'quiz', 'duration': 10},
                        ]
                    for l_idx, l_data in enumerate(lessons_data):
                        Lesson.objects.update_or_create(
                            module=module,
                            order_index=l_idx,
                            defaults={
                                'title': l_data['title'],
                                'description': f"Learning content for {l_data['title']}",
                                'lesson_type': l_data['type'],
                                'duration_minutes': l_data['duration'],
                                'is_required': True,
                            }
                        )

                    # Mini-mission for each module in Tier 2
                    if tier_num == 2:
                        ModuleMission.objects.update_or_create(
                            module=module,
                            mission_id=uuid.uuid4(),
                            defaults={
                                'mission_title': f"{module.title} Mini-Mission",
                                'mission_difficulty': 'beginner',
                                'mission_estimated_hours': 2,
                                'is_required': True,
                                'recommended_order': 0,
                            }
                        )

                # Update track stats
                track.module_count = track.modules.count()
                track.lesson_count = Lesson.objects.filter(module__track=track).count()
                track.mission_count = ModuleMission.objects.filter(module__track=track).count()
                track.save()

        self.stdout.write(self.style.SUCCESS('\n✅ Successfully seeded comprehensive curriculum data!'))
        self.stdout.write(f'  - Total Tracks: {CurriculumTrack.objects.count()}')
        self.stdout.write(f'  - Total Modules: {CurriculumModule.objects.count()}')
        self.stdout.write(f'  - Total Lessons: {Lesson.objects.count()}')
