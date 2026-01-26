"""
Management command to seed mentorship test data.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from mentorship_coordination.models import MenteeMentorAssignment, MentorSession, MentorWorkQueue
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed mentorship coordination test data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding mentorship coordination data...')
        
        # Create or get mentor
        mentor, created = User.objects.get_or_create(
            email='mentor@och.africa',
            defaults={
                'username': 'mentor',
                'first_name': 'John',
                'last_name': 'Mentor',
                'is_mentor': True,
                'mentor_capacity_weekly': 10,
                'mentor_specialties': ['SIEM', 'DFIR', 'SOC'],
                'mentor_availability': {
                    'mon': ['14:00-16:00'],
                    'wed': ['14:00-16:00'],
                    'fri': ['10:00-12:00']
                }
            }
        )
        
        if created:
            mentor.set_password('test123')
            mentor.save()
            self.stdout.write(self.style.SUCCESS(f'Created mentor: {mentor.email}'))
        else:
            mentor.is_mentor = True
            mentor.save()
            self.stdout.write(self.style.SUCCESS(f'Using existing mentor: {mentor.email}'))
        
        # Create or get test mentee
        mentee, created = User.objects.get_or_create(
            email='test@och.africa',
            defaults={
                'username': 'teststudent',
                'first_name': 'Test',
                'last_name': 'Student',
            }
        )
        
        if created:
            mentee.set_password('test123')
            mentee.save()
            self.stdout.write(self.style.SUCCESS(f'Created mentee: {mentee.email}'))
        
        # Create assignment
        assignment, created = MenteeMentorAssignment.objects.get_or_create(
            mentee=mentee,
            mentor=mentor,
            defaults={
                'status': 'active',
                'max_sessions': 12,
                'sessions_used': 2
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created assignment: {mentee.email} ← {mentor.email}'))
        
        # Create test session
        session, created = MentorSession.objects.get_or_create(
            assignment=assignment,
            mentee=mentee,
            mentor=mentor,
            title='1:1 Progress Review',
            defaults={
                'type': 'one_on_one',
                'start_time': timezone.now() + timedelta(days=1),
                'end_time': timezone.now() + timedelta(days=1, hours=1),
                'zoom_url': 'https://zoom.us/j/123456789'
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created session: {session.title}'))
        
        # Create test work queue item
        work_item, created = MentorWorkQueue.objects.get_or_create(
            mentor=mentor,
            mentee=mentee,
            type='mission_review',
            title='SIEM Dashboard Review',
            defaults={
                'priority': 'high',
                'description': 'Review SIEM dashboard mission submission',
                'sla_hours': 48,
                'due_at': timezone.now() + timedelta(hours=24),
                'status': 'pending'
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created work queue item: {work_item.title}'))
        
        self.stdout.write(self.style.SUCCESS('Mentorship coordination seeding complete!'))

