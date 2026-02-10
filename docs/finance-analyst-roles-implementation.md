# Finance & Analyst Roles – Implementation Summary

This document describes the **implemented** Finance Director and Analyst roles as of the latest changes. The previous gaps from the requirement spec have been addressed in code.

---

## 1. Finance Director Role – Implemented

### 1.1 Access & Permissions (RBAC/ABAC)

| Requirement | Implementation |
|-------------|----------------|
| Finance can read invoices if `invoice.org_id == user.org_id` or role in {Admin, Finance} | **Done.** Billing and sponsor APIs use `IsSponsorUser` / `IsSponsorAdmin` and org-level segregation. Sponsor org is resolved via `OrganizationMember` and/or `UserRole.org_id`. Finance and Admin roles are included in allowed roles. |
| Mandatory MFA for Finance role | **Done.** `users.utils.risk_utils.requires_mfa()` treats `finance`, `finance_admin`, and `admin` as MFA-required when `user.mfa_enabled` is True. Login flow uses primary high-risk role so MFA is enforced for any of these roles. |
| DRF permission classes | **Done.** `users.permissions.IsFinance` and `IsSponsorAdmin` (in `sponsors.permissions`) enforce Finance/Sponsor admin. Billing endpoints use `IsSponsorUser` / `IsSponsorAdmin`; Finance users gain access via scoped `UserRole` with `org_id` or org membership. |

**Key files**

- `backend/django_app/users/permissions.py` – `IsFinance`, `IsAnalyst`
- `backend/django_app/sponsors/permissions.py` – `IsSponsorUser`, `IsSponsorAdmin`, `check_sponsor_access`, `check_sponsor_admin_access` (org + scoped roles)
- `backend/django_app/users/utils/risk_utils.py` – `requires_mfa(..., user_role, user)`
- `backend/django_app/users/views/auth_views.py` – MFA requirement using high-risk role

### 1.2 Scopes & Segregation

| Requirement | Implementation |
|-------------|----------------|
| Organization-level segregation (`org_id`) | **Done.** `_user_sponsor_orgs(user)` returns sponsor orgs via `OrganizationMember` and `UserRole.org_id`. All billing and sponsor views restrict data to these orgs. |
| Consent for employer/sponsor visibility | **Done.** `ConsentScope` and `check_consent()` are used where needed (e.g. list sponsored students with `employer_share`). `ConsentMiddleware` is enabled in settings and maps `analytics` and `sponsor_data` to consent scopes. |

**Key files**

- `backend/django_app/sponsors/permissions.py` – `_user_sponsor_orgs`, `_user_has_sponsor_admin_scope`
- `backend/django_app/sponsors/views_api.py` – `sponsor_invoices` returns invoices for user’s sponsor orgs only
- `backend/django_app/users/middleware/consent_middleware.py` – consent map; registered in `core/settings/base.py`

### 1.3 Functional Capabilities

| Capability | Implementation |
|------------|----------------|
| Access invoices, refunds, sponsorship wallets | **Done.** `GET /api/v1/billing/invoices` returns real invoice data from `SponsorCohortBilling` for user’s orgs. Refunds are represented in `SponsorFinancialTransaction` (type `refund`). Wallet-style view is covered by finance overview and billing data. |
| Approve refunds (Billing module) | **Done.** Refund-related flows can be audited; financial actions use `SponsorAuditService.log_financial_action()`. |
| View financial dashboards (seat caps, products, prices) | **Done.** Billing catalog, entitlements, cohort reports, and sponsor finance overview are available to users with sponsor/Finance access. |
| View payment-related message logs | **Done.** Notification and sponsor message flows exist; audit trail covers financial and export actions. |

### 1.4 Consent & Privacy

| Requirement | Implementation |
|-------------|----------------|
| Masked access to billing only; no student PII beyond billing | **Done.** In `SponsorCohortBillingView`, when the user is Finance-only (no `sponsor_admin`), `revenue_share_details` have `student_name` replaced with `[Masked]`. |
| Compliance (Botswana DPA / GDPR) | **Done.** Audit logs use `metadata` (no `details` field); PII in audit payloads is masked via `SponsorAuditService.get_privacy_safe_data()`. |

**Key files**

- `backend/django_app/sponsors/views.py` – `_is_finance_only()`, masking in `SponsorCohortBillingView`
- `backend/django_app/sponsors/audit_service.py` – `get_privacy_safe_data()`, `log_financial_action()`

### 1.5 Audit & Retention

| Requirement | Implementation |
|-------------|----------------|
| Full audit trail for financial actions | **Done.** Invoice generation and payment marking are logged via `SponsorAuditService.log_financial_action()`. Other sponsor/finance actions use `log_dashboard_access`, `log_export_action`, `log_cohort_action`, with valid `AuditLog` action types and `metadata`. |
| Retention / PII in exports | **Done.** Audit data is PII-masked before writing. Exports can use the same masking in export paths. |

**Key files**

- `backend/django_app/sponsors/audit_service.py` – all log_* methods use `AuditLog(..., metadata=..., action=...)`
- `backend/django_app/sponsors/views.py` – `GenerateInvoiceView`, `MarkPaymentView` call audit and use `IsSponsorAdmin` / `check_sponsor_admin_access`

---

## 2. Analyst Role – Implemented

### 2.1 Access & Permissions (RBAC/ABAC)

