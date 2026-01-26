#!/usr/bin/env python
"""
Create user directly with raw SQL to bypass migration issues.
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection
from django.contrib.auth.hashers import make_password

def create_user():
    cursor = connection.cursor()
    try:
        # Check if user exists
        cursor.execute('SELECT id FROM users WHERE email = %s', ['ongozacyberhub@gmail.com'])
        existing_user = cursor.fetchone()

        if existing_user:
            print('User already exists. Updating password...')
            hashed_password = make_password('Ongoza@#1')
            cursor.execute('''
                UPDATE users SET
                    password = %s,
                    account_status = 'active',
                    email_verified = true,
                    is_active = true,
                    updated_at = NOW()
                WHERE email = %s
            ''', [hashed_password, 'ongozacyberhub@gmail.com'])
            print('✓ Updated existing user password')
        else:
            print('Creating new user...')
            hashed_password = make_password('Ongoza@#1')
            cursor.execute('''
                INSERT INTO users (
                    email, username, password, first_name, last_name,
                    account_status, email_verified, is_active, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            ''', [
                'ongozacyberhub@gmail.com',
                'ongozacyberhub',
                hashed_password,
                'Ongoza',
                'Cyberhub',
                'active',
                True,
                True
            ])
            print('✓ Created new user')

        # Try to assign role if roles table exists
        try:
            cursor.execute('SELECT id FROM users_roles WHERE name = %s', ['student'])
            role = cursor.fetchone()
            if role:
                # Get the user ID
                cursor.execute('SELECT id FROM users WHERE email = %s', ['ongozacyberhub@gmail.com'])
                user_id = cursor.fetchone()[0]

                cursor.execute('SELECT id FROM users_user_roles WHERE user_id = %s AND role_id = %s',
                             [user_id, role[0]])
                if not cursor.fetchone():
                    cursor.execute('INSERT INTO users_user_roles (user_id, role_id, scope, is_active) VALUES (%s, %s, %s, %s)',
                                 [user_id, role[0], 'global', True])
                    print('✓ Assigned student role')
                else:
                    print('✓ User already has student role')
            else:
                print('⚠ Student role not found, but user created')
        except Exception as e:
            print(f'⚠ Could not assign role: {e}')
            print('User created but role assignment failed')

        connection.commit()
        print('\n✅ User setup complete!')
        print('Email: ongozacyberhub@gmail.com')
        print('Password: Ongoza@#1')

    except Exception as e:
        connection.rollback()
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()
    finally:
        cursor.close()

if __name__ == '__main__':
    create_user()
