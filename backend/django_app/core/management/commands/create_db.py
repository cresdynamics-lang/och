"""
Django management command to create the database.
Usage: python manage.py create_db
"""
import os
import psycopg2
from psycopg2 import sql
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Create the PostgreSQL database if it does not exist'

    def handle(self, *args, **options):
        db_settings = settings.DATABASES['default']
        db_name = db_settings['NAME']
        db_user = db_settings['USER']
        db_password = db_settings['PASSWORD']
        db_host = db_settings['HOST']
        db_port = db_settings['PORT']

        self.stdout.write(f"Creating database: {db_name}")
        self.stdout.write(f"User: {db_user}")
        self.stdout.write(f"Host: {db_host}:{db_port}")

        try:
            # Connect to PostgreSQL server (connect to 'postgres' database)
            conn = psycopg2.connect(
                host=db_host,
                port=db_port,
                user=db_user,
                password=db_password,
                database='postgres'  # Connect to default database
            )
            conn.autocommit = True
            cursor = conn.cursor()

            # Check if database exists
            cursor.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s",
                (db_name,)
            )

            exists = cursor.fetchone()

            if exists:
                self.stdout.write(
                    self.style.WARNING(f"Database '{db_name}' already exists.")
                )
            else:
                # Create database
                cursor.execute(
                    sql.SQL("CREATE DATABASE {}").format(
                        sql.Identifier(db_name)
                    )
                )
                self.stdout.write(
                    self.style.SUCCESS(f"Database '{db_name}' created successfully!")
                )

            cursor.close()
            conn.close()

        except psycopg2.OperationalError as e:
            self.stdout.write(
                self.style.ERROR(f"Error connecting to PostgreSQL: {e}")
            )
            self.stdout.write("\nMake sure:")
            self.stdout.write("1. PostgreSQL is running")
            self.stdout.write("2. Database credentials are correct in .env file")
            self.stdout.write("3. User has permission to create databases")
            return

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error creating database: {e}")
            )
            return


