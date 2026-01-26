"""
Management command to seed sample curriculum data.
Creates Cyber Defense track with modules, lessons, and sample missions.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from curriculum.models import (
    CurriculumTrack, CurriculumModule, Lesson, ModuleMission,
    RecipeRecommendation
)


class Command(BaseCommand):
    help = 'Seed sample curriculum data for Cyber Defense track'

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

        self.stdout.write('Seeding curriculum data...')
        
        # Create Cyber Defense Track
        track, created = CurriculumTrack.objects.update_or_create(
            code='CYBERDEF',
            defaults={
                'name': 'Cyber Defense',
                'description': 'Master the art of defending digital assets. From SIEM fundamentals to advanced threat hunting, build the skills to protect organizations from cyber threats.',
                'level': 'entry',
                'icon': 'shield',
                'color': 'indigo',
                'estimated_duration_weeks': 16,
                'is_active': True,
            }
        )
        self.stdout.write(f"{'Created' if created else 'Updated'} track: {track.name}")

        # Module 1: OCH Ecosystem Alignment
        module1, _ = CurriculumModule.objects.update_or_create(
            track=track,
            track_key='CYBERDEF',
            order_index=0,
            defaults={
                'title': 'OCH Ecosystem Alignment',
                'description': 'Orientation and mindset alignment for cybersecurity professionals. Understand the OCH journey and your path to becoming a skilled defender.',
                'level': 'beginner',
                'entitlement_tier': 'all',
                'is_core': True,
                'is_required': True,
                'estimated_time_minutes': 60,
                'competencies': ['Mindset', 'OCH Philosophy', 'Career Planning'],
                'mentor_notes': 'Emphasize the growth mindset and importance of consistent practice. This module sets the tone for the entire journey.',
                'is_active': True,
            }
        )
        self.stdout.write(f"  Created module: {module1.title}")

        # Lessons for Module 1
        lessons_m1 = [
            {'title': 'The OCH Philosophy', 'type': 'video', 'duration': 15, 'desc': 'Understanding the Ongoza Cyber Hub approach to security education'},
            {'title': 'Your Future-You Blueprint', 'type': 'video', 'duration': 20, 'desc': 'Defining your career goals and creating a personalized learning path'},
            {'title': 'The Defender Mindset', 'type': 'guide', 'duration': 10, 'desc': 'Developing the mental framework of a security professional'},
            {'title': 'Circle & Phase System', 'type': 'video', 'duration': 15, 'desc': 'How progression works in the OCH ecosystem'},
        ]
        for i, lesson_data in enumerate(lessons_m1):
            Lesson.objects.update_or_create(
                module=module1,
                order_index=i,
                defaults={
                    'title': lesson_data['title'],
                    'description': lesson_data['desc'],
                    'lesson_type': lesson_data['type'],
                    'duration_minutes': lesson_data['duration'],
                    'is_required': True,
                }
            )

        # Module 2: Foundational Defense Workflow
        module2, _ = CurriculumModule.objects.update_or_create(
            track=track,
            track_key='CYBERDEF',
            order_index=1,
            defaults={
                'title': 'Foundational Defense Workflow',
                'description': 'Core concepts of security operations. Learn SIEM basics, log analysis, and early-stage detection techniques.',
                'level': 'beginner',
                'entitlement_tier': 'all',
                'is_core': True,
                'is_required': True,
                'estimated_time_minutes': 180,
                'competencies': ['SIEM', 'Log Analysis', 'Alerting', 'Triage'],
                'mentor_notes': 'Focus on hands-on practice with real logs. Encourage experimentation with Splunk/ELK playgrounds.',
                'is_active': True,
            }
        )
        self.stdout.write(f"  Created module: {module2.title}")

        # Lessons for Module 2
        lessons_m2 = [
            {'title': 'Introduction to SIEM', 'type': 'video', 'duration': 25, 'desc': 'What is SIEM and why it matters in security operations'},
            {'title': 'Log Analysis Basics', 'type': 'video', 'duration': 30, 'desc': 'Understanding log formats and parsing techniques'},
            {'title': 'Network Traffic Analysis', 'type': 'video', 'duration': 25, 'desc': 'Reading and interpreting network logs'},
            {'title': 'Alert Triage Fundamentals', 'type': 'guide', 'duration': 20, 'desc': 'How to prioritize and investigate security alerts'},
            {'title': 'Log Analysis Lab', 'type': 'lab', 'duration': 45, 'desc': 'Hands-on practice with sample security logs'},
            {'title': 'Module Assessment', 'type': 'assessment', 'duration': 30, 'desc': 'Test your understanding of foundational concepts'},
        ]
        for i, lesson_data in enumerate(lessons_m2):
            Lesson.objects.update_or_create(
                module=module2,
                order_index=i,
                defaults={
                    'title': lesson_data['title'],
                    'description': lesson_data['desc'],
                    'lesson_type': lesson_data['type'],
                    'duration_minutes': lesson_data['duration'],
                    'is_required': True,
                }
            )

        # Add mission to Module 2
        ModuleMission.objects.update_or_create(
            module=module2,
            mission_id='00000000-0000-0000-0000-000000000001',  # Placeholder
            defaults={
                'mission_title': 'Log Analysis Challenge',
                'mission_difficulty': 'beginner',
                'mission_estimated_hours': 4,
                'is_required': True,
                'recommended_order': 0,
            }
        )

        # Module 3: Applied Threat Detection
        module3, _ = CurriculumModule.objects.update_or_create(
            track=track,
            track_key='CYBERDEF',
            order_index=2,
            defaults={
                'title': 'Applied Threat Detection',
                'description': 'Advanced detection techniques. Create detection rules, understand attack patterns, and build response playbooks.',
                'level': 'intermediate',
                'entitlement_tier': 'starter_enhanced',
                'is_core': True,
                'is_required': True,
                'estimated_time_minutes': 240,
                'competencies': ['Detection Engineering', 'Sigma Rules', 'YARA', 'Threat Intelligence'],
                'mentor_notes': 'Challenge students to create their own detection rules. Review real-world attack patterns and TTPs.',
                'is_active': True,
            }
        )
        self.stdout.write(f"  Created module: {module3.title}")

        # Lessons for Module 3
        lessons_m3 = [
            {'title': 'Threat Detection Fundamentals', 'type': 'video', 'duration': 30, 'desc': 'Understanding the detection engineering lifecycle'},
            {'title': 'MITRE ATT&CK Framework', 'type': 'video', 'duration': 35, 'desc': 'Mapping threats to the ATT&CK framework'},
            {'title': 'Sigma Rules Introduction', 'type': 'video', 'duration': 40, 'desc': 'Creating cross-platform detection rules'},
            {'title': 'YARA Rule Basics', 'type': 'guide', 'duration': 25, 'desc': 'Pattern matching for malware detection'},
            {'title': 'Threat Intelligence Integration', 'type': 'video', 'duration': 30, 'desc': 'Leveraging threat intel in detection'},
            {'title': 'Detection Rule Lab', 'type': 'lab', 'duration': 60, 'desc': 'Build and test custom detection rules'},
        ]
        for i, lesson_data in enumerate(lessons_m3):
            Lesson.objects.update_or_create(
                module=module3,
                order_index=i,
                defaults={
                    'title': lesson_data['title'],
                    'description': lesson_data['desc'],
                    'lesson_type': lesson_data['type'],
                    'duration_minutes': lesson_data['duration'],
                    'is_required': True,
                }
            )

        # Add mission to Module 3
        ModuleMission.objects.update_or_create(
            module=module3,
            mission_id='00000000-0000-0000-0000-000000000002',
            defaults={
                'mission_title': 'Alert Rule Creation',
                'mission_difficulty': 'intermediate',
                'mission_estimated_hours': 6,
                'is_required': True,
                'recommended_order': 0,
            }
        )

        # Module 4: Threat Hunting
        module4, _ = CurriculumModule.objects.update_or_create(
            track=track,
            track_key='CYBERDEF',
            order_index=3,
            defaults={
                'title': 'Proactive Threat Hunting',
                'description': 'Go beyond reactive detection. Learn to proactively hunt for threats using hypothesis-driven approaches.',
                'level': 'advanced',
                'entitlement_tier': 'professional',
                'is_core': True,
                'is_required': True,
                'estimated_time_minutes': 300,
                'competencies': ['Threat Hunting', 'Hypothesis Testing', 'Advanced Analytics', 'Forensics'],
                'mentor_notes': 'This is where students transition from analysts to hunters. Focus on creative thinking and pattern recognition.',
                'is_active': True,
            }
        )
        self.stdout.write(f"  Created module: {module4.title}")

        # Module 5: Capstone
        module5, _ = CurriculumModule.objects.update_or_create(
            track=track,
            track_key='CYBERDEF',
            order_index=4,
            defaults={
                'title': 'Cyber Defense Capstone',
                'description': 'Put it all together in a comprehensive capstone project. Demonstrate mastery of defensive security skills.',
                'level': 'capstone',
                'entitlement_tier': 'professional',
                'is_core': True,
                'is_required': True,
                'estimated_time_minutes': 480,
                'competencies': ['Full SOC Workflow', 'Incident Response', 'Documentation', 'Presentation'],
                'mentor_notes': 'Capstone should simulate a real SOC environment. Mentor review is critical for certification.',
                'is_active': True,
            }
        )
        self.stdout.write(f"  Created module: {module5.title}")

        # Add capstone mission
        ModuleMission.objects.update_or_create(
            module=module5,
            mission_id='00000000-0000-0000-0000-000000000003',
            defaults={
                'mission_title': 'SOC Simulation Capstone',
                'mission_difficulty': 'advanced',
                'mission_estimated_hours': 12,
                'is_required': True,
                'recommended_order': 0,
            }
        )

        # Add recipe recommendations
        recipes = [
            {'module': module2, 'title': 'Splunk Quick Start', 'duration': 30, 'diff': 'beginner'},
            {'module': module2, 'title': 'Regex for Log Parsing', 'duration': 20, 'diff': 'beginner'},
            {'module': module3, 'title': 'Sigma Rule Syntax Deep Dive', 'duration': 25, 'diff': 'intermediate'},
            {'module': module3, 'title': 'YARA in Practice', 'duration': 35, 'diff': 'intermediate'},
            {'module': module4, 'title': 'KQL for Threat Hunting', 'duration': 40, 'diff': 'advanced'},
        ]
        for i, recipe in enumerate(recipes):
            RecipeRecommendation.objects.update_or_create(
                module=recipe['module'],
                recipe_id=f'00000000-0000-0000-0000-00000000010{i}',
                defaults={
                    'recipe_title': recipe['title'],
                    'recipe_duration_minutes': recipe['duration'],
                    'recipe_difficulty': recipe['diff'],
                    'relevance_score': 0.9,
                    'order_index': i % 3,
                }
            )

        # Update track stats
        track.module_count = 5
        track.lesson_count = Lesson.objects.filter(module__track=track).count()
        track.mission_count = ModuleMission.objects.filter(module__track=track).count()
        track.save()

        # Create Cloud Security Track
        track2, created = CurriculumTrack.objects.update_or_create(
            code='CLOUDSEC',
            defaults={
                'name': 'Cloud Security',
                'description': 'Secure cloud infrastructure across AWS, Azure, and GCP. Learn cloud-native security controls, IAM, and compliance.',
                'level': 'intermediate',
                'icon': 'cloud',
                'color': 'cyan',
                'estimated_duration_weeks': 12,
                'is_active': True,
            }
        )
        self.stdout.write(f"{'Created' if created else 'Updated'} track: {track2.name}")

        # Create SOC Analyst Track
        track3, created = CurriculumTrack.objects.update_or_create(
            code='SOCANALYST',
            defaults={
                'name': 'SOC Analyst',
                'description': 'Become a skilled Security Operations Center analyst. Master monitoring, triage, incident response, and escalation procedures.',
                'level': 'entry',
                'icon': 'monitor',
                'color': 'purple',
                'estimated_duration_weeks': 14,
                'is_active': True,
            }
        )
        self.stdout.write(f"{'Created' if created else 'Updated'} track: {track3.name}")

        self.stdout.write(self.style.SUCCESS('\n✅ Successfully seeded curriculum data!'))
        self.stdout.write(f'  - Tracks: {CurriculumTrack.objects.count()}')
        self.stdout.write(f'  - Modules: {CurriculumModule.objects.count()}')
        self.stdout.write(f'  - Lessons: {Lesson.objects.count()}')
        self.stdout.write(f'  - Missions: {ModuleMission.objects.count()}')
        self.stdout.write(f'  - Recipes: {RecipeRecommendation.objects.count()}')

