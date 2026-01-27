"""
Seed sponsors and cohorts for demonstration.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from sponsors.models import Sponsor, SponsorCohort, SponsorStudentCohort

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed sponsors, cohorts, and enrollments for demonstration'

    def handle(self, *args, **options):
        self.stdout.write('Seeding sponsors and cohorts...')

        # Create sponsors
        sponsors_data = [
            {
                'slug': 'nairobi-poly',
                'name': 'Nairobi Polytechnic',
                'sponsor_type': 'university',
                'logo_url': 'https://example.com/logos/nairobi-poly.png',
                'contact_email': 'cyber@nairobipoly.ac.ke',
                'website': 'https://nairobipoly.ac.ke',
                'country': 'KE',
                'city': 'Nairobi',
            },
            {
                'slug': 'mtn-cyber-academy',
                'name': 'MTN Cyber Academy',
                'sponsor_type': 'corporate',
                'logo_url': 'https://example.com/logos/mtn.png',
                'contact_email': 'cyberacademy@mtn.co.ke',
                'website': 'https://mtn.co.ke/cyber-academy',
                'country': 'KE',
                'city': 'Nairobi',
            },
            {
                'slug': 'microsoft-4africa',
                'name': 'Microsoft 4Afrika',
                'sponsor_type': 'scholarship',
                'logo_url': 'https://example.com/logos/microsoft.png',
                'contact_email': '4afrika@microsoft.com',
                'website': 'https://microsoft.com/4afrika',
                'country': 'KE',
                'city': 'Nairobi',
            }
        ]

        sponsors = []
        for sponsor_data in sponsors_data:
            sponsor, created = Sponsor.objects.get_or_create(
                slug=sponsor_data['slug'],
                defaults=sponsor_data
            )
            sponsors.append(sponsor)
            if created:
                self.stdout.write(f'Created sponsor: {sponsor.name}')
            else:
                self.stdout.write(f'Sponsor already exists: {sponsor.name}')

        # Create cohorts for each sponsor
        from datetime import date
        cohorts_data = [
            {
                'sponsor': sponsors[0],  # Nairobi Poly
                'name': 'Nairobi Poly Jan 2026 Cohort',
                'track_slug': 'defender',
                'target_size': 100,
                'students_enrolled': 87,
                'start_date': date(2026, 1, 15),
                'completion_rate': 68.2
            },
            {
                'sponsor': sponsors[0],  # Nairobi Poly
                'name': 'Nairobi Poly Cybersecurity Bootcamp 2025',
                'track_slug': 'offensive',
                'target_size': 50,
                'students_enrolled': 45,
                'start_date': date(2025, 9, 1),
                'completion_rate': 72.1
            },
            {
                'sponsor': sponsors[1],  # MTN
                'name': 'MTN Cyber Talent Pipeline 2025',
                'track_slug': 'grc',
                'target_size': 75,
                'students_enrolled': 68,
                'start_date': date(2025, 6, 1),
                'completion_rate': 54.8
            }
        ]

        cohorts = []
        for cohort_data in cohorts_data:
            cohort, created = SponsorCohort.objects.get_or_create(
                sponsor=cohort_data['sponsor'],
                name=cohort_data['name'],
                defaults=cohort_data
            )
            cohorts.append(cohort)
            if created:
                self.stdout.write(f'Created cohort: {cohort.name}')
            else:
                self.stdout.write(f'Cohort already exists: {cohort.name}')

        # Create some sample student enrollments
        # Get some existing users (assuming they exist from other seeds)
        users = User.objects.filter(is_active=True)[:20]  # Get first 20 active users

        if users.exists():
            main_cohort = cohorts[0]  # Nairobi Poly Jan 2026 Cohort

            for i, user in enumerate(users):
                enrollment, created = SponsorStudentCohort.objects.get_or_create(
                    sponsor_cohort=main_cohort,
                    student=user,
                    defaults={
                        'completion_percentage': 60 + (i % 40),  # 60-99%
                        'enrollment_status': 'enrolled',
                        'is_active': True
                    }
                )
                if created:
                    self.stdout.write(f'Enrolled student: {user.email} in {main_cohort.name}')

        self.stdout.write(self.style.SUCCESS('Successfully seeded sponsors and cohorts!'))

