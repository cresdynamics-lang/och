"""
Create test students and make them visible in the sponsor marketplace talent pool.

Adds all data needed for marketplace: users (with account_status, email_verified,
profile/onboarding/profiling complete, career fields), student role, employer_share
consent, and marketplace_profiles (tier, readiness, role, skills, is_visible).

Use when you have no students or want more talent profiles for testing:
  python manage.py create_marketplace_test_students

To only add marketplace profiles + consent for existing users (no new users):
  python manage.py create_marketplace_test_students --use-existing --count 5
"""
import logging
from decimal import Decimal
from django.utils import timezone

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.utils import DataError, IntegrityError
from django.contrib.auth import get_user_model

from users.models import Role, UserRole
from users.utils.consent_utils import grant_consent
from marketplace.models import MarketplaceProfile

logger = logging.getLogger(__name__)

User = get_user_model()

# Real names: (first_name, last_name, email) then talent data
MARKETPLACE_STUDENTS = [
    ('Wilson', 'Kinyanjui', 'wilson.kinyanjui@test.com', 'professional', Decimal('88.00'), 'job_ready', 'SOC Analyst', ['Python', 'SIEM', 'Incident Response']),
    ('Makek', 'Muwa', 'makek.muwa@test.com', 'professional', Decimal('75.50'), 'emerging_talent', 'Security Analyst', ['Linux', 'Networking', 'Threat Hunting']),
    ('Cynthia', 'Wanjiku', 'cynthia.wanjiku@test.com', 'starter', Decimal('72.00'), 'foundation_mode', 'Cybersecurity Trainee', ['Python', 'Basics']),
    ('James', 'Omondi', 'james.omondi@test.com', 'professional', Decimal('92.00'), 'job_ready', 'Incident Responder', ['DFIR', 'Malware Analysis', 'SOAR']),
    ('Grace', 'Muthoni', 'grace.muthoni@test.com', 'starter', Decimal('68.00'), 'foundation_mode', 'Junior Analyst', ['SIEM', 'Log Analysis']),
]


