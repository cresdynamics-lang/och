# How Data Gets Into the Sponsor Marketplace (Without SQL)

Talent appears in the **sponsor marketplace** when:

1. A **MarketplaceProfile** exists for the user.
2. **is_visible** = true.
3. **employer_share_consent** = true.
4. **tier** is `starter` or `professional` (not `free`).

All of this is driven by the **Student (mentee)** role. No SQL needed if students use the app as below.

---

## Role: **Student (mentee)**

Students must do three things (in any order that makes sense):

1. Have a **starter or professional** subscription (tier).
2. Grant **Employer Share** consent in settings.
3. Open the **Student Marketplace** and turn **“Visible to employers”** on.

Optionally, **readiness_score / primary_role / skills** can be filled by a TalentScope/profiler sync or by admin (see end).

---

## 1. MarketplaceProfile is created

**When:** A student loads their marketplace profile (e.g. opens the student marketplace page).

**Backend**

- **File:** `backend/django_app/marketplace/views.py`
- **Class:** `MarketplaceProfileMeView`
- **Endpoint:** `GET /api/v1/marketplace/profile/me`

**What happens**

- If the user has no `MarketplaceProfile`, one is **created** (lines 171–198).
- **tier** comes from `get_user_tier(user.id)` (subscription).
- **employer_share_consent** comes from `check_consent(user, 'employer_share')`.
- **is_visible** is set to `False` for new profiles.

So the **first time a student hits “my marketplace profile”**, the profile row is created and tier/consent are set from subscription and consent DB.

**Frontend (student)**

- **File:** `frontend/nextjs_app/app/dashboard/student/marketplace/page.tsx`
- **Service:** `marketplaceClient.getMyProfile()` in `frontend/nextjs_app/services/marketplaceClient.ts` → GET `/marketplace/profile/me`

---

## 2. Tier (starter / professional) is set and updated

**Source:** Subscription.

**Backend**

- **File:** `backend/django_app/marketplace/views.py`  
  - On **GET** `/marketplace/profile/me`, tier is synced from `get_user_tier(user.id)` into the existing profile.
- **File:** `backend/django_app/subscriptions/views.py`  
  - When a subscription is upgraded (e.g. mock or Stripe), the code updates `user.marketplace_profile.tier` and saves (lines 147–165).

So tier flows from **subscription** → **marketplace profile** in those two places; no SQL needed.

---

## 3. Employer Share consent is set

**When:** Student turns on “Employer Share” in settings.

**Backend**

- **File:** `backend/django_app/users/views/auth_views.py`  
  - **Endpoint:** `POST /api/v1/auth/consents`  
  - Body: `{ "scope_type": "employer_share", "granted": true }`  
  - Uses `grant_consent(request.user, scope_type)` (e.g. around line 1066).
- **File:** `backend/django_app/users/utils/consent_utils.py`  
  - `grant_consent(user, 'employer_share')` creates/updates the row in **consent_scopes** (e.g. `scope_type='employer_share'`, `granted=True`).

**Frontend (student)**

- **File:** `frontend/nextjs_app/app/dashboard/student/settings/profile/page.tsx`  
  - Consent toggles; “Employer Share” uses `scope_type: 'employer_share'` (e.g. around line 820).
- **File:** `frontend/nextjs_app/components/ui/settings/OCHSettingsDashboard.tsx`  
  - Uses consent options that include **Employer Share** (e.g. id `employer_share`).
- **File:** `frontend/nextjs_app/components/ui/settings/sections/OCHSettingsPrivacy.tsx`  
  - Consent options include `id: 'employer_share'` (e.g. around line 152).

So consent is stored in **consent_scopes** via the auth/consents API when the student toggles it in settings.

---

## 4. Visibility (is_visible) is set

**When:** Student turns on “Visible to employers” on the **student marketplace** page.

**Backend**

- **File:** `backend/django_app/marketplace/views.py`
- **Class:** `MarketplaceProfileMeView`
- **Endpoint:** `PATCH /api/v1/marketplace/profile/me`  
  - Body: `{ "is_visible": true }`  
  - Updates `profile.is_visible` and syncs `employer_share_consent` from consent (lines 203–261).

**Frontend (student)**

- **File:** `frontend/nextjs_app/app/dashboard/student/marketplace/page.tsx`  
  - Toggle “Visible to employers” (e.g. around 476–490).  
  - Calls `marketplaceClient.updateProfileVisibility(true)` → PATCH `/marketplace/profile/me` with `is_visible: true`.

So **is_visible** is set only in code via this PATCH; no SQL needed.

---

## 5. Sync of consent into MarketplaceProfile

**Where:** Same endpoints as above.

- **GET** `/marketplace/profile/me`: syncs `employer_share_consent` from `check_consent(user, 'employer_share')` into the profile (marketplace/views.py).
- **PATCH** `/marketplace/profile/me`: before changing `is_visible`, syncs `employer_share_consent` from consent again.

So the **consent_scopes** table is the source of truth; **marketplace_profiles.employer_share_consent** is a cached copy kept in sync by these two endpoints.

---

## Summary: “Where in code” and which role

| What                | Role    | Where in code (backend)                          | Where in code (frontend – student)                    |
|---------------------|--------|---------------------------------------------------|-------------------------------------------------------|
| Create profile      | Student | `marketplace/views.py` → GET `/marketplace/profile/me` | `app/dashboard/student/marketplace/page.tsx` → `getMyProfile()` |
| Tier                | Subscription | `marketplace/views.py` (GET profile/me), `subscriptions/views.py` (on upgrade) | N/A (subscription flow)                              |
| Employer consent    | Student | `users/views/auth_views.py` → POST `/auth/consents`; `users/utils/consent_utils.py` → `grant_consent` | `app/dashboard/student/settings/profile/page.tsx`, `OCHSettingsPrivacy.tsx`, `OCHSettingsDashboard.tsx` |
| Visible to employers| Student | `marketplace/views.py` → PATCH `/marketplace/profile/me` | `app/dashboard/student/marketplace/page.tsx` → `updateProfileVisibility(true)` |

So: **all “data that goes into the marketplace” in the normal flow is driven by the student** (and subscription): create profile by opening student marketplace, grant consent in settings, turn visibility on in student marketplace. No SQL required for that.

---

## Optional: readiness_score, primary_role, skills

These fields are **not** set by the marketplace profile GET/PATCH above. The model describes them as denormalized from TalentScope. In the codebase:

- They can be set via **Django admin** or **admin API** `PATCH /api/v1/admin/marketplace/profiles/<id>/` (`marketplace/admin_views.py`).
- A **TalentScope/profiler sync** (or similar job) could be added to push readiness_score, primary_role, skills from the profiler into `MarketplaceProfile` so sponsors see them without manual SQL or admin.

Until that sync exists, filling readiness/role/skills “without SQL” means using the admin UI or the admin API above.
