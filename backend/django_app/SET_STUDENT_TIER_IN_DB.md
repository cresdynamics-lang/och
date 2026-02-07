# Where to Change Student Tier in the DB

There are **two** places “tier” is stored. Use the one that matches what you need.

---

## 1. Subscription tier (entitlements: curriculum, missions, etc.)

**Used by:** `get_user_tier(user_id)` in `subscriptions/utils.py` — drives access to curriculum, missions, marketplace visibility sync, etc.

**Tables:**

| Table                 | Role |
|-----------------------|------|
| `subscription_plans`  | Defines plans (name, tier, price). |
| `user_subscriptions` | Links a user to a plan; one active row per user. |

**Important:** The app treats **plan name** as the tier (e.g. `starter`, `professional_7`). So you change tier by giving the user an active subscription to the right **plan**.

**Set tier for a student:**

1. Get the plan id for the tier you want:

```sql
-- List plans (name is what get_user_tier returns)
SELECT id, name, tier FROM subscription_plans;
```

2. Give the user an active subscription to that plan:

```sql
-- Replace USER_ID with the student's user id (type must match users.id: varchar or bigint).
-- Replace PLAN_ID with the UUID from subscription_plans for the desired plan (e.g. starter / professional).

INSERT INTO user_subscriptions (id, user_id, plan_id, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'USER_ID', 'PLAN_ID', 'active', NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET plan_id = EXCLUDED.plan_id, status = 'active', updated_at = NOW();
```

If `user_subscriptions` has a unique constraint on `user_id`, the `ON CONFLICT` updates the existing row. If your schema uses a different unique key, adjust the conflict target or use a plain `UPDATE` after checking existence.

**Example (starter):**

```sql
-- Get plan id for starter
SELECT id FROM subscription_plans WHERE name = 'starter' LIMIT 1;

-- Then (replace USER_ID and PLAN_ID)
INSERT INTO user_subscriptions (id, user_id, plan_id, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'USER_ID', 'PLAN_ID', 'active', NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET plan_id = EXCLUDED.plan_id, status = 'active', updated_at = NOW();
```

---

## 2. Marketplace profile tier (sponsor marketplace visibility)

**Used by:** Sponsor marketplace talent list. Only rows with `tier` in `('starter', 'professional')` and `is_visible = true` are shown.

**Table:** `marketplace_profiles`  
**Column:** `tier` (VARCHAR) — allowed: `'free'`, `'starter'`, `'professional'`  
**Link to user:** `mentee_id` (same type as `users.id` — varchar or bigint)

**Set tier in DB:**

```sql
-- By user email (if mentee_id is varchar and stores user id)
UPDATE marketplace_profiles mp
SET tier = 'professional', last_updated_at = NOW()
FROM users u
WHERE mp.mentee_id = u.id::text AND u.email = 'student@example.com';

-- Or by user id directly (if mentee_id matches users.id type)
UPDATE marketplace_profiles SET tier = 'professional', last_updated_at = NOW()
WHERE mentee_id = 'USER_ID';   -- or mentee_id = 123 if bigint
```

**Note:** When the student next hits **GET /api/v1/marketplace/profile/me**, the app will overwrite `marketplace_profiles.tier` from `get_user_tier(user.id)`. So for a lasting “subscription” tier, set the **subscription** (section 1). Use this section 2 for a one-off or for testing visibility without changing subscription.

---

## Summary

| Goal                         | Where to change |
|-----------------------------|------------------|
| Change subscription tier    | `user_subscriptions.plan_id` → id of desired plan in `subscription_plans` (and `status = 'active'`). |
| Change marketplace tier only | `marketplace_profiles.tier` for that user’s row (`mentee_id` = user id). |

**Code references:**

- Tier read for entitlements: `subscriptions/utils.py` → `get_user_tier(user_id)` (uses `user_subscriptions` + `subscription_plans`).
- Tier read for marketplace: `marketplace/views.py` (filters on `marketplace_profiles.tier`, synced from `get_user_tier` on GET profile/me).
