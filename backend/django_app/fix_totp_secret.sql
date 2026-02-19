-- Fix TOTP Secret Issue - Disable MFA methods with invalid base32 secrets

-- Step 1: DIAGNOSTIC - See affected users
SELECT 
    u.id, u.email, u.mfa_enabled, u.mfa_method,
    m.id as mfa_method_id, m.enabled, m.is_primary,
    LENGTH(m.secret_encrypted) as secret_length
FROM users u
INNER JOIN mfa_methods m ON m.user_id = u.id
WHERE m.method_type = 'totp' AND m.enabled = TRUE;

-- Step 2: Disable TOTP methods
UPDATE mfa_methods
SET enabled = FALSE, is_primary = FALSE
WHERE method_type = 'totp' AND enabled = TRUE;

-- Step 3: Disable MFA for users who only had TOTP
UPDATE users
SET mfa_enabled = FALSE, mfa_method = NULL
WHERE mfa_enabled = TRUE
  AND mfa_method = 'totp'
  AND NOT EXISTS (
    SELECT 1 FROM mfa_methods m 
    WHERE m.user_id = users.id AND m.enabled = TRUE
  );

-- Step 4: Verify
SELECT u.email, u.mfa_enabled, u.mfa_method, m.method_type, m.enabled
FROM users u
LEFT JOIN mfa_methods m ON m.user_id = u.id
WHERE u.email IN (SELECT email FROM users WHERE mfa_enabled = TRUE)
   OR m.method_type = 'totp'
ORDER BY u.email;
