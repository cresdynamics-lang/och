-- =============================================================================
-- OCH Platform: Full RBAC seed - Permissions and Role-Permission assignments
-- Run once: psql $DATABASE_URL -f backend/django_app/sql/seed_permissions_and_roles.sql
-- Or from Django: python manage.py dbshell < backend/django_app/sql/seed_permissions_and_roles.sql
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. PERMISSIONS: Insert all permissions (ON CONFLICT DO NOTHING on name)
-- -----------------------------------------------------------------------------
INSERT INTO permissions (name, resource_type, action, description, created_at)
VALUES
  ('create_user', 'user', 'create', 'Create users', NOW()),
  ('read_user', 'user', 'read', 'Read user profiles', NOW()),
  ('update_user', 'user', 'update', 'Update user profiles', NOW()),
  ('delete_user', 'user', 'delete', 'Delete users', NOW()),
  ('list_users', 'user', 'list', 'List users', NOW()),
  ('manage_users', 'user', 'manage', 'Manage all users', NOW()),
  ('create_organization', 'organization', 'create', 'Create organizations', NOW()),
  ('read_organization', 'organization', 'read', 'Read organization details', NOW()),
  ('update_organization', 'organization', 'update', 'Update organizations', NOW()),
  ('delete_organization', 'organization', 'delete', 'Delete organizations', NOW()),
  ('list_organizations', 'organization', 'list', 'List organizations', NOW()),
  ('manage_organizations', 'organization', 'manage', 'Manage all organizations', NOW()),
  ('create_cohort', 'cohort', 'create', 'Create cohorts', NOW()),
  ('read_cohort', 'cohort', 'read', 'Read cohort details', NOW()),
  ('update_cohort', 'cohort', 'update', 'Update cohorts', NOW()),
  ('delete_cohort', 'cohort', 'delete', 'Delete cohorts', NOW()),
  ('list_cohorts', 'cohort', 'list', 'List cohorts', NOW()),
  ('manage_cohorts', 'cohort', 'manage', 'Manage all cohorts', NOW()),
  ('create_track', 'track', 'create', 'Create tracks', NOW()),
  ('read_track', 'track', 'read', 'Read track details', NOW()),
  ('update_track', 'track', 'update', 'Update tracks', NOW()),
  ('delete_track', 'track', 'delete', 'Delete tracks', NOW()),
  ('list_tracks', 'track', 'list', 'List tracks', NOW()),
  ('manage_tracks', 'track', 'manage', 'Manage all tracks', NOW()),
  ('create_portfolio', 'portfolio', 'create', 'Create portfolios', NOW()),
  ('read_portfolio', 'portfolio', 'read', 'Read portfolio details', NOW()),
  ('update_portfolio', 'portfolio', 'update', 'Update portfolios', NOW()),
  ('delete_portfolio', 'portfolio', 'delete', 'Delete portfolios', NOW()),
  ('list_portfolios', 'portfolio', 'list', 'List portfolios', NOW()),
  ('manage_portfolios', 'portfolio', 'manage', 'Manage all portfolios', NOW()),
  ('create_profiling', 'profiling', 'create', 'Create profiling data', NOW()),
  ('read_profiling', 'profiling', 'read', 'Read profiling data', NOW()),
  ('update_profiling', 'profiling', 'update', 'Update profiling data', NOW()),
  ('list_profiling', 'profiling', 'list', 'List profiling data', NOW()),
  ('create_mentorship', 'mentorship', 'create', 'Create mentorship relationships', NOW()),
  ('read_mentorship', 'mentorship', 'read', 'Read mentorship data', NOW()),
  ('update_mentorship', 'mentorship', 'update', 'Update mentorship data', NOW()),
  ('list_mentorship', 'mentorship', 'list', 'List mentorship relationships', NOW()),
  ('read_analytics', 'analytics', 'read', 'Read analytics data', NOW()),
  ('list_analytics', 'analytics', 'list', 'List analytics reports', NOW()),
  ('read_billing', 'billing', 'read', 'Read billing information', NOW()),
  ('update_billing', 'billing', 'update', 'Update billing information', NOW()),
  ('manage_billing', 'billing', 'manage', 'Manage billing', NOW()),
  ('create_invoice', 'invoice', 'create', 'Create invoices', NOW()),
  ('read_invoice', 'invoice', 'read', 'Read invoice details', NOW()),
  ('update_invoice', 'invoice', 'update', 'Update invoices', NOW()),
  ('list_invoices', 'invoice', 'list', 'List invoices', NOW()),
  ('delete_invoice', 'invoice', 'delete', 'Delete invoices', NOW()),
  ('create_api_key', 'api_key', 'create', 'Create API keys', NOW()),
  ('read_api_key', 'api_key', 'read', 'Read API key details', NOW()),
  ('revoke_api_key', 'api_key', 'delete', 'Revoke API keys', NOW()),
  ('list_api_keys', 'api_key', 'list', 'List API keys', NOW()),
  ('create_webhook', 'webhook', 'create', 'Create webhook endpoints', NOW()),
  ('read_webhook', 'webhook', 'read', 'Read webhook details', NOW()),
  ('update_webhook', 'webhook', 'update', 'Update webhooks', NOW()),
  ('delete_webhook', 'webhook', 'delete', 'Delete webhooks', NOW()),
  ('list_webhooks', 'webhook', 'list', 'List webhooks', NOW())
