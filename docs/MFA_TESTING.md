# MFA Testing Guide

How to verify that Multi-Factor Authentication (TOTP, SMS, Email, backup codes) and the login MFA challenge work correctly.

## Prerequisites

- **Backend**: Django running (e.g. `python manage.py runserver` or Docker).
- **Frontend**: Next.js running (e.g. `npm run dev`).
- **Test user**: Create one if needed:  
  `python manage.py create_test_users`  
  (uses e.g. `student@test.com` / `testpass123`, `finance@test.com` / `testpass123`).

**Note:** In `DEBUG`, users with email ending in `@test.com` get their **device auto-trusted** on first login, so they **won’t** see the MFA step on that same browser. To test the MFA challenge you can:
- Use a **different browser or incognito** (different device fingerprint), or
- Use a **non-@test.com** user (e.g. create one in Django admin).

---

## 1. Test TOTP (authenticator app) end-to-end

### 1.1 Enroll in TOTP

**Option A – Frontend (if you have an MFA settings page)**  
Log in → go to profile/settings → enable MFA → choose “Authenticator app” → scan QR with an app (Google Authenticator, Authy, etc.) → enter the 6-digit code to confirm.

**Option B – API**

1. Log in to get an access token:
   ```bash
   curl -s -X POST http://localhost:8000/api/v1/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"email":"student@test.com","password":"testpass123"}' | jq .
   ```
   Save `access_token` from the response.

2. Enroll TOTP:
   ```bash
   curl -s -X POST http://localhost:8000/api/v1/auth/mfa/enroll/ \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -d '{"method":"totp"}' | jq .
   ```
   You get `secret` and `qr_code_uri`. Add the secret to your authenticator app (or scan the QR if you generate it from `qr_code_uri`).

3. Verify enrollment (use the current 6-digit code from the app):
   ```bash
   curl -s -X POST http://localhost:8000/api/v1/auth/mfa/verify/ \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -d '{"method":"totp","code":"123456"}' | jq .
   ```
   Replace `123456` with the real code. On success you should see e.g. `"MFA enabled successfully"` and optionally `backup_codes`.

### 1.2 Trigger MFA at login

- **Browser:** Use another browser or incognito (so the device is not trusted). Log in with the same user → you should get the **“Verify your identity”** step. Enter the TOTP code (and choose “Authenticator app” if there’s a toggle). Submit → you should be logged in and redirected.
- **API:** Call login with a **different** `device_fingerprint` so the backend doesn’t treat the device as trusted:
  ```bash
  curl -s -X POST http://localhost:8000/api/v1/auth/login/ \
    -H "Content-Type: application/json" \
    -d '{"email":"student@test.com","password":"testpass123","device_fingerprint":"another-device-123"}'
  ```
  If MFA is required you should see `mfa_required: true`, `refresh_token`, and `mfa_method: "totp"`.

### 1.3 Complete MFA and get tokens

Use the `refresh_token` from the login response and the current TOTP code:

```bash
curl -s -X POST http://localhost:8000/api/v1/auth/mfa/complete/ \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"REFRESH_TOKEN_FROM_LOGIN","code":"123456","method":"totp"}' | jq .
```

You should get `access_token`, `refresh_token`, and `user`. Use `access_token` for authenticated requests.

### 1.4 Test backup code (optional)

When you verified TOTP enrollment, the response may have included `backup_codes`. Use one of those as the code and `"method":"backup_codes"` in the same `/auth/mfa/complete/` request. That backup code should work once and then be consumed.

---

## 2. Test SMS MFA (Textbelt)

