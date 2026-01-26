"""
Management command to seed Tier 6 Cross-Track Programs.

Creates the 5 cross-track programs:
1. Cyber Entrepreneurship (20 videos)
2. Soft Skills for Cyber Careers (20 videos)
3. Career Acceleration (10 videos)
4. Cyber Ethics & Integrity (10 videos)
5. Mission Leadership (10 videos)
"""
from django.core.management.base import BaseCommand
from curriculum.models import CurriculumTrack, CurriculumModule, Lesson


CROSS_TRACK_PROGRAMS = [
    {
        'code': 'CROSS_ENTREPRENEURSHIP',
        'name': 'Cyber Entrepreneurship',
        'description': 'Transform your cybersecurity skills into value. Learn to launch cyber businesses, freelance, and participate in the OCH marketplace.',
        'icon': '🚀',
        'color': 'cyan',
        'modules': [
            {
                'title': 'Introduction to Cyber Entrepreneurship',
                'description': 'Understanding the cyber business landscape and opportunities',
                'lessons': [
                    {'title': 'The Cyber Business Ecosystem', 'type': 'video', 'duration': 15},
                    {'title': 'Identifying Market Opportunities', 'type': 'video', 'duration': 20},
                    {'title': 'Your First Business Model', 'type': 'guide', 'duration': 25},
                ]
            },
            {
                'title': 'Building Your Service Offering',
                'description': 'Define and package your cybersecurity services',
                'lessons': [
                    {'title': 'Service Portfolio Design', 'type': 'video', 'duration': 18},
                    {'title': 'Pricing Strategies', 'type': 'video', 'duration': 20},
                    {'title': 'Proposal Writing', 'type': 'guide', 'duration': 30},
                    {'title': 'Business Model Template', 'type': 'reading', 'duration': 15},
                ]
            },
            {
                'title': 'Freelancing & Consulting',
                'description': 'Start your freelance cybersecurity career',
                'lessons': [
                    {'title': 'Setting Up as a Freelancer', 'type': 'video', 'duration': 20},
                    {'title': 'Client Acquisition Strategies', 'type': 'video', 'duration': 22},
                    {'title': 'Contract Negotiation', 'type': 'guide', 'duration': 25},
                ]
            },
            {
                'title': 'OCH Marketplace Integration',
                'description': 'Leverage the OCH marketplace for opportunities',
                'lessons': [
                    {'title': 'Marketplace Overview', 'type': 'video', 'duration': 15},
                    {'title': 'Creating Service Listings', 'type': 'video', 'duration': 20},
                    {'title': 'Managing Client Relationships', 'type': 'guide', 'duration': 25},
                ]
            },
            {
                'title': 'Scaling Your Business',
                'description': 'Grow from solo to team-based operations',
                'lessons': [
                    {'title': 'Team Building', 'type': 'video', 'duration': 20},
                    {'title': 'Scaling Operations', 'type': 'video', 'duration': 22},
                    {'title': 'Final Business Plan', 'type': 'assessment', 'duration': 30},
                ]
            },
        ]
    },
    {
        'code': 'CROSS_SOFT_SKILLS',
        'name': 'Soft Skills for Cyber Careers',
        'description': 'Master communication, stakeholder engagement, documentation clarity, teamwork, and productivity for cyber professionals.',
        'icon': '💬',
        'color': 'emerald',
        'modules': [
            {
                'title': 'Professional Communication',
                'description': 'Effective communication in cybersecurity contexts',
                'lessons': [
                    {'title': 'Technical Writing for Security', 'type': 'video', 'duration': 20},
                    {'title': 'Stakeholder Presentations', 'type': 'video', 'duration': 25},
                    {'title': 'Email Communication Best Practices', 'type': 'guide', 'duration': 15},
                ]
            },
            {
                'title': 'Team Collaboration',
                'description': 'Working effectively in security teams',
                'lessons': [
                    {'title': 'Cross-Functional Collaboration', 'type': 'video', 'duration': 20},
                    {'title': 'Conflict Resolution', 'type': 'video', 'duration': 18},
                    {'title': 'Agile Security Practices', 'type': 'guide', 'duration': 25},
                ]
            },
            {
                'title': 'Documentation Excellence',
                'description': 'Creating clear, actionable security documentation',
                'lessons': [
                    {'title': 'Incident Report Writing', 'type': 'video', 'duration': 20},
                    {'title': 'Policy Documentation', 'type': 'video', 'duration': 22},
                    {'title': 'Runbook Creation', 'type': 'guide', 'duration': 30},
                ]
            },
            {
                'title': 'Productivity & Time Management',
                'description': 'Maximize efficiency in security operations',
                'lessons': [
                    {'title': 'Prioritization Techniques', 'type': 'video', 'duration': 18},
                    {'title': 'Tool Mastery', 'type': 'video', 'duration': 20},
                    {'title': 'Workflow Optimization', 'type': 'guide', 'duration': 25},
                ]
            },
        ]
    },
    {
        'code': 'CROSS_CAREER',
        'name': 'Career Acceleration',
        'description': 'CV optimization, interview preparation, professional branding, networking, and job search strategy.',
        'icon': '📈',
        'color': 'amber',
        'modules': [
            {
                'title': 'Professional Branding',
                'description': 'Build your cybersecurity professional brand',
                'lessons': [
                    {'title': 'Personal Brand Strategy', 'type': 'video', 'duration': 20},
                    {'title': 'LinkedIn Optimization', 'type': 'video', 'duration': 25},
                    {'title': 'Online Presence Management', 'type': 'guide', 'duration': 20},
                ]
            },
            {
                'title': 'CV & Resume Development',
                'description': 'Create compelling cybersecurity resumes',
                'lessons': [
                    {'title': 'CV Structure for Cyber Roles', 'type': 'video', 'duration': 22},
                    {'title': 'Quantifying Your Impact', 'type': 'video', 'duration': 20},
                    {'title': 'CV Template & Examples', 'type': 'reading', 'duration': 15},
                ]
            },
            {
                'title': 'Interview Mastery',
                'description': 'Ace cybersecurity job interviews',
                'lessons': [
                    {'title': 'Technical Interview Prep', 'type': 'video', 'duration': 25},
                    {'title': 'Behavioral Questions', 'type': 'video', 'duration': 20},
                    {'title': 'Mock Interview Practice', 'type': 'assessment', 'duration': 30},
                ]
            },
            {
                'title': 'Networking & Job Search',
                'description': 'Effective networking and job search strategies',
                'lessons': [
                    {'title': 'Professional Networking', 'type': 'video', 'duration': 20},
                    {'title': 'Job Search Strategy', 'type': 'video', 'duration': 22},
                    {'title': 'Portfolio Submission', 'type': 'assessment', 'duration': 25},
                ]
            },
        ]
    },
    {
        'code': 'CROSS_ETHICS',
        'name': 'Cyber Ethics & Integrity',
        'description': 'Ethical reasoning, responsible disclosure, professional conduct, governance ethics, and moral decision-making in cybersecurity.',
        'icon': '⚖️',
        'color': 'indigo',
        'modules': [
            {
                'title': 'Ethical Foundations',
                'description': 'Core ethical principles in cybersecurity',
                'lessons': [
                    {'title': 'Ethics in Cyber Operations', 'type': 'video', 'duration': 20},
                    {'title': 'Professional Codes of Conduct', 'type': 'video', 'duration': 18},
                    {'title': 'Ethical Decision Framework', 'type': 'guide', 'duration': 25},
                ]
            },
            {
                'title': 'Responsible Disclosure',
                'description': 'Ethical vulnerability disclosure practices',
                'lessons': [
                    {'title': 'Vulnerability Disclosure Process', 'type': 'video', 'duration': 22},
                    {'title': 'Coordinated Disclosure', 'type': 'video', 'duration': 20},
                    {'title': 'Scenario: Responsible Disclosure', 'type': 'assessment', 'duration': 30},
                ]
            },
            {
                'title': 'Governance & Compliance Ethics',
                'description': 'Ethical considerations in governance and compliance',
                'lessons': [
                    {'title': 'Ethics in GRC', 'type': 'video', 'duration': 20},
                    {'title': 'Compliance vs Ethics', 'type': 'video', 'duration': 18},
                    {'title': 'Ethics Reflection', 'type': 'assessment', 'duration': 25},
                ]
            },
            {
                'title': 'Moral Decision-Making',
                'description': 'Navigating ethical dilemmas in cybersecurity',
                'lessons': [
                    {'title': 'Ethical Dilemmas in Security', 'type': 'video', 'duration': 22},
                    {'title': 'Case Study Analysis', 'type': 'assessment', 'duration': 30},
                    {'title': 'Ethics Declaration', 'type': 'assessment', 'duration': 20},
                ]
            },
        ]
    },
    {
        'code': 'CROSS_LEADERSHIP',
        'name': 'Mission Leadership',
        'description': 'Leading teams in missions, decision-making under pressure, communication in crisis, task delegation, and VIP leadership principles.',
        'icon': '👑',
        'color': 'gold',
        'modules': [
            {
                'title': 'Leadership Fundamentals',
                'description': 'Core leadership principles for security teams',
                'lessons': [
                    {'title': 'Leadership Styles in Security', 'type': 'video', 'duration': 20},
                    {'title': 'Building Trust', 'type': 'video', 'duration': 18},
                    {'title': 'Leadership Assessment', 'type': 'assessment', 'duration': 25},
                ]
            },
            {
                'title': 'Crisis Communication',
                'description': 'Leading during security incidents',
                'lessons': [
                    {'title': 'Incident Leadership', 'type': 'video', 'duration': 22},
                    {'title': 'Communication Under Pressure', 'type': 'video', 'duration': 20},
                    {'title': 'Crisis Scenario Simulation', 'type': 'assessment', 'duration': 30},
                ]
            },
            {
                'title': 'Team Management',
                'description': 'Effective team leadership and delegation',
                'lessons': [
                    {'title': 'Task Delegation', 'type': 'video', 'duration': 20},
                    {'title': 'Performance Management', 'type': 'video', 'duration': 18},
                    {'title': 'Team Leadership Exercise', 'type': 'assessment', 'duration': 25},
                ]
            },
            {
                'title': 'VIP Leadership Principles',
                'description': 'Advanced leadership for high-stakes missions',
                'lessons': [
                    {'title': 'VIP Leadership Framework', 'type': 'video', 'duration': 22},
                    {'title': 'Mission Decision Brief', 'type': 'assessment', 'duration': 30},
                    {'title': 'Leadership Portfolio', 'type': 'assessment', 'duration': 25},
                ]
            },
        ]
    },
]


