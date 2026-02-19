# Student Onboarding Flow - Implementation Guide

## Overview
Two distinct onboarding flows for students joining OCH:
1. **Email Link Onboarding** (invited students)
2. **Signup Page Onboarding** (self-signup students)

## Flow 1: Email Link Onboarding (Invited Students)

### Steps:
1. **Setup Password** → `POST /api/v1/auth/setup-password`
   - User clicks onboarding link with magic code
   - Sets password
   - Backend automatically:
     - Verifies email
     - Activates account
     - Sets status to 'active'

2. **Login** → `POST /api/v1/auth/login`
   - User logs in with email + password
   - Receives access_token and refresh_token

3. **Setup MFA** → `POST /api/v1/auth/mfa/enroll` + `POST /api/v1/auth/mfa/verify`
   - If no MFA: Enroll in MFA (email, SMS, or TOTP)
   - If has MFA: Verify with existing MFA method

4. **AI Profiling** → FastAPI `/api/v1/profiling/*`
   - Complete AI profiling assessment
   - Mark complete: `POST /api/v1/auth/onboarding/complete-step` with `step: 'ai_profiling'`

### Checking if Already Onboarded:
```
GET /api/v1/auth/onboarding/status?email=xxx&code=xxx
```
Response if already onboarded:
```json
{
  "onboarding_complete": true,
  "message": "You are already onboarded to OCH. Welcome back!",
  "redirect_url": "/dashboard"
}
```

---

## Flow 2: Signup Page Onboarding (Self-Signup)

### Steps:
1. **Signup** → `POST /api/v1/auth/signup`
   - User enters details (name, email, password)
   - Account created with status 'pending_verification'

2. **Login** → `POST /api/v1/auth/login`
   - User logs in immediately after signup
   - Receives tokens

3. **Verify Email** → `POST /api/v1/auth/verify-email`
   - OTP sent to email
   - User enters code
   - Backend automatically:
     - Verifies email
     - Activates account
     - Sets status to 'active'

4. **Setup MFA** → `POST /api/v1/auth/mfa/enroll` + `POST /api/v1/auth/mfa/verify`
   - If no MFA: Enroll in MFA
   - If has MFA: Verify with existing method

5. **AI Profiling** → FastAPI `/api/v1/profiling/*`
   - Complete AI profiling
   - Mark complete: `POST /api/v1/auth/onboarding/complete-step`

### Google SSO Signup:
- Same flow but skip email verification (Google verifies email)
- Goes directly to MFA setup → AI Profiling

---

## API Endpoints

### Check Onboarding Status
```
GET /api/v1/auth/onboarding/status?email=xxx&code=xxx
```
Returns next step in onboarding process.

### Complete Onboarding Step
```
POST /api/v1/auth/onboarding/complete-step
Body: { "step": "ai_profiling" }
```

### Setup Password (Email Link Flow)
```
POST /api/v1/auth/setup-password
Body: {
  "email": "user@example.com",
  "code": "magic_link_code",
  "password": "password123",
  "confirm_password": "password123"
}
```

### Verify Email (Signup Flow)
```
POST /api/v1/auth/verify-email
Body: {
  "email": "user@example.com",
  "code": "123456"
}
```

### MFA Enrollment
```
POST /api/v1/auth/mfa/enroll
Body: { "method": "email" | "sms" | "totp" }
```

### MFA Verification
```
POST /api/v1/auth/mfa/verify
Body: {
  "method": "email" | "sms" | "totp",
  "code": "123456"
}
```

---

## Frontend Implementation Checklist

### Email Link Onboarding Page
- [ ] Extract code and email from URL params
- [ ] Call `/api/v1/auth/onboarding/status?email=xxx&code=xxx`
- [ ] If `onboarding_complete: true`, redirect to dashboard
- [ ] If `next_step: 'setup_password'`, show password setup form
- [ ] After password setup, redirect to login
- [ ] After login, check if MFA needed
- [ ] After MFA, redirect to AI profiling
- [ ] After profiling, mark complete and redirect to dashboard

### Signup Page
- [ ] Collect user details
- [ ] Call `/api/v1/auth/signup`
- [ ] Auto-login after signup
- [ ] Show email verification form (OTP)
- [ ] After verification, check if MFA needed
- [ ] After MFA, redirect to AI profiling
- [ ] After profiling, mark complete and redirect to dashboard

### AI Profiling Page
- [ ] Check if user is authenticated
- [ ] Start profiling session with FastAPI
- [ ] Complete all profiling questions
- [ ] After completion, call `/api/v1/auth/onboarding/complete-step` with `step: 'ai_profiling'`
- [ ] Redirect to dashboard

---

## User Model Fields (Backend)

```python
user.email_verified: bool  # Email verified
user.account_status: str   # 'pending_verification' | 'active' | 'suspended'
user.is_active: bool       # Account active
user.mfa_enabled: bool     # MFA enabled
user.profiling_complete: bool  # AI profiling complete
```

---

## Notes

1. **Password Setup automatically activates account** (email link flow)
2. **Email Verification automatically activates account** (signup flow)
3. **MFA is optional but recommended** - users can skip if no MFA method exists
4. **AI Profiling is mandatory** for students - blocks access to dashboard until complete
5. **Onboarding status endpoint** guides the flow - always check it first
