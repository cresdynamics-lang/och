"""
Set password for marketplace test students (created via insert_marketplace_students_bigint.sql).

Usage:
  python manage.py set_marketplace_passwords
  python manage.py set_marketplace_passwords --password mypass
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

MARKETPLACE_STUDENT_EMAILS = [
    'wilson.kinyanjui@test.com',
    'makek.muwa@test.com',
    'cynthia.wanjiku@test.com',
    'james.omondi@test.com',
    'grace.muthoni@test.com',
]


class Command(BaseCommand):
    help = 'Set password for marketplace test students (created via SQL script)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--password',
            default='testpass123',
            help='Password to set (default: testpass123)',
        )

    def handle(self, *args, **options):
        password = options['password']
        qs = User.objects.filter(email__in=MARKETPLACE_STUDENT_EMAILS)
        count = 0
        for user in qs:
            user.set_password(password)
            user.save()
            count += 1
            self.stdout.write(self.style.SUCCESS(f'  ✓ Set password for {user.email} ({user.get_full_name() or user.email})'))
        if count == 0:
            self.stdout.write(
                self.style.WARNING(
                    'No users found with emails: ' + ', '.join(MARKETPLACE_STUDENT_EMAILS) + '. '
                    'Run insert_marketplace_students_bigint.sql first.'
                )
            )
        else:
            self.stdout.write(self.style.SUCCESS(f'Done. Password set for {count} user(s).'))
