-- SAFER APPROACH: Identify and fix only problematic TOTP secrets
-- This script is more conservative and only disables methods that are actually causing errors

-- Step 1: DIAGNOSTIC QUERY - Run this first to see affected users
-- This shows all users with TOTP MFA enabled
SELECT 
    u.id as user_id,
    u.email,
    u.mfa_enabled,
    u.mfa_method,
    m.id as mfa_method_id,
    m.method_type,
    m.enabled as method_enabled,
    m.is_primary,
    m.verified_at,
    m.last_used_at,
    LENGTH(m.secret_encrypted) as secret_length,
    LEFT(m.secret_encrypted, 30) as secret_preview
FROM users_user u
INNER JOIN mfa_methods m ON m.user_id = u.id
WHERE m.method_type = 'totp'
  AND m.enabled = TRUE
ORDER BY u.email;

-- Step 2: Check if users have alternative MFA methods
-- This helps determine if disabling TOTP will lock them out
SELECT 
    u.email,
    u.mfa_enabled,
    STRING_AGG(m.method_type, ', ') as available_methods,
    COUNT(m.id) as method_count
FROM users_user u
INNER JOIN mfa_methods m ON m.user_id = u.id
WHERE m.enabled = TRUE
GROUP BY u.id, u.email, u.mfa_enabled
HAVING COUNT(m.id) > 0
ORDER BY u.email;

-- ============================================================================
-- OPTION A: Disable ONLY TOTP methods (keeps other MFA methods active)
-- ============================================================================
-- Use this if you want to be conservative and only disable TOTP

-- Disable problematic TOTP methods
UPDATE mfa_methods
SET 
    enabled = FALSE,
    is_primary = FALSE
WHERE method_type = 'totp'
  AND enabled = TRUE;

-- Update users who ONLY had TOTP (no other MFA methods)
UPDATE users_user u
SET 
    mfa_enabled = FALSE,
    mfa_method = NULL
WHERE u.mfa_enabled = TRUE
  AND u.mfa_method = 'totp'
  AND NOT EXISTS (
    SELECT 1 
    FROM mfa_methods m 
    WHERE m.user_id = u.id 
      AND m.enabled = TRUE
      AND m.method_type != 'totp'
  );

-- ============================================================================
-- OPTION B: Disable specific user's TOTP (if you know which user has the issue)
-- ============================================================================
-- Replace 'user@example.com' with the actual email from the error logs

-- Disable TOTP for specific user
UPDATE mfa_methods m
SET 
    enabled = FALSE,
    is_primary = FALSE
FROM users_user u
WHERE m.user_id = u.id
  AND u.email = 'user@example.com'  -- REPLACE WITH ACTUAL EMAIL
  AND m.method_type = 'totp';

-- Disable MFA for that user if TOTP was their only method
UPDATE users_user
SET 
    mfa_enabled = FALSE,
    mfa_method = NULL
WHERE email = 'user@example.com'  -- REPLACE WITH ACTUAL EMAIL
  AND mfa_method = 'totp'
  AND NOT EXISTS (
    SELECT 1 
    FROM mfa_methods m 
    WHERE m.user_id = users_user.id 
      AND m.enabled = TRUE
  );

-- ============================================================================
-- VERIFICATION QUERIES - Run after making changes
-- ============================================================================

-- Verify TOTP methods are disabled
SELECT 
    u.email,
    m.method_type,
    m.enabled,
    m.is_primary
FROM users_user u
INNER JOIN mfa_methods m ON m.user_id = u.id
WHERE m.method_type = 'totp'
ORDER BY u.email;

-- Verify user MFA status
SELECT 
    email,
    mfa_enabled,
    mfa_method,
    account_status,
    is_active
FROM users_user
WHERE mfa_enabled = TRUE OR email IN (
    SELECT u.email 
    FROM users_user u
    INNER JOIN mfa_methods m ON m.user_id = u.id
    WHERE m.method_type = 'totp'
)
ORDER BY email;

-- Check for users who might be locked out (no active MFA methods but MFA still enabled)
SELECT 
    u.email,
    u.mfa_enabled,
    u.mfa_method,
    COUNT(m.id) as active_methods
FROM users_user u
LEFT JOIN mfa_methods m ON m.user_id = u.id AND m.enabled = TRUE
WHERE u.mfa_enabled = TRUE
GROUP BY u.id, u.email, u.mfa_enabled, u.mfa_method
HAVING COUNT(m.id) = 0
ORDER BY u.email;

-- ============================================================================
-- NOTES FOR AFFECTED USERS
-- ============================================================================
-- After running this script, affected users will need to:
-- 1. Log in with their password (MFA will be disabled)
-- 2. Go to Security Settings
-- 3. Re-enroll in TOTP MFA with a fresh QR code
-- 4. Save their new backup codes
--
-- The old corrupted TOTP secret will remain in the database (disabled)
-- for audit purposes but won't be used for authentication.
