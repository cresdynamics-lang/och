-- =============================================================================
-- Add subscription management permissions and assign to program_director role
-- Run: psql $DATABASE_URL -f backend/django_app/sql/add_subscription_permissions_for_directors.sql
-- Or from Django: python manage.py dbshell < backend/django_app/sql/add_subscription_permissions_for_directors.sql
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Add 'subscription' to RESOURCE_TYPES if not already in Permission model
-- Note: This assumes the Permission model allows any resource_type value
-- If your model has strict choices, you may need to update the model first
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- 2. Insert subscription permissions
-- -----------------------------------------------------------------------------
INSERT INTO permissions (name, resource_type, action, description, created_at)
VALUES
  ('create_subscription', 'subscription', 'create', 'Create user subscriptions', NOW()),
  ('read_subscription', 'subscription', 'read', 'Read subscription details', NOW()),
  ('update_subscription', 'subscription', 'update', 'Update user subscriptions', NOW()),
  ('delete_subscription', 'subscription', 'delete', 'Delete user subscriptions', NOW()),
  ('list_subscriptions', 'subscription', 'list', 'List user subscriptions', NOW()),
  ('manage_subscriptions', 'subscription', 'manage', 'Manage all subscriptions', NOW())
ON CONFLICT (name) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. Assign subscription permissions to program_director role
-- -----------------------------------------------------------------------------
INSERT INTO roles_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'program_director'),
  id 
FROM permissions 
WHERE name IN (
  'create_subscription',
  'read_subscription',
  'update_subscription',
  'list_subscriptions',
  'manage_subscriptions'
)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. Also ensure program_director has read_billing permission for context
-- -----------------------------------------------------------------------------
INSERT INTO roles_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'program_director'),
  id 
FROM permissions 
WHERE name = 'read_billing'
ON CONFLICT DO NOTHING;

COMMIT;

-- Verify the changes
-- SELECT r.name AS role_name, p.name AS permission_name, p.resource_type, p.action
-- FROM roles r
-- JOIN roles_permissions rp ON r.id = rp.role_id
-- JOIN permissions p ON rp.permission_id = p.id
-- WHERE r.name = 'program_director' AND p.resource_type = 'subscription'
-- ORDER BY p.action;