1. Set in `.env`:
   - `SMS_PROVIDER=textbelt`
   - `TEXTSMS_API_KEY=your-textbelt-key` (get a key from https://textbelt.com)

2. Enroll SMS (authenticated):
   ```bash
   curl -s -X POST http://localhost:8000/api/v1/auth/mfa/enroll/ \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"method":"sms","phone_number":"+1234567890"}' | jq .
   ```
   Use a real number for Textbelt. You should get a 6-digit code by SMS.

3. Verify enrollment:
   ```bash
   curl -s -X POST http://localhost:8000/api/v1/auth/mfa/verify/ \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"method":"sms","code":"CODE_FROM_SMS"}' | jq .
   ```

4. Log in from a “new” device (e.g. different `device_fingerprint` or incognito). You should get `mfa_required` and `mfa_method: "sms"`.

5. Send a new SMS code:
   ```bash
   curl -s -X POST http://localhost:8000/api/v1/auth/mfa/send-challenge/ \
     -H "Content-Type: application/json" \
     -d '{"refresh_token":"REFRESH_TOKEN_FROM_LOGIN"}' | jq .
   ```

6. Complete MFA with the code you received:
   ```bash
   curl -s -X POST http://localhost:8000/api/v1/auth/mfa/complete/ \
     -H "Content-Type: application/json" \
     -d '{"refresh_token":"REFRESH_TOKEN","code":"123456","method":"sms"}' | jq .
   ```

---

## 3. Test Email MFA

Uses your existing email configuration (e.g. MAIL_* / RESEND_*).

1. Enroll email (authenticated):
   ```bash
   curl -s -X POST http://localhost:8000/api/v1/auth/mfa/enroll/ \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"method":"email"}' | jq .
   ```
   Check the user’s inbox for the 6-digit code.

2. Verify enrollment:
   ```bash
   curl -s -X POST http://localhost:8000/api/v1/auth/mfa/verify/ \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"method":"email","code":"CODE_FROM_EMAIL"}' | jq .
   ```

3. Log in from a new device → `mfa_required` with `mfa_method: "email"`.

4. Send challenge: `POST /api/v1/auth/mfa/send-challenge/` with `refresh_token`.

5. Complete MFA: `POST /api/v1/auth/mfa/complete/` with `refresh_token`, `code`, `method: "email"`.

---

## 4. Test token refresh when MFA not completed

1. Log in with a user that has MFA enabled; use a new device so the response is `mfa_required` and you get a `refresh_token`.
2. Call token refresh with that refresh token:
   ```bash
   curl -s -X POST http://localhost:8000/api/v1/auth/token/refresh/ \
     -H "Content-Type: application/json" \
     -d '{"refresh_token":"REFRESH_TOKEN"}' | jq .
   ```
   You should get **403** with `"mfa_required": true` until you complete MFA via `/auth/mfa/complete/`.

---

## 5. Run automated tests

From the Django app root:

```bash
cd backend/django_app
pytest tests/test_mfa_endpoints.py -v
```

If tests fail due to model field names, the MFAMethod model uses `method_type` and `enabled` (not `method` or `is_active`).

---

## Quick checklist

| Scenario | What to do | Expected |
|----------|------------|----------|
| TOTP enroll | POST `/auth/mfa/enroll` with `method: totp` (authenticated) | 201, `secret`, `qr_code_uri` |
| TOTP verify (enrollment) | POST `/auth/mfa/verify` with TOTP code | 200, MFA enabled, optional `backup_codes` |
| Login with MFA | Login with new device / fingerprint | 200, `mfa_required`, `refresh_token`, `mfa_method` |
| Complete MFA | POST `/auth/mfa/complete` with code | 200, `access_token`, `refresh_token`, `user` |
| Refresh before MFA | POST `/auth/token/refresh` with session not MFA’d | 403, `mfa_required` |
| SMS enroll + verify | Enroll SMS, then verify with code from SMS | 201 then 200 |
| Email enroll + verify | Enroll email, then verify with code from email | 201 then 200 |
| Send challenge | POST `/auth/mfa/send-challenge` with `refresh_token` (SMS/email user) | 200, code sent |

Using a **non-@test.com** user or a **different browser/incognito** is the most reliable way to see the full MFA challenge flow in DEBUG.