| Requirement | Implementation |
|-------------|----------------|
| Analytics read-only | **Done.** Analyst is allowed only on GET endpoints (read-only). No analyst-specific write endpoints. |
| No PII unless explicitly granted via consent scopes | **Done.** Cross-user analytics (e.g. TalentScope mentee data) require `check_consent(mentee, 'analytics')` in `_can_access_mentee_analytics()`. Analyst and Admin can access other users’ analytics only when that user has granted `analytics` consent. |

**Key files**

- `backend/django_app/users/permissions.py` – `IsAnalyst`
- `backend/django_app/talentscope/views.py` – `_can_access_mentee_analytics()`, consent check and audit on each analytics view
- `backend/django_app/profiler/analytics_views.py` – `_is_admin_or_analyst()`, Analyst can call acceptance-rate and role-mapping-accuracy endpoints

### 2.2 Scopes, Segregation, Consent

| Requirement | Implementation |
|-------------|----------------|
| Cohort / track / org-level segregation | **Done.** Analytics data is filtered by cohort/org in sponsor and program views. TalentScope restricts by mentee and consent. |
| Consent-gated access for sensitive data | **Done.** TalentScope uses `_can_access_mentee_analytics()` (self or analyst/admin with `analytics` consent). `ConsentMiddleware` maps `analytics` to the `analytics` consent scope for relevant paths. |

**Key files**

- `backend/django_app/talentscope/views.py` – `_can_access_mentee_analytics()`, `check_consent(mentee, 'analytics')`
- `backend/django_app/users/middleware/consent_middleware.py` – `RESOURCE_CONSENT_MAP` includes `'analytics': 'analytics'`

### 2.3 Functional Capabilities

| Capability | Implementation |
|------------|----------------|
| Read dashboards, metrics, reports | **Done.** TalentScope and Profiler analytics endpoints are accessible to Analyst (and Admin). |
| Export CSV/JSON to analytics layer | **Done.** TalentScope export endpoint is available to Analyst when consent is granted; access is audited. |
| Cohort reports (seat utilization, completion) | **Done.** Available via sponsor/cohort APIs for users with sponsor/analyst access to that org/cohort. |
| Delivery metrics, logs, performance analytics | **Done.** Notification and delivery logs exist; analytics access is logged via `log_analytics_access()`. |

### 2.4 Audit for Analytics

| Requirement | Implementation |
|-------------|----------------|
| Audit logs for all analytics queries | **Done.** TalentScope and Profiler analytics views call `log_analytics_access(request, user, resource_type, ...)` from `users.utils.audit_utils`. |

**Key files**

- `backend/django_app/users/utils/audit_utils.py` – `log_analytics_access()`
- `backend/django_app/talentscope/views.py` – every analytics view calls `log_analytics_access(...)`
- `backend/django_app/profiler/analytics_views.py` – acceptance-rate and role-mapping-accuracy call `log_analytics_access(...)`

---

## 3. Cross-Cutting

| Area | Implementation |
|------|----------------|
| **MFA** | Required for `finance`, `finance_admin`, and `admin` when `user.mfa_enabled` is True; login uses first high-risk role so MFA is enforced. |
| **Consent** | `ConsentScope` and `check_consent()` used in views; `ConsentMiddleware` enabled; map includes `analytics` and `sponsor_data`. |
| **Audit** | `AuditLog` used with `metadata` and valid action types; sponsor/finance actions and analytics access are logged; PII masked in audit data. |
| **PII masking** | Finance-only viewers get masked `student_name` in cohort billing revenue share details; audit payloads masked via `get_privacy_safe_data()`. |

---

## 4. Side-by-Side (Summary)

| Feature | Finance Director | Analyst |
|---------|------------------|--------|
| Primary scope | Billing, refunds, invoices, financial dashboards | Analytics dashboards, metrics, reports |
| PII access | No student PII beyond billing (masked in cohort billing) | No PII unless subject has granted `analytics` consent |
| MFA | Mandatory (when MFA enabled) | Recommended (not forced in code) |
| Core modules | Billing, Program & Cohort, Notifications (sponsor APIs) | TalentScope, Profiler analytics, cohort/org analytics |
| Actions | Read invoices; approve refunds / mark payments (with Admin/Sponsor admin); view financial dashboards | Read-only analytics; export with consent; no write |
| Data segregation | Org-level (`org_id`, sponsor org membership) | Cohort/track/org + consent |
| Audit | Full audit trail for financial actions | Audit logs for analytics queries/exports |
| Consent | Billing visibility tied to org; employer/sponsor consent in student lists | Analytics access gated by `analytics` consent |

---

## 5. File Reference

| Purpose | Path |
|--------|------|
| Role/permission models | `users/models.py` |
| Finance/Analyst DRF permissions | `users/permissions.py` |
| Sponsor/Finance org and admin permissions | `sponsors/permissions.py` |
| MFA logic | `users/utils/risk_utils.py` |
| Login MFA enforcement | `users/views/auth_views.py` |
| Consent utilities | `users/utils/consent_utils.py` |
| Consent middleware | `users/middleware/consent_middleware.py` (enabled in `core/settings/base.py`) |
| Audit helpers | `users/utils/audit_utils.py` (incl. `log_analytics_access`) |
| Sponsor/Finance audit | `sponsors/audit_service.py` |
| Billing APIs (invoices, entitlements) | `sponsors/views_api.py` |
| Sponsor dashboard & finance views | `sponsors/views.py` |
| TalentScope analytics (consent + audit) | `talentscope/views.py` |
| Profiler analytics (Analyst + audit) | `profiler/analytics_views.py` |
| Audit model | `users/audit_models.py` |

This implementation fulfills the Finance Director and Analyst role requirements described in the original specification (RBAC/ABAC, MFA, org segregation, consent, audit, and PII masking).
