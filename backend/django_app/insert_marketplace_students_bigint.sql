-- Insert students into users (bigint id + uuid_id) and make them visible in sponsor marketplace.
--
-- For DB where: users.id is BIGINT, users.uuid_id exists (UUID).
-- FKs: consent_scopes.user_id -> users.id, marketplace_profiles.mentee_id -> users.id (both bigint).
--
-- If your users table does NOT have uuid_id, remove "uuid_id," from the INSERT column list
-- and remove the first value (gen_random_uuid()) from each row in VALUES.
--
-- After running this script, set passwords so students can log in:
--   python manage.py set_marketplace_passwords
-- Or manually:
--   python manage.py shell -c "
--   from django.contrib.auth import get_user_model
--   User = get_user_model()
--   for u in User.objects.filter(email__in=['wilson.kinyanjui@test.com','makek.muwa@test.com','cynthia.wanjiku@test.com','james.omondi@test.com','grace.muthoni@test.com']):
--       u.set_password('testpass123'); u.save()
--   "

-- 1) Insert 5 student users with real names (id = bigint default, uuid_id = gen_random_uuid(), password = unusable)
INSERT INTO users (
    uuid_id,
    username,
    email,
    password,
    first_name,
    last_name,
    is_staff,
    is_active,
    is_superuser,
    date_joined,
    account_status,
    email_verified,
    email_verified_at,
    timezone,
    language,
    risk_level,
    mfa_enabled,
    profile_complete,
    onboarding_complete,
    profiling_complete,
    is_mentor,
    mentor_capacity_weekly,
    mentor_availability,
    mentor_specialties,
    career_goals,
    preferred_learning_style,
    cyber_exposure_level,
    track_key,
    country,
    metadata,
    created_at,
    updated_at
)
SELECT * FROM (VALUES
  (gen_random_uuid(), 'wilson.kinyanjui@test.com', 'wilson.kinyanjui@test.com', '!', 'Wilson', 'Kinyanjui', false, true, false, NOW(), 'active', true, NOW(), 'UTC', 'en', 'low', false, true, true, true, false, 10, '{}'::jsonb, '[]'::jsonb, 'SOC Analyst role in cybersecurity', 'mixed', 'intermediate', 'cyber_defense', 'KE', '{}'::jsonb, NOW(), NOW()),
  (gen_random_uuid(), 'makek.muwa@test.com', 'makek.muwa@test.com', '!', 'Makek', 'Muwa', false, true, false, NOW(), 'active', true, NOW(), 'UTC', 'en', 'low', false, true, true, true, false, 10, '{}'::jsonb, '[]'::jsonb, 'Security analyst and threat hunting', 'visual', 'beginner', 'cyber_defense', 'KE', '{}'::jsonb, NOW(), NOW()),
  (gen_random_uuid(), 'cynthia.wanjiku@test.com', 'cynthia.wanjiku@test.com', '!', 'Cynthia', 'Wanjiku', false, true, false, NOW(), 'active', true, NOW(), 'UTC', 'en', 'low', false, true, true, true, false, 10, '{}'::jsonb, '[]'::jsonb, 'Cybersecurity trainee', 'auditory', 'none', 'cyber_defense', 'KE', '{}'::jsonb, NOW(), NOW()),
  (gen_random_uuid(), 'james.omondi@test.com', 'james.omondi@test.com', '!', 'James', 'Omondi', false, true, false, NOW(), 'active', true, NOW(), 'UTC', 'en', 'low', false, true, true, true, false, 10, '{}'::jsonb, '[]'::jsonb, 'Incident response and DFIR', 'kinesthetic', 'advanced', 'cyber_defense', 'KE', '{}'::jsonb, NOW(), NOW()),
  (gen_random_uuid(), 'grace.muthoni@test.com', 'grace.muthoni@test.com', '!', 'Grace', 'Muthoni', false, true, false, NOW(), 'active', true, NOW(), 'UTC', 'en', 'low', false, true, true, true, false, 10, '{}'::jsonb, '[]'::jsonb, 'Junior SOC analyst', 'reading', 'beginner', 'cyber_defense', 'KE', '{}'::jsonb, NOW(), NOW())
) AS v(uuid_id, username, email, password, first_name, last_name, is_staff, is_active, is_superuser, date_joined, account_status, email_verified, email_verified_at, timezone, language, risk_level, mfa_enabled, profile_complete, onboarding_complete, profiling_complete, is_mentor, mentor_capacity_weekly, mentor_availability, mentor_specialties, career_goals, preferred_learning_style, cyber_exposure_level, track_key, country, metadata, created_at, updated_at)
ON CONFLICT (email) DO NOTHING;