class Command(BaseCommand):
    help = 'Seed Tier 6 Cross-Track Programs'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing cross-track programs before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing cross-track programs...')
            CurriculumTrack.objects.filter(tier=6).delete()
            self.stdout.write(self.style.SUCCESS('Cleared existing programs'))

        self.stdout.write('Creating Tier 6 Cross-Track Programs...')

        for program_data in CROSS_TRACK_PROGRAMS:
            # Create track
            track, created = CurriculumTrack.objects.update_or_create(
                code=program_data['code'],
                defaults={
                    'name': program_data['name'],
                    'description': program_data['description'],
                    'tier': 6,
                    'level': 'intermediate',
                    'icon': program_data['icon'],
                    'color': program_data['color'],
                    'is_active': True,
                }
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f'  Created track: {track.name}'))
            else:
                self.stdout.write(f'  Updated track: {track.name}')

            # Create modules and lessons
            total_lessons = 0
            for module_idx, module_data in enumerate(program_data['modules']):
                module, _ = CurriculumModule.objects.update_or_create(
                    track=track,
                    track_key=track.code,
                    title=module_data['title'],
                    defaults={
                        'description': module_data['description'],
                        'order_index': module_idx,
                        'is_core': True,
                        'is_required': True,
                        'level': 'intermediate',
                        'entitlement_tier': 'all',
                        'is_active': True,
                    }
                )

                # Create lessons
                for lesson_idx, lesson_data in enumerate(module_data['lessons']):
                    Lesson.objects.update_or_create(
                        module=module,
                        title=lesson_data['title'],
                        defaults={
                            'description': '',
                            'lesson_type': lesson_data['type'],
                            'duration_minutes': lesson_data['duration'],
                            'order_index': lesson_idx,
                            'is_required': True,
                        }
                    )
                    total_lessons += 1

                # Update module lesson count
                module.lesson_count = module.lessons.count()
                module.save()

            # Update track stats
            track.module_count = track.modules.count()
            track.lesson_count = total_lessons
            track.save()

            self.stdout.write(
                self.style.SUCCESS(
                    f'    Created {track.module_count} modules with {total_lessons} lessons'
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully created {len(CROSS_TRACK_PROGRAMS)} cross-track programs!'
            )
        )
