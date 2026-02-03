#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from users.models import User, Entitlement, UserRole, Role
from programs.models import Enrollment, Cohort, Track, Program
from django.utils import timezone

def setup_student_automation():
    """
    Set up proper automation for student progression.
    This addresses the gaps in the current system.
    """
    try:
        user = User.objects.get(email='bob@student.com')
        print(f'Setting up automation for: {user.email}')
        
        # 1. GRANT BASIC ENTITLEMENTS (Should be automatic on registration)
        basic_entitlements = [
            'missions_access',
            'curriculum_access', 
            'starter_tier',
            'video_content',
            'quiz_access',
            'basic_mentorship'
        ]
        
        for feature in basic_entitlements:
            entitlement, created = Entitlement.objects.get_or_create(
                user=user,
                feature=feature,
                defaults={
                    'granted': True,
                    'granted_at': timezone.now(),
                    'expires_at': None
                }
            )
            if created:
                print(f'+ Granted {feature} entitlement')
            else:
                entitlement.granted = True
                entitlement.granted_at = timezone.now()
                entitlement.save()
                print(f'+ Updated {feature} entitlement')
        
        # 2. ENSURE PROPER ROLE ASSIGNMENT
        try:
            student_role = Role.objects.get(name='student')
            user_role, created = UserRole.objects.get_or_create(
                user=user,
                role=student_role,
                scope='global',
                defaults={'is_active': True}
            )
            if created:
                print('+ Assigned student role')
            else:
                user_role.is_active = True
                user_role.save()
                print('+ Activated student role')
        except Role.DoesNotExist:
            print('! Student role not found - creating it')
            student_role = Role.objects.create(
                name='student',
                display_name='Student',
                description='Default student role with basic access',
                is_system_role=True
            )
            UserRole.objects.create(
                user=user,
                role=student_role,
                scope='global',
                is_active=True
            )
            print('+ Created and assigned student role')
        
        # 3. AUTO-ENROLL IN DEFAULT TRACK (Should be automatic)
        try:
            # Find or create a default program and track
            program, created = Program.objects.get_or_create(
                name='Cyber Security Fundamentals',
                defaults={
                    'category': 'technical',
                    'description': 'Basic cyber security training program',
                    'duration_months': 6,
                    'default_price': 0.00,
                    'status': 'active'
                }
            )
            
            track, created = Track.objects.get_or_create(
                program=program,
                key='defender',
                defaults={
                    'name': 'Cyber Defender Track',
                    'track_type': 'primary',
                    'description': 'Foundational cyber defense skills'
                }
            )
            
            # Create a cohort if none exists
            cohort, created = Cohort.objects.get_or_create(
                track=track,
                name='Default Cohort 2024',
                defaults={
                    'start_date': timezone.now().date(),
                    'end_date': timezone.now().date().replace(month=12, day=31),
                    'seat_cap': 100,
                    'status': 'active'
                }
            )
            
            # Enroll user in cohort
            enrollment, created = Enrollment.objects.get_or_create(
                user=user,
                cohort=cohort,
                defaults={
                    'enrollment_type': 'self',
                    'seat_type': 'paid',
                    'payment_status': 'waived',  # Waive payment for test user
                    'status': 'active'
                }
            )
            
            if created:
                print(f'+ Auto-enrolled in {track.name}')
            else:
                enrollment.status = 'active'
                enrollment.payment_status = 'waived'
                enrollment.save()
                print(f'+ Updated enrollment in {track.name}')
                
        except Exception as e:
            print(f'! Error with track enrollment: {e}')
        
        # 4. UPDATE USER PROFILE FOR AUTOMATION
        user.profiling_complete = True
        user.foundations_complete = True
        user.account_status = 'active'
        user.is_active = True
        user.save()
        
        print(f'\nSuccess! Automation setup complete for {user.email}!')
        print('+ Basic entitlements granted')
        print('+ Student role assigned') 
        print('+ Track enrollment active')
        print('+ Profile completion flags set')
        print('\nUser should now have full access to missions and curriculum.')
        
    except User.DoesNotExist:
        print('Error: User bob@student.com not found')
    except Exception as e:
        print(f'Error: {e}')

if __name__ == '__main__':
    setup_student_automation()