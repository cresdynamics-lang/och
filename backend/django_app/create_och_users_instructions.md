# Create OCH Users

## Quick Instructions

The users need to be created in the Django database. Since the Django server is running, you can create them using Django shell or admin.

### Option 1: Using Django Shell (Recommended)

1. Make sure Django server is running on port 8000
2. Open a new terminal and run:

```bash
cd backend/django_app
source venv/bin/activate  # or venv_new/bin/activate
python3 manage.py shell
```

3. Then paste this code in the Django shell:

```python
from django.contrib.auth import get_user_model
from users.models import Role, UserRole
from django.db.models.signals import post_save
from community import signals

User = get_user_model()
post_save.disconnect(signals.auto_map_user_on_create, sender=User)

och_users = [
    {'email': 'student@och.com', 'username': 'student', 'first_name': 'Student', 'last_name': 'User', 'role': 'student'},
    {'email': 'mentor@och.com', 'username': 'mentor', 'first_name': 'Mentor', 'last_name': 'User', 'role': 'mentor'},
    {'email': 'admin@och.com', 'username': 'admin', 'first_name': 'Admin', 'last_name': 'User', 'role': 'admin', 'is_staff': True, 'is_superuser': True},
    {'email': 'director@och.com', 'username': 'director', 'first_name': 'Program', 'last_name': 'Director', 'role': 'program_director', 'is_staff': True},
    {'email': 'analyst@och.com', 'username': 'analyst', 'first_name': 'Data', 'last_name': 'Analyst', 'role': 'analyst', 'is_staff': True},
    {'email': 'finance@och.com', 'username': 'finance', 'first_name': 'Finance', 'last_name': 'Manager', 'role': 'finance', 'is_staff': True},
]

password = 'TestPass@123'

for user_data in och_users:
    role_name = user_data.pop('role')
    email = user_data['email']
    
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            **user_data,
            'account_status': 'active',
            'email_verified': True,
            'is_active': True,
        }
    )
    
    if not created:
        user.set_password(password)
        user.account_status = 'active'
        user.email_verified = True
        user.is_active = True
        for key, value in user_data.items():
            setattr(user, key, value)
        user.save()
        print(f'✓ Updated: {email}')
    else:
        user.set_password(password)
        user.save()
        print(f'✓ Created: {email}')
    
    role, _ = Role.objects.get_or_create(name=role_name)
    UserRole.objects.get_or_create(
        user=user,
        role=role,
        defaults={'scope': 'global', 'is_active': True}
    )

post_save.connect(signals.auto_map_user_on_create, sender=User)
print('\n✅ All OCH users created!')
print(f'Password for all: {password}')
```

### Option 2: Using Django Admin

1. Login to Django admin at http://localhost:8000/admin
2. Create users manually with the emails and password `TestPass@123`
3. Assign roles to each user

### Users to Create

- **student@och.com** / TestPass@123 (role: student)
- **mentor@och.com** / TestPass@123 (role: mentor)
- **admin@och.com** / TestPass@123 (role: admin, is_staff=True, is_superuser=True)
- **director@och.com** / TestPass@123 (role: program_director, is_staff=True)
- **analyst@och.com** / TestPass@123 (role: analyst, is_staff=True)
- **finance@och.com** / TestPass@123 (role: finance, is_staff=True)

