"""
Management command to seed initial Foundations modules.
Run: python manage.py seed_foundations_modules
"""
from django.core.management.base import BaseCommand
from foundations.models import FoundationsModule


class Command(BaseCommand):
    help = 'Seed initial Foundations (Tier 1) modules'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Seeding Foundations modules...'))

        modules_data = [
            {
                'title': 'Welcome to OCH',
                'description': 'Introduction to the Ongoza CyberHub ecosystem and learning philosophy.',
                'module_type': 'video',
                'order': 1,
                'is_mandatory': True,
                'estimated_minutes': 5,
                'content': '''
                    <h2>Welcome to Ongoza CyberHub</h2>
                    <p>OCH is a mission-driven, role-based cybersecurity learning platform designed to transform beginners into industry-ready professionals.</p>
                    <p>Our philosophy centers on:</p>
                    <ul>
                        <li><strong>Mission-Driven Learning:</strong> Real-world scenarios that mirror actual cybersecurity challenges</li>
                        <li><strong>Role-Based Tracks:</strong> Specialized pathways aligned with industry roles</li>
                        <li><strong>VIP Framework:</strong> Value, Impact, and Purpose guide your journey</li>
                    </ul>
                ''',
            },
            {
                'title': 'How Mission-Driven Learning Works',
                'description': 'Understanding missions, recipes, and how they work together to build real skills.',
                'module_type': 'video',
                'order': 2,
                'is_mandatory': True,
                'estimated_minutes': 8,
                'content': '''
                    <h2>Mission-Driven Learning</h2>
                    <p><strong>Missions</strong> are real-world cybersecurity scenarios that challenge you to solve actual problems.</p>
                    <p><strong>Recipes</strong> are micro-skills that support mission completion. They teach you the specific tools and techniques needed.</p>
                    <p>Together, missions and recipes create a hands-on learning experience that builds practical, job-ready skills.</p>
                ''',
            },
            {
                'title': 'Role-Based Tracks Explained',
                'description': 'Learn about the 5 OCH tracks and how to choose the right path for your career.',
                'module_type': 'interactive',
                'order': 3,
                'is_mandatory': True,
                'estimated_minutes': 10,
                'content': '''
                    <h2>OCH Tracks</h2>
                    <p>OCH offers 5 specialized tracks:</p>
                    <ul>
                        <li><strong>Defender:</strong> SOC Analyst, Incident Response, Threat Hunting</li>
                        <li><strong>Offensive:</strong> Penetration Testing, Red Teaming, Vulnerability Assessment</li>
                        <li><strong>GRC:</strong> Governance, Risk Management, Compliance</li>
                        <li><strong>Innovation:</strong> Security Engineering, DevSecOps, Tool Development</li>
                        <li><strong>Leadership:</strong> Security Management, Strategy, Team Leadership</li>
                    </ul>
                    <p>Your AI Profiler has recommended a track based on your responses. You can confirm or override this recommendation.</p>
                ''',
            },
            {
                'title': 'Mission Preview',
                'description': 'See what a real OCH mission looks like.',
                'module_type': 'interactive',
                'order': 4,
                'is_mandatory': True,
                'estimated_minutes': 5,
                'content': '''
                    <h2>Mission Preview</h2>
                    <p>Missions are structured challenges that simulate real cybersecurity scenarios.</p>
                    <p>Each mission includes:</p>
                    <ul>
                        <li>Clear objectives and success criteria</li>
                        <li>Real-world context and scenarios</li>
                        <li>Recommended recipes (micro-skills) to support completion</li>
                        <li>Portfolio deliverables</li>
                    </ul>
                ''',
            },
            {
                'title': 'Recipe Demo',
                'description': 'Explore how recipes teach micro-skills that support mission completion.',
                'module_type': 'interactive',
                'order': 5,
                'is_mandatory': True,
                'estimated_minutes': 5,
                'content': '''
                    <h2>Recipes: Micro-Skills for Mission Success</h2>
                    <p>Recipes are focused learning modules that teach specific tools, techniques, or concepts.</p>
                    <p>They are designed to:</p>
                    <ul>
                        <li>Build foundational skills quickly</li>
                        <li>Support mission completion</li>
                        <li>Create a portfolio of practical work</li>
                    </ul>
                ''',
            },
            {
                'title': 'Portfolio & Marketplace Overview',
                'description': 'Learn how your portfolio grows and how it connects to career opportunities.',
                'module_type': 'video',
                'order': 6,
                'is_mandatory': True,
                'estimated_minutes': 7,
                'content': '''
                    <h2>Portfolio & Marketplace</h2>
                    <p>As you complete missions, you build a portfolio of real work that demonstrates your skills.</p>
                    <p>Your portfolio:</p>
                    <ul>
                        <li>Showcases your capabilities to employers</li>
                        <li>Tracks your growth and achievements</li>
                        <li>Connects you to marketplace opportunities</li>
                    </ul>
                ''',
            },
            {
                'title': 'Mentorship Layer',
                'description': 'Understand how mentors support your learning journey.',
                'module_type': 'video',
                'order': 7,
                'is_mandatory': True,
                'estimated_minutes': 6,
                'content': '''
                    <h2>Mentorship at OCH</h2>
                    <p>Mentors are experienced cybersecurity professionals who guide your learning.</p>
                    <p>They help with:</p>
                    <ul>
                        <li>Mission reviews and feedback</li>
                        <li>Career guidance</li>
                        <li>Technical questions and challenges</li>
                        <li>Portfolio development</li>
                    </ul>
                ''',
            },
            {
                'title': 'VIP Framework Introduction',
                'description': 'Learn about the Value, Impact, and Purpose framework that guides OCH.',
                'module_type': 'video',
                'order': 8,
                'is_mandatory': True,
                'estimated_minutes': 8,
                'content': '''
                    <h2>The VIP Framework</h2>
                    <p><strong>Value:</strong> What unique value do you bring to cybersecurity?</p>
                    <p><strong>Impact:</strong> How will you make a difference in the field?</p>
                    <p><strong>Purpose:</strong> What drives your cybersecurity journey?</p>
                    <p>The VIP framework helps you align your learning with your personal mission and career goals.</p>
                ''',
            },
            {
                'title': 'Orientation Assessment',
                'description': 'Test your understanding of OCH structure and concepts.',
                'module_type': 'assessment',
                'order': 9,
                'is_mandatory': True,
                'estimated_minutes': 10,
                'content': '''
                    <h2>Orientation Assessment</h2>
                    <p>This assessment checks your understanding of OCH's structure and learning approach.</p>
                    <p>Don't worry - this is for orientation purposes only. Your score helps us understand how well you've grasped the concepts.</p>
                ''',
            },
            {
                'title': 'Goals & Reflection',
                'description': 'Set your initial goals and reflect on your cybersecurity journey ahead.',
                'module_type': 'reflection',
                'order': 10,
                'is_mandatory': True,
                'estimated_minutes': 10,
                'content': '''
                    <h2>Goals & Reflection</h2>
                    <p>Take a moment to reflect on your goals and aspirations in cybersecurity.</p>
                    <p>Your reflection will be shared with your mentor to help them understand your journey and provide better guidance.</p>
                ''',
            },
        ]

        created_count = 0
        updated_count = 0

        for module_data in modules_data:
            module, created = FoundationsModule.objects.update_or_create(
                title=module_data['title'],
                defaults={
                    'description': module_data['description'],
                    'module_type': module_data['module_type'],
                    'order': module_data['order'],
                    'is_mandatory': module_data['is_mandatory'],
                    'estimated_minutes': module_data['estimated_minutes'],
                    'content': module_data.get('content', ''),
                    'is_active': True,
                }
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'  ✓ Created: {module.title}'))
            else:
                updated_count += 1
                self.stdout.write(self.style.WARNING(f'  ↻ Updated: {module.title}'))

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Seeding complete! Created {created_count} modules, updated {updated_count} modules.'
        ))
