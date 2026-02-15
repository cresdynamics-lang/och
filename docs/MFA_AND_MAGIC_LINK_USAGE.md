# MFA (TOTP, Backup Codes) and Magic Link – Implementation and Usage

## Yes – all three are implemented

- **TOTP (pyotp)** – Yes  
- **Backup codes (fallback when TOTP unavailable)** – Yes  
- **Magic link (passwordless login)** – Yes  

---

## 1. TOTP-based MFA (pyotp)

**Implemented as specified:** secret generation, QR `provisioning_uri`, verify with `valid_window=1`, encryption support.

### Backend

- **Model:** `users.auth_models.MFAMethod` – stores `secret_encrypted`, `method_type='totp'`, `enabled`, `is_primary`, etc., linked to User.
- **Enable flow:**
  - **Enroll:** `POST /api/v1/auth/mfa/enroll` with `{ "method": "totp" }`  
    - Generates secret with `pyotp.random_base32()`  
    - Encrypts and saves in `MFAMethod.secret_encrypted`  
    - Returns `qr_code_uri` (provisioning URI for Google/Microsoft Authenticator) and optional `secret`  
  - **Verify:** `POST /api/v1/auth/mfa/verify` with `{ "code": "<6-digit>", "method": "totp" }`  
    - Verifies with `pyotp.TOTP(secret).verify(code, valid_window=1)` (±30 s)  
    - On success sets `mfa_enabled=True` and returns backup codes (see below).
- **Login:** After username/password, if `mfa_enabled` and user has an enabled TOTP method, login response returns `mfa_required: true`; user completes MFA via `POST /api/v1/auth/mfa/complete` with `{ "refresh_token", "code", "method": "totp" }` (same ±30 s window).
- **Secrets:** Optional encryption via `users.utils.auth_utils` (`encrypt_totp_secret` / `decrypt_totp_secret`) using `MFA_TOTP_ENCRYPTION_KEY`.

### How to use (TOTP)

1. **From Security settings (student):**  
   - Go to **Dashboard → Settings → Security** (e.g. `http://localhost:3000/dashboard/student/settings/security`).  
   - Click **Enable MFA** (or **Manage** if already enabled).  
   - Choose **Authenticator app**, then continue: scan QR (or use the provisioning URI) in Google Authenticator / Microsoft Authenticator.  
   - Enter the 6-digit code and complete; backup codes are shown once.

2. **API only:**  
   - `POST /api/v1/auth/mfa/enroll` with `{ "method": "totp" }` (authenticated).  
   - Show user the returned `qr_code_uri` (or `secret`) and have them add to an app.  
   - `POST /api/v1/auth/mfa/verify` with `{ "code": "<6-digit>", "method": "totp" }`.  
   - On success, TOTP is enabled and backup codes are in the response.

---

## 2. Backup codes (fallback when TOTP unavailable)

**Implemented:** Generated on first TOTP verify; stored hashed; one-time use.

- **Generation:** When user verifies their first TOTP code at enrollment, `generate_totp_backup_codes(count=10)` is called in `users.utils.auth_utils`; codes are hashed and stored in `MFAMethod.totp_backup_codes`.
- **Verification:** `verify_totp_backup_code(user, code)` in `auth_utils.py` – checks hash and **removes** the code from `totp_backup_codes` after use (one-time).
- **Login:** User can pass the same `code` with `method: "backup_codes"` in `POST /api/v1/auth/mfa/complete`; backend uses `verify_totp_backup_code` when method is `backup_codes`.

### How to use (backup codes)

- **At enrollment:** After verifying the first TOTP code, the API returns `backup_codes`: a list of 10 one-time codes. User must save them; they are not shown again.
- **At login:** If the user cannot use the app, they enter one of the backup codes in the MFA step and submit with `method: "backup_codes"`. That code is consumed and cannot be reused.

---

## 3. Magic link (passwordless login)

**Implemented:** Uses the same MFA code infra with `method='magic_link'`; this is **passwordless login**, not an extra “MFA method” in settings.

- **Request:** `POST /api/v1/auth/login/magic-link` with `{ "email": "user@example.com" }`.  
  - Backend uses `create_mfa_code(user, method='magic_link', expires_minutes=10)` and sends the link via `send_magic_link_email`.
- **Verification:** User clicks the link (e.g. `{frontend}/auth/verify?code=...&email=...`).  
  - Backend verifies with `verify_mfa_code(..., method='magic_link')` (or equivalent in the magic-link view).  
  - No password is used; this is the full login.

### How to use (magic link)

- **From frontend:** Provide a “Sign in with email link” option that calls `POST /api/v1/auth/login/magic-link` with the user’s email, then redirect the user to check email and use the link.  
- **Backend:** `create_mfa_code(..., method='magic_link')` and `verify_mfa_code(..., method='magic_link')` in `users.utils.auth_utils` and related views implement the flow.

---

## Manage MFA (activated methods and add TOTP)

- **URL:** `http://localhost:3000/dashboard/student/settings/security?mfa=manage`  
- **View:** Lists **activated methods** (TOTP, SMS, Email) with masked details and “Primary” where applicable.  
- **Add another:** Buttons to **Add authenticator app (TOTP)**, **Add SMS**, or **Add email** only for methods you don’t already have. Adding TOTP runs the same enroll + verify flow (QR/code then 6-digit verify); backup codes are issued on first TOTP verify as above.

---

## Summary

| Feature            | Status   | Where / how |
|--------------------|----------|-------------|
| TOTP (pyotp)       | Yes      | `MFAMethod`, enroll/verify views, `valid_window=1`, optional encryption |
| Backup codes       | Yes      | Generated on TOTP verify; `verify_totp_backup_code`; one-time use |
| Magic link         | Yes      | `create_mfa_code(..., method='magic_link')`, `verify_mfa_code(..., method='magic_link')`; passwordless login |
| Manage MFA + add TOTP | Yes   | Security → Manage → “Add authenticator app” (and SMS/Email) |
