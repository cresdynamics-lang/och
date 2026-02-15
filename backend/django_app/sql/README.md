# SQL seed: Permissions and role-permission assignments

Run this once to populate `permissions`, ensure all `roles` exist, and assign permissions to roles. Idempotent for PostgreSQL (uses `ON CONFLICT DO NOTHING` and per-role DELETE + INSERT).

**PostgreSQL (recommended):**
```bash
# From project root (replace with your connection string or use .env)
psql "$DATABASE_URL" -f backend/django_app/sql/seed_permissions_and_roles.sql

# Or from Django dbshell
cd backend/django_app && python manage.py dbshell < sql/seed_permissions_and_roles.sql
```

**Docker:**
```bash
docker compose exec db psql -U postgres -d och -f - < backend/django_app/sql/seed_permissions_and_roles.sql
# If the file is not in the container, copy it in or run from host with network to DB.
```

**MySQL:** This file uses PostgreSQL syntax (`ON CONFLICT`). For MySQL you would need to replace with `INSERT IGNORE` or use the Django command instead: `python manage.py seed_roles_permissions`.

**M2M table name:** If your Django migration created a different through table for `Role.permissions`, update the SQL: replace `users_role_permissions` with the actual table name (e.g. from `python manage.py sqlmigrate users 0001` or inspect the database).