ON CONFLICT (name) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. ROLES: Ensure all roles exist (ON CONFLICT DO NOTHING on name)
-- -----------------------------------------------------------------------------
INSERT INTO roles (name, display_name, description, is_system_role, created_at, updated_at)
VALUES
  ('admin', 'Admin', 'Full platform admin; manage roles/policies, tenants, secrets', true, NOW(), NOW()),
  ('program_director', 'Program Director', 'Manage programs/cohorts/tracks; view analytics; assign mentors', true, NOW(), NOW()),
  ('mentor', 'Mentor', 'Access assigned mentees; create notes; review portfolios; limited analytics', true, NOW(), NOW()),
  ('mentee', 'Mentee', 'Primary user role for mentees in the OCH ecosystem (Tier 0 and Tier 1)', true, NOW(), NOW()),
  ('student', 'Student', 'Access personal modules (profiling, learning, portfolio, mentorship)', true, NOW(), NOW()),
  ('employer', 'Employer', 'Browse talent, filter by skill/readiness; contact Professional-tier mentees; post assignments', true, NOW(), NOW()),
  ('finance', 'Finance', 'Access billing/revenue, refunds, sponsorship wallets; no student PII beyond billing', true, NOW(), NOW()),
  ('finance_admin', 'Finance Admin', 'Full finance administration access; manage billing, invoices, refunds, and financial reports', true, NOW(), NOW()),
  ('sponsor_admin', 'Sponsor/Employer Admin', 'Manage sponsored users, view permitted profiles per consent', true, NOW(), NOW()),
  ('analyst', 'Analyst', 'Analytics read with RLS/CLS; no PII without scope', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. ROLE-PERMISSION ASSIGNMENTS (M2M table: roles_permissions)
-- Clear existing assignments then insert so this script is idempotent per role.
-- -----------------------------------------------------------------------------

-- Admin: all permissions
DELETE FROM roles_permissions WHERE role_id = (SELECT id FROM roles WHERE name = 'admin');
INSERT INTO roles_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'admin'), id FROM permissions;

-- Program Director
DELETE FROM roles_permissions WHERE role_id = (SELECT id FROM roles WHERE name = 'program_director');
INSERT INTO roles_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'program_director'), id FROM permissions
WHERE name IN (
  'read_user', 'list_users',
  'read_organization', 'list_organizations',
  'create_cohort', 'read_cohort', 'update_cohort', 'list_cohorts', 'manage_cohorts',
  'create_track', 'read_track', 'update_track', 'list_tracks', 'manage_tracks',
  'read_portfolio', 'list_portfolios',
  'read_profiling', 'list_profiling',
  'create_mentorship', 'read_mentorship', 'update_mentorship', 'list_mentorship',
  'read_analytics', 'list_analytics'
);

-- Mentor
DELETE FROM roles_permissions WHERE role_id = (SELECT id FROM roles WHERE name = 'mentor');
INSERT INTO roles_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'mentor'), id FROM permissions
WHERE name IN (
  'read_user', 'read_portfolio', 'update_portfolio',
  'read_profiling', 'create_mentorship', 'read_mentorship', 'update_mentorship',
  'read_analytics'
);

-- Mentee
DELETE FROM roles_permissions WHERE role_id = (SELECT id FROM roles WHERE name = 'mentee');
INSERT INTO roles_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'mentee'), id FROM permissions
WHERE name IN (
  'read_user', 'update_user', 'read_portfolio', 'create_portfolio', 'update_portfolio',
  'read_profiling', 'create_profiling', 'update_profiling',
  'read_mentorship', 'read_analytics'
);

-- Student
DELETE FROM roles_permissions WHERE role_id = (SELECT id FROM roles WHERE name = 'student');
INSERT INTO roles_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'student'), id FROM permissions
WHERE name IN (
  'read_user', 'update_user', 'read_portfolio', 'create_portfolio', 'update_portfolio',
  'read_profiling', 'update_profiling', 'read_mentorship'
);

-- Employer
DELETE FROM roles_permissions WHERE role_id = (SELECT id FROM roles WHERE name = 'employer');
INSERT INTO roles_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'employer'), id FROM permissions
WHERE name IN (
  'read_user', 'list_users', 'read_portfolio', 'list_portfolios',
  'read_organization', 'list_organizations'
);

-- Finance
DELETE FROM roles_permissions WHERE role_id = (SELECT id FROM roles WHERE name = 'finance');
INSERT INTO roles_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'finance'), id FROM permissions
WHERE name IN (
  'read_billing', 'update_billing', 'manage_billing',
  'create_invoice', 'read_invoice', 'update_invoice', 'list_invoices'
);

-- Finance Admin
DELETE FROM roles_permissions WHERE role_id = (SELECT id FROM roles WHERE name = 'finance_admin');
INSERT INTO roles_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'finance_admin'), id FROM permissions
WHERE name IN (
  'read_billing', 'update_billing', 'manage_billing',
  'create_invoice', 'read_invoice', 'update_invoice', 'list_invoices', 'delete_invoice',
  'read_user'
);

-- Sponsor Admin
DELETE FROM roles_permissions WHERE role_id = (SELECT id FROM roles WHERE name = 'sponsor_admin');
INSERT INTO roles_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'sponsor_admin'), id FROM permissions
WHERE name IN (
  'read_user', 'list_users', 'read_organization', 'update_organization',
  'read_portfolio', 'list_portfolios', 'read_profiling', 'list_profiling'
);

-- Analyst
DELETE FROM roles_permissions WHERE role_id = (SELECT id FROM roles WHERE name = 'analyst');
INSERT INTO roles_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'analyst'), id FROM permissions
WHERE name IN ('read_analytics', 'list_analytics');

COMMIT;

-- Optional: verify counts
-- SELECT r.name, COUNT(rp.permission_id) AS perm_count FROM roles r LEFT JOIN roles_permissions rp ON r.id = rp.role_id GROUP BY r.id, r.name;
