#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection

def create_director_dashboard_tables():
    cursor = connection.cursor()
    
    # Read and execute the SQL file
    with open('create_director_dashboard_tables.sql', 'r') as f:
        sql_commands = f.read()
    
    # Split by semicolon and execute each command
    commands = [cmd.strip() for cmd in sql_commands.split(';') if cmd.strip()]
    
    for command in commands:
        if command:
            print(f"Executing: {command[:50]}...")
            cursor.execute(command)
    
    print("Director dashboard tables created successfully!")

if __name__ == '__main__':
    create_director_dashboard_tables()