-- 2) Assign student role (user_roles) so they are treated as students
INSERT INTO user_roles (user_id, role_id, scope, is_active, assigned_at)
SELECT u.id, r.id, 'global', true, NOW()
FROM users u
JOIN roles r ON r.name = 'student'
WHERE u.email IN ('wilson.kinyanjui@test.com','makek.muwa@test.com','cynthia.wanjiku@test.com','james.omondi@test.com','grace.muthoni@test.com')
  AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

-- 3) Grant employer_share consent (user_id = users.id bigint)
INSERT INTO consent_scopes (user_id, scope_type, granted, granted_at, created_at, updated_at)
SELECT u.id, 'employer_share', true, NOW(), NOW(), NOW()
FROM users u
WHERE u.email IN ('wilson.kinyanjui@test.com','makek.muwa@test.com','cynthia.wanjiku@test.com','james.omondi@test.com','grace.muthoni@test.com')
  AND NOT EXISTS (SELECT 1 FROM consent_scopes c WHERE c.user_id = u.id AND c.scope_type = 'employer_share')
ON CONFLICT (user_id, scope_type) DO UPDATE SET
  granted = true,
  granted_at = NOW(),
  updated_at = NOW();

-- 4) Insert marketplace_profiles (mentee_id = users.id bigint) with varied talent data
INSERT INTO marketplace_profiles (
  id,
  mentee_id,
  tier,
  readiness_score,
  job_fit_score,
  profile_status,
  primary_role,
  primary_track_key,
  skills,
  portfolio_depth,
  is_visible,
  employer_share_consent,
  last_updated_at,
  created_at
)
SELECT
  gen_random_uuid(),
  u.id::text,
  p.tier,
  p.readiness_score,
  p.readiness_score - 2,
  p.profile_status,
  p.primary_role,
  'cyber_defense',
  p.skills::jsonb,
  'moderate',
  true,
  true,
  NOW(),
  NOW()
FROM users u
CROSS JOIN (
  VALUES
    ('wilson.kinyanjui@test.com', 'professional', 88.00, 'job_ready', 'SOC Analyst', '["Python","SIEM","Incident Response"]'),
    ('makek.muwa@test.com', 'professional', 75.50, 'emerging_talent', 'Security Analyst', '["Linux","Networking","Threat Hunting"]'),
    ('cynthia.wanjiku@test.com', 'starter', 72.00, 'foundation_mode', 'Cybersecurity Trainee', '["Python","Basics"]'),
    ('james.omondi@test.com', 'professional', 92.00, 'job_ready', 'Incident Responder', '["DFIR","Malware Analysis","SOAR"]'),
    ('grace.muthoni@test.com', 'starter', 68.00, 'foundation_mode', 'Junior Analyst', '["SIEM","Log Analysis"]')
) AS p(email, tier, readiness_score, profile_status, primary_role, skills)
WHERE u.email = p.email
  AND NOT EXISTS (SELECT 1 FROM marketplace_profiles mp WHERE mp.mentee_id = u.id::text)
ON CONFLICT (mentee_id) DO UPDATE SET
  tier = EXCLUDED.tier,
  readiness_score = EXCLUDED.readiness_score,
  job_fit_score = EXCLUDED.job_fit_score,
  profile_status = EXCLUDED.profile_status,
  primary_role = EXCLUDED.primary_role,
  skills = EXCLUDED.skills,
  is_visible = true,
  employer_share_consent = true,
  last_updated_at = NOW();
