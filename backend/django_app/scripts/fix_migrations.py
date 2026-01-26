#!/usr/bin/env python
"""
Script to fix migration order issues.
Run this if you get "relation does not exist" errors.
"""
import os
import sys
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

def run_command(cmd, description):
    """Run a Django management command."""
    print(f"\n{description}...")
    try:
        result = subprocess.run(
            cmd,
            cwd=BASE_DIR,
            check=True,
            capture_output=True,
            text=True
        )
        print(f"✅ {description} completed")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed")
        print(e.stderr)
        return False

def main():
    print("=" * 50)
    print("Fixing Migration Order")
    print("=" * 50)
    
    # Step 1: Create organizations migrations
    if not run_command(
        ["python", "manage.py", "makemigrations", "organizations", "--name", "initial"],
        "Creating organizations migrations"
    ):
        print("\n⚠️  Organizations migrations failed. Continuing anyway...")
    
    # Step 2: Create progress migrations
    if not run_command(
        ["python", "manage.py", "makemigrations", "progress", "--name", "initial"],
        "Creating progress migrations"
    ):
        print("\n⚠️  Progress migrations failed (may not have models). Continuing...")
    
    # Step 3: Check users migrations
    users_migration = BASE_DIR / "users" / "migrations" / "0001_initial.py"
    if users_migration.exists():
        print("\nChecking users migration dependencies...")
        with open(users_migration) as f:
            content = f.read()
            if "('organizations'," in content or "('organizations', '__first__')" in content:
                print("✅ Users migration has organizations dependency")
            else:
                print("⚠️  Users migration may need organizations dependency")
                print("   Consider deleting and recreating users migrations")
    
    # Step 4: Run migrations
    print("\n" + "=" * 50)
    if not run_command(
        ["python", "manage.py", "migrate"],
        "Running all migrations"
    ):
        print("\n" + "=" * 50)
        print("❌ Migrations failed")
        print("\nTroubleshooting:")
        print("1. Ensure PostgreSQL is running")
        print("2. Check database credentials in .env")
        print("3. Create database: python manage.py create_db")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("✅ All migrations completed successfully!")
    print("=" * 50)

if __name__ == '__main__':
    main()


