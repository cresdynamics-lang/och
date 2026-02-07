-- Insert talent into sponsor marketplace (so students appear in Talent pool / Browse talent)
--
-- Prerequisites:
-- 1. users.id must be VARCHAR(36) (UUID string). If your users table uses bigint id, run the
--    user-id migration first or use the Django management command instead.
-- 2. You need existing student users in "users". If you have none, create them via Django admin
--    or run: python manage.py create_marketplace_test_students
--
-- This script:
-- - Grants "employer_share" consent to up to 5 users who don't yet have a marketplace profile.
-- - Inserts marketplace_profiles for those users with is_visible=true and tier starter/professional,
--   so they show in the sponsor marketplace talent pool.

-- 1) Grant employer_share consent to users that will get marketplace profiles
INSERT INTO consent_scopes (user_id, scope_type, granted, granted_at, created_at, updated_at)
SELECT u.id, 'employer_share', true, NOW(), NOW(), NOW()
FROM (
  SELECT id FROM users
  WHERE id NOT IN (SELECT mentee_id FROM marketplace_profiles)
    AND is_staff = false
    AND is_superuser = false
  LIMIT 5
) u
ON CONFLICT (user_id, scope_type) DO UPDATE SET
  granted = true,
  granted_at = NOW(),
  updated_at = NOW();

-- 2) Insert marketplace profiles (same set of users, varied readiness/roles)
WITH picked AS (
  SELECT id AS user_id, row_number() OVER () AS rn
  FROM (
    SELECT id FROM users
    WHERE id NOT IN (SELECT mentee_id FROM marketplace_profiles)
      AND is_staff = false
      AND is_superuser = false
    LIMIT 5
  ) t
),
params AS (
  SELECT 1 AS rn, 'professional'::varchar(32) AS tier, 88.0 AS readiness_score, 'job_ready'::varchar(32) AS profile_status, 'SOC Analyst' AS primary_role, '["Python","SIEM","Incident Response"]'::jsonb AS skills
  UNION ALL SELECT 2, 'professional', 75.5, 'emerging_talent', 'Security Analyst', '["Linux","Networking","Threat Hunting"]'::jsonb
  UNION ALL SELECT 3, 'starter', 72.0, 'foundation_mode', 'Cybersecurity Trainee', '["Python","Basics"]'::jsonb
  UNION ALL SELECT 4, 'professional', 92.0, 'job_ready', 'Incident Responder', '["DFIR","Malware Analysis","SOAR"]'::jsonb
  UNION ALL SELECT 5, 'starter', 68.0, 'foundation_mode', 'Junior Analyst', '["SIEM","Log Analysis"]'::jsonb
)
INSERT INTO marketplace_profiles (
  id, mentee_id, tier, readiness_score, job_fit_score, profile_status,
  primary_role, primary_track_key, skills, portfolio_depth,
  is_visible, employer_share_consent, last_updated_at, created_at
)
SELECT
  gen_random_uuid(),
  p.user_id,
  COALESCE(pr.tier, 'professional'),
  pr.readiness_score,
  pr.readiness_score - 2,
  COALESCE(pr.profile_status, 'job_ready'),
  COALESCE(pr.primary_role, 'Security Analyst'),
  'cyber_defense',
  COALESCE(pr.skills, '[]'::jsonb),
  'moderate',
  true,
  true,
  NOW(),
  NOW()
FROM picked p
LEFT JOIN params pr ON pr.rn = p.rn;
