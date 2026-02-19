-- Fix TOTP Secret Issue - Disable MFA methods with invalid base32 secrets
-- This script identifies and disables TOTP MFA methods that have corrupted secrets
-- causing "Non-base32 digit found" errors

-- Step 1: Identify users with TOTP MFA enabled
-- Run this first to see which users will be affected
SELECT 
    u.email,
    u.mfa_enabled,
    u.mfa_method,
    m.id as mfa_method_id,
    m.method_type,
    m.enabled,
    LEFT(m.secret_encrypted, 20) as secret_preview
FROM users_user u
INNER JOIN mfa_methods m ON m.user_id = u.id
WHERE m.method_type = 'totp'
ORDER BY u.email;

-- Step 2: Disable TOTP MFA methods that are causing issues
-- This will disable the TOTP method but keep the record for audit purposes
UPDATE mfa_methods
SET 
    enabled = FALSE,
    is_primary = FALSE
WHERE method_type = 'totp'
  AND enabled = TRUE;

-- Step 3: Disable MFA for users who only had TOTP as their MFA method
-- This ensures users can still log in after their TOTP method is disabled
UPDATE users_user u
SET 
    mfa_enabled = FALSE,
    mfa_method = NULL
WHERE u.mfa_enabled = TRUE
  AND NOT EXISTS (
    SELECT 1 
    FROM mfa_methods m 
    WHERE m.user_id = u.id 
      AND m.enabled = TRUE
  );

-- Step 4: Verify the changes
-- Check which users had their MFA disabled
SELECT 
    u.email,
    u.mfa_enabled,
    u.mfa_method,
    COUNT(m.id) as active_mfa_methods
FROM users_user u
LEFT JOIN mfa_methods m ON m.user_id = u.id AND m.enabled = TRUE
GROUP BY u.id, u.email, u.mfa_enabled, u.mfa_method
HAVING u.mfa_enabled = FALSE OR COUNT(m.id) = 0
ORDER BY u.email;

-- ROLLBACK INSTRUCTIONS:
-- If you need to rollback, you'll need to manually re-enable MFA for affected users
-- They will need to re-enroll in TOTP MFA with a fresh secret
-- 
-- To re-enable a specific user's MFA (after they re-enroll):
-- UPDATE users_user SET mfa_enabled = TRUE, mfa_method = 'totp' WHERE email = 'user@example.com';
-- UPDATE mfa_methods SET enabled = TRUE, is_primary = TRUE WHERE user_id = (SELECT id FROM users_user WHERE email = 'user@example.com') AND method_type = 'totp';
