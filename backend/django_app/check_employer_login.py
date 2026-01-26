#!/usr/bin/env python
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

print("🔍 Checking employer user credentials...")
print("=" * 50)

try:
    # Check if user exists
    user = User.objects.filter(email='employer@och.com').first()
    if user:
        print(f'✅ User exists: {user.email}')
        print(f'✅ Account status: {user.account_status}')
        print(f'✅ Email verified: {user.email_verified}')
        print(f'✅ Is active: {user.is_active}')

        # Test password
        password_valid = user.check_password('Ongoza@#1')
        print(f'✅ Password check result: {password_valid}')

        if password_valid:
            print('✅ Password is correct - login should work')
        else:
            print('❌ Password is incorrect - resetting password...')
            user.set_password('Ongoza@#1')
            user.save()
            print('✅ Password reset to: Ongoza@#1')

        # Show user details
        print(f'User ID: {user.id}')
        print(f'Username: {user.username}')
        print(f'First name: {user.first_name}')
        print(f'Last name: {user.last_name}')

        # Check roles
        try:
            from users.models import UserRole
            user_roles = UserRole.objects.filter(user=user).select_related('role')
            role_names = [ur.role.name for ur in user_roles]
            print(f'✅ User roles: {role_names}')

            if 'sponsor_admin' in role_names:
                print('✅ User has sponsor_admin role - can access employer dashboard')
            else:
                print('❌ User missing sponsor_admin role')
        except Exception as e:
            print(f'❌ Error checking roles: {e}')

    else:
        print('❌ User does not exist with email: employer@och.com')

        # Check if there's a user with the old email
        old_user = User.objects.filter(email='ongozacyberhub@gmail.com').first()
        if old_user:
            print(f'❌ Found user with old email: {old_user.email}')
            print('   This user may need email updated to employer@och.com')

            # Update the email
            old_user.email = 'employer@och.com'
            old_user.save()
            print('✅ Updated user email to employer@och.com')

            # Test password
            password_valid = old_user.check_password('Ongoza@#1')
            if not password_valid:
                old_user.set_password('Ongoza@#1')
                old_user.save()
                print('✅ Reset password to Ongoza@#1')

            print(f'✅ User is now ready for login: {old_user.email}')
        else:
            print('❌ No user found with either email - need to create user')

            # Create the user
            print('Creating new employer user...')
            new_user = User.objects.create_user(
                username='employer_och',
                email='employer@och.com',
                password='Ongoza@#1',
                first_name='Employer',
                last_name='OCH',
                account_status='active',
                email_verified=True
            )
            print(f'✅ Created new user: {new_user.email}')

            # Assign sponsor_admin role
            try:
                from users.models import Role, UserRole
                role, _ = Role.objects.get_or_create(
                    name='sponsor_admin',
                    defaults={
                        'display_name': 'Sponsor/Employer Admin',
                        'description': 'Employer/Sponsor administrative access',
                        'is_system_role': True
                    }
                )

                UserRole.objects.get_or_create(
                    user=new_user,
                    role=role,
                    defaults={
                        'assigned_by': new_user,
                        'scope': 'global'
                    }
                )
                print('✅ Assigned sponsor_admin role')
            except Exception as e:
                print(f'❌ Error assigning role: {e}')

except Exception as e:
    print(f'❌ Error: {e}')

print("=" * 50)
print("🎯 LOGIN CREDENTIALS:")
print(f"Email: employer@och.com")
print(f"Password: Ongoza@#1")
print(f"Login URL: http://localhost:3000/login/sponsor")

