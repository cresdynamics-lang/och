"""
API endpoint to create OCH users
POST /api/v1/users/create-och-users/
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from users.models import Role, UserRole
from django.db.models.signals import post_save
from community import signals

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])  # Allow for initial setup
def create_och_users(request):
    """
    Create OCH users with @och.com emails
    POST with empty body or {'confirm': true}
    """
    # Disconnect problematic signal
    post_save.disconnect(signals.auto_map_user_on_create, sender=User)

    try:
        och_users = [
            {
                'email': 'student@och.com',
                'username': 'student',
                'first_name': 'Student',
                'last_name': 'User',
                'role': 'student',
                'is_staff': False,
                'is_superuser': False
            },
            {
                'email': 'mentor@och.com',
                'username': 'mentor',
                'first_name': 'Mentor',
                'last_name': 'User',
                'role': 'mentor',
                'is_staff': False,
                'is_superuser': False
            },
            {
                'email': 'admin@och.com',
                'username': 'admin',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True
            },
            {
                'email': 'director@och.com',
                'username': 'director',
                'first_name': 'Program',
                'last_name': 'Director',
                'role': 'program_director',
                'is_staff': True,
                'is_superuser': False
            },
            {
                'email': 'analyst@och.com',
                'username': 'analyst',
                'first_name': 'Data',
                'last_name': 'Analyst',
                'role': 'analyst',
                'is_staff': True,
                'is_superuser': False
            },
            {
                'email': 'finance@och.com',
                'username': 'finance',
                'first_name': 'Finance',
                'last_name': 'Manager',
                'role': 'finance',
                'is_staff': True,
                'is_superuser': False
            }
        ]

        password = 'TestPass@123'
        created_count = 0
        updated_count = 0
        results = []

        for user_data in och_users:
            role_name = user_data.pop('role')
            email = user_data['email']
            
            try:
                user = User.objects.get(email=email)
                user.set_password(password)
                user.account_status = 'active'
                user.email_verified = True
                user.is_active = True
                for key, value in user_data.items():
                    setattr(user, key, value)
                user.save()
                updated_count += 1
                results.append({'email': email, 'role': role_name, 'action': 'updated'})
            except User.DoesNotExist:
                user = User.objects.create_user(
                    email=email,
                    password=password,
                    account_status='active',
                    email_verified=True,
                    is_active=True,
                    **user_data
                )
                created_count += 1
                results.append({'email': email, 'role': role_name, 'action': 'created'})
            
            # Assign role
            role, _ = Role.objects.get_or_create(name=role_name)
            UserRole.objects.get_or_create(
                user=user,
                role=role,
                defaults={'scope': 'global', 'is_active': True}
            )

        return Response({
            'success': True,
            'message': 'OCH users created successfully',
            'created': created_count,
            'updated': updated_count,
            'total': len(och_users),
            'results': results,
            'password': password
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        # Reconnect signal
        post_save.connect(signals.auto_map_user_on_create, sender=User)

