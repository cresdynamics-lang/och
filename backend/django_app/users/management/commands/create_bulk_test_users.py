"""
Django management command to create bulk test users for development.
Creates 51 users: 40 students, 5 mentors, 3 directors, 2 admins, 1 finance admin
Usage: python manage.py create_bulk_test_users
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Role, UserRole
from django.db.models.signals import post_save
from community import signals
import random
import string

User = get_user_model()


class Command(BaseCommand):
    help = 'Create 51 bulk test users (40 students, 5 mentors, 3 directors, 2 admins, 1 finance admin) for development'

    def add_arguments(self, parser):
        parser.add_argument(
            '--password',
            type=str,
            default='testpass123',
            help='Password for all test users (default: testpass123)',
        )

    def handle(self, *args, **options):
        default_password = options['password']

        # Disconnect problematic signal to avoid database errors
        post_save.disconnect(signals.auto_map_user_on_create, sender=User)

        try:
            # Create or get roles
            roles = {}
            role_names = ['admin', 'program_director', 'mentor', 'student', 'finance_admin']
            
            for role_name in role_names:
                role, created = Role.objects.get_or_create(name=role_name)
                roles[role_name] = role
                if created:
                    self.stdout.write(self.style.SUCCESS(f'Created role: {role_name}'))

            # User creation configuration
            user_configs = [
                {'count': 2, 'role': 'admin', 'role_name': 'Admin', 'prefix': 'admin'},
                {'count': 3, 'role': 'program_director', 'role_name': 'Director', 'prefix': 'director'},
                {'count': 5, 'role': 'mentor', 'role_name': 'Mentor', 'prefix': 'mentor'},
                {'count': 40, 'role': 'student', 'role_name': 'Student', 'prefix': 'student'},
                {'count': 1, 'role': 'finance_admin', 'role_name': 'Finance Admin', 'prefix': 'finance'},
            ]

            created_count = 0
            updated_count = 0

            self.stdout.write(self.style.SUCCESS('\n' + '='*70))
            self.stdout.write(self.style.SUCCESS('Creating Bulk Test Users'))
            self.stdout.write(self.style.SUCCESS('='*70 + '\n'))

            for config in user_configs:
                role = roles[config['role']]
                self.stdout.write(f"\nCreating {config['count']} {config['role_name']}s...")
                
                for i in range(1, config['count'] + 1):
                    # Generate unique email and username
                    email = f"{config['prefix']}{i}@test.com"
                    username = f"{config['prefix']}{i}"
                    
                    # Generate first and last names
                    first_names = {
                        'admin': ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan'],
                        'program_director': ['David', 'Sarah', 'Michael', 'Emily', 'Robert'],
                        'mentor': ['James', 'Jennifer', 'William', 'Jessica', 'Christopher'],
                        'finance_admin': ['Patricia', 'Richard', 'Linda', 'Thomas', 'Barbara'],
                        'student': ['Emma', 'Noah', 'Olivia', 'Liam', 'Ava', 'Ethan', 'Sophia', 'Mason', 
                                   'Isabella', 'James', 'Mia', 'Benjamin', 'Charlotte', 'Lucas', 'Amelia',
                                   'Henry', 'Harper', 'Alexander', 'Evelyn', 'Michael', 'Abigail', 'Daniel',
                                   'Emily', 'Matthew', 'Elizabeth', 'Aiden', 'Sofia', 'Joseph', 'Avery',
                                   'Samuel', 'Ella', 'David', 'Madison', 'Jackson', 'Scarlett', 'Sebastian',
                                   'Victoria', 'Carter', 'Aria', 'Wyatt']
                    }
                    
                    last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
                                 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas',
                                 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris',
                                 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen',
                                 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams']
                    
                    first_name = random.choice(first_names.get(config['role'], first_names['student']))
                    last_name = random.choice(last_names)
                    
                    # Create or get user
                    user, created = User.objects.get_or_create(
                        email=email,
                        defaults={
                            'username': username,
                            'first_name': first_name,
                            'last_name': last_name,
                            'account_status': 'active',
                            'email_verified': True,
                            'is_active': True,
                        }
                    )

                    if not created:
                        # Update existing user
                        user.username = username
                        user.first_name = first_name
                        user.last_name = last_name
                        user.account_status = 'active'
                        user.email_verified = True
                        user.is_active = True
                        user.save()
                        updated_count += 1
                    else:
                        created_count += 1

                    # Set password
                    user.set_password(default_password)
                    user.save()

                    # For admins, set is_staff and is_superuser
                    if config['role'] == 'admin':
                        user.is_staff = True
                        user.is_superuser = True
                        user.save()
                    
                    # For finance admins, set is_staff (but not superuser)
                    if config['role'] == 'finance_admin':
                        user.is_staff = True
                        user.save()

                    # For mentors, set mentor flag and some default values
                    if config['role'] == 'mentor':
                        user.is_mentor = True
                        user.mentor_capacity_weekly = random.randint(5, 15)
                        user.mentor_specialties = random.sample(
                            ['SIEM', 'DFIR', 'SOC', 'Incident Response', 'Malware Analysis', 
                             'Network Security', 'Cloud Security', 'Penetration Testing'],
                            k=random.randint(2, 4)
                        )
                        user.mentor_availability = {
                            'mon': ['14:00-16:00'],
                            'wed': ['14:00-16:00'],
                            'fri': ['10:00-12:00']
                        }
                        user.save()

                    # Assign role
                    user_role, role_created = UserRole.objects.get_or_create(
                        user=user,
                        role=role,
                        defaults={'scope': 'global', 'is_active': True}
                    )

                    if created:
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'  ✓ Created: {email} ({first_name} {last_name}) - {config["role_name"]}'
                            )
                        )
                    else:
                        self.stdout.write(
                            self.style.WARNING(
                                f'  ↻ Updated: {email} ({first_name} {last_name}) - {config["role_name"]}'
                            )
                        )

            self.stdout.write(self.style.SUCCESS('\n' + '='*70))
            self.stdout.write(self.style.SUCCESS('Bulk Test Users Summary'))
            self.stdout.write(self.style.SUCCESS('='*70))
            self.stdout.write(f'Created: {created_count} users')
            self.stdout.write(f'Updated: {updated_count} users')
            self.stdout.write(f'\nUser Breakdown:')
            self.stdout.write(f'  - Admins: 2 (admin1@test.com - admin2@test.com)')
            self.stdout.write(f'  - Directors: 3 (director1@test.com - director3@test.com)')
            self.stdout.write(f'  - Mentors: 5 (mentor1@test.com - mentor5@test.com)')
            self.stdout.write(f'  - Students: 40 (student1@test.com - student40@test.com)')
            self.stdout.write(f'  - Finance Admins: 1 (finance1@test.com)')
            self.stdout.write(f'\nDefault password for all users: {default_password}')
            self.stdout.write(self.style.SUCCESS('\n✓ Bulk test users ready for development!'))
        finally:
            # Reconnect signal
            post_save.connect(signals.auto_map_user_on_create, sender=User)