class Command(BaseCommand):
    help = 'Create test students and make them visible in sponsor marketplace talent pool'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=5,
            help='Number of test students to create or to attach marketplace profiles to (default: 5)',
        )
        parser.add_argument(
            '--use-existing',
            action='store_true',
            help='Do not create new users; only add consent + marketplace profiles to existing non-staff users',
        )
        parser.add_argument(
            '--password',
            default='testpass123',
            help='Password for newly created users (default: testpass123)',
        )

    def handle(self, *args, **options):
        count = max(1, min(options['count'], 10))
        use_existing = options['use_existing']
        password = options['password']

        if use_existing:
            self._attach_profiles_to_existing_users(count)
        else:
            try:
                self._create_new_students_and_profiles(count, password)
            except (DataError, IntegrityError) as e:
                err_str = str(e).lower()
                if 'bigint' in err_str or 'invalid input syntax' in err_str or 'uuid' in err_str:
                    self.stdout.write(
                        self.style.ERROR(
                            'Your database uses bigint for users.id but the Django User model uses a UUID string. '
                            'Create students with the SQL script instead:\n\n'
                            '  1. Run: psql -U YOUR_USER -d YOUR_DB -f insert_marketplace_students_bigint.sql\n'
                            '     (from backend/django_app)\n\n'
                            '  2. Set passwords: python manage.py set_marketplace_passwords\n\n'
                            'Students created: Wilson Kinyanjui, Makek Muwa, Cynthia Wanjiku, James Omondi, Grace Muthoni.'
                        )
                    )
                    return
                raise

    def _attach_profiles_to_existing_users(self, count: int):
        """Add employer_share consent and marketplace profiles to existing users."""
        # Users that don't have a marketplace profile yet and are not staff
        candidates = (
            User.objects.filter(is_staff=False, is_superuser=False)
            .exclude(id__in=MarketplaceProfile.objects.values_list('mentee_id', flat=True))
            [:count]
        )
        users = list(candidates)
        if not users:
            self.stdout.write(
                self.style.WARNING(
                    'No existing users found without a marketplace profile. '
                    'Create students first (e.g. run insert_marketplace_students_bigint.sql) '
                    'or run without --use-existing to create new test students.'
                )
            )
            return

        self.stdout.write(f'Adding marketplace profiles for {len(users)} existing user(s)...')
        with transaction.atomic():
            for i, user in enumerate(users):
                self._set_full_student_data(user)
                row = MARKETPLACE_STUDENTS[i % len(MARKETPLACE_STUDENTS)]
                self._ensure_consent_and_profile(user, row[3], row[4], row[5], row[6], row[7])
                if hasattr(user, 'email'):
                    self.stdout.write(self.style.SUCCESS(f'  ✓ {user.email}'))
                else:
                    self.stdout.write(self.style.SUCCESS(f'  ✓ {user.pk}'))
        self.stdout.write(
            self.style.SUCCESS(
                f'Done. {len(users)} talent profile(s) are now visible in the sponsor marketplace.'
            )
        )

    def _set_full_student_data(self, user):
        """Set all User fields needed for marketplace and app (account_status, profile complete, etc.)."""
        now = timezone.now()
        updates = {}
        if hasattr(user, 'account_status'):
            updates['account_status'] = 'active'
        if hasattr(user, 'email_verified'):
            updates['email_verified'] = True
        if hasattr(user, 'email_verified_at'):
            updates['email_verified_at'] = now
        if hasattr(user, 'profile_complete'):
            updates['profile_complete'] = True
        if hasattr(user, 'onboarding_complete'):
            updates['onboarding_complete'] = True
        if hasattr(user, 'profiling_complete'):
            updates['profiling_complete'] = True
        if hasattr(user, 'foundations_complete'):
            updates['foundations_complete'] = True
        if hasattr(user, 'career_goals'):
            updates['career_goals'] = 'Cybersecurity role (SOC / analyst / DFIR)'
        if hasattr(user, 'preferred_learning_style'):
            updates['preferred_learning_style'] = 'mixed'
        if hasattr(user, 'cyber_exposure_level'):
            updates['cyber_exposure_level'] = 'intermediate'
        if hasattr(user, 'track_key'):
            updates['track_key'] = 'cyber_defense'
        if hasattr(user, 'country'):
            updates['country'] = 'KE'
        if updates:
            for k, v in updates.items():
                setattr(user, k, v)
            user.save(update_fields=list(updates.keys()))

    def _create_new_students_and_profiles(self, count: int, password: str):
        """Create new student users and marketplace profiles (real names)."""
        created = 0
        with transaction.atomic():
            for i in range(min(count, len(MARKETPLACE_STUDENTS))):
                row = MARKETPLACE_STUDENTS[i]
                first_name, last_name, email = row[0], row[1], row[2]
                talent = row[3], row[4], row[5], row[6], row[7]  # tier, readiness, status, role, skills
                if User.objects.filter(email=email).exists():
                    self.stdout.write(self.style.WARNING(f'  Skip {email} (already exists)'))
                    user = User.objects.get(email=email)
                    self._set_full_student_data(user)
                    self._ensure_consent_and_profile(user, *talent)
                    continue
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    is_active=True,
                )
                self._set_full_student_data(user)
                student_role, _ = Role.objects.get_or_create(
                    name='student', defaults={'description': 'Student role'}
                )
                UserRole.objects.get_or_create(
                    user=user, role=student_role,
                    defaults={'scope': 'global', 'is_active': True}
                )
                self._ensure_consent_and_profile(user, *talent)
                created += 1
                self.stdout.write(self.style.SUCCESS(f'  ✓ Created {first_name} {last_name} ({email})'))
        self.stdout.write(
            self.style.SUCCESS(
                f'Done. {created} new student(s) created; all {count} talent profile(s) visible in sponsor marketplace. '
                f'Password for new users: {password}'
            )
        )

    def _ensure_consent_and_profile(
        self,
        user: User,
        tier: str,
        readiness_score: Decimal,
        profile_status: str,
        primary_role: str,
        skills: list,
    ):
        grant_consent(user, 'employer_share')
        MarketplaceProfile.objects.update_or_create(
            mentee=user,
            defaults={
                'tier': tier,
                'readiness_score': readiness_score,
                'job_fit_score': readiness_score - 2,
                'profile_status': profile_status,
                'primary_role': primary_role,
                'primary_track_key': 'cyber_defense',
                'skills': skills,
                'portfolio_depth': 'moderate',
                'is_visible': True,
                'employer_share_consent': True,
            },
        )
