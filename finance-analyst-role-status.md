## Finance & Analyst Roles – Implementation Status

This document compares the **intended Finance Director and Analyst roles** with what is **currently implemented** in the system (as of Feb 2026).

---

## High-Level Summary

- **Finance role**: Roles, permissions, and MFA hooks exist, but **billing APIs are still mostly sponsor/org-based**, not truly Finance-role-based. Refund flows, sponsorship wallets, consent gating, and detailed financial audit coverage are **not fully implemented**.
- **Analyst role**: Role and basic analytics permissions exist, and TalentScope partially checks for `analyst`, but **RLS/CLS, consent-gated analytics, and audit of analytics queries are largely missing**.
- **Cross-cutting**: MFA for Finance/Admin is wired into the auth/risk flow; org-level segregation exists via organizations/sponsor membership; consent and audit infrastructure exist but are **only partially applied** to billing/analytics.

---

## Finance Director Role – Requirement vs Implementation

### 1. Access & Permissions (RBAC/ABAC)

**Intended:**
- Finance can read invoices if `invoice.org_id == user.org_id` or `role in {Admin, Finance}`.
- RBAC/ABAC policies for billing data.
- **Mandatory MFA** for Finance role.

**Implemented:**
- **Roles & permissions defined**
  - `finance` and `finance_admin` roles are defined in `users/models.py`.
  - `seed_roles_permissions.py` assigns finance-oriented permissions such as: `read_billing`, `update_billing`, `manage_billing`, `create_invoice`, `read_invoice`, `update_invoice`, `list_invoices`, and for `finance_admin` also `delete_invoice`, `read_user`.
- **Org-level scoping capability**
  - `UserRole` includes `org_id`, `scope`, and `scope_ref` fields, enabling org- and resource-scoped roles.
- **MFA**
  - `risk_utils.requires_mfa()` treats `finance` (and `admin`) as **MFA-required** roles when `user.mfa_enabled` is true.
  - Auth flow (`auth_views.py`) enforces MFA at login when the risk engine indicates `mfa_required`.

**Gaps:**
- **RBAC enforcement on billing endpoints**
  - Billing and invoice-related APIs primarily use sponsor/org-style permissions (e.g. `IsSponsorUser`, `IsSponsorAdmin`) and **do not check `finance` / `finance_admin` roles or their granular permissions**.
  - No DRF permission classes like `IsFinance` or `IsFinanceAdmin` exist.
- **ABAC-style checks**
  - There is **no explicit policy** enforcing `invoice.org_id == user.org_id OR role in {Admin, Finance}`; instead, sponsorship/org membership is used for access control.

**Status:** **Partially implemented**
- Roles and permissions are modeled and seeded; MFA hooks exist.
- Endpoint-level enforcement for Finance roles and ABAC policies is **still missing**.

---

### 2. Scopes & Segregation

**Intended:**
- Organization-level segregation via `org_id`.
- Consent checks for employer/sponsor visibility.

**Implemented:**
- **Org-level segregation**
  - Sponsor-facing billing flows rely on:
    - `Organization` and `OrganizationMember` to constrain sponsor access to their own org.
    - Sponsor cohort and enrollment queries scoped to the current sponsor/org.
  - `UserRole.org_id` supports attaching roles to a specific organization.
- **Consent scaffolding**
  - `ConsentScope` model defines scopes like `share_with_sponsor`, `analytics`, `employer_share`, etc.
  - `consent_utils.py` provides helpers (`check_consent`, `grant_consent`, `revoke_consent`).
  - Token/profile payloads can expose `consent_scopes` to clients.

**Gaps:**
- **Consent not wired into billing visibility**
  - No billing endpoints explicitly call `check_consent` or enforce `share_with_sponsor` / `employer_share` before showing billing information.
  - Consent middleware exists but **is not registered** in Django `MIDDLEWARE`, so it is not active.

**Status:** **Org-level segregation implemented via sponsor/org; consent checks for finance visibility are not yet applied.**

---

### 3. Functional Capabilities

**Intended Finance capabilities:**
- Access invoices, refunds, sponsorship wallets.
- Approve refunds (via Billing module).
- View financial dashboards (seat caps, products, prices).
- View products, prices, seat caps, and approve refunds linked to cohorts/programs.
- View payment-related message logs.

**Implemented:**
- **Invoices / billing data**
  - Sponsor billing models: `SponsorCohortBilling`, `SponsorFinancialTransaction`, `PaymentTransaction`, `RevenueShareTracking`, etc.
  - Sponsor billing endpoints exist and are org-scoped (for sponsors), but **return empty or limited data in some places and are not wired to Finance roles**.
- **Products, prices, seat caps**
  - Program/cohort entities and seat caps exist and are surfaced to director/program-related views.
  - Some dashboards exist for sponsors/programs, but they are tied to sponsor/program director access, not explicitly to Finance role.
- **Payment-related logs**
  - Notification/message logs exist (e.g. notification logs in mentorship/coordination modules).
  - There is **no dedicated Finance-facing view** to inspect payment-related message logs.
- **Refunds & sponsorship wallets**
  - Financial transaction models support `refund` as a type, but:
    - There is **no Finance-only refund approval flow** wired through RBAC.
    - There is **no explicit “sponsorship wallet” model**; sponsorship-related balances are tracked via existing financial models, not via a dedicated wallet abstraction.

**Status:** **Core billing models exist; Finance-specific use-cases (refund approval, sponsorship wallets, finance dashboards, finance access to logs) are only partially or indirectly supported.**

---

### 4. Consent & Privacy

**Intended:**
- Finance gets **masked access to billing data only**, with **no student PII beyond billing**.
- Compliance with Botswana DPA/GDPR for financial records.

**Implemented:**
- **Consent & scopes**
  - Central consent model and utilities; an `analytics` and `share_with_sponsor` scope exist.
  - Marketplace/employer flows already use consent to gate employer visibility in some places.

**Gaps:**
- **PII masking for Finance views**
  - There is **no explicit Finance-specific PII masking layer** over billing data (e.g. views/serializers that redacts student personal data when served to Finance roles).
- **Consent linkage**
  - Consent is **not enforced** on billing endpoints; billing visibility is not currently consent-gated.
- **Formal DPA/GDPR controls**
  - No explicit retention policies or masking logic tied to finance export flows are implemented in code.

**Status:** **Infrastructure for consent exists, but Finance-specific masking and compliance rules are not wired into billing endpoints or exports.**

---

### 5. Data Model Dependencies & Audit/Retention

**Intended:**
- Billing tables: `invoices`, `entitlements`, `refunds`.
- Org-level finance: `orgs`, `org_members`, `audit_logs`.
- Security & compliance:
  - MFA mandatory.
  - Full audit trail for financial actions.
  - Retention rules: invoices retained per law; PII masked in exports.

**Implemented:**
- **Data models**
  - Invoice-like, entitlement, and refund-related models exist under sponsors/users/subscriptions.
  - Organizations and organization membership are fully modeled.
  - `AuditLog` model exists and is used for various auth- and sponsor-related events.
- **Audit trail (partial)**
  - `SponsorAuditService` is intended to log actions such as invoice generation and payment marking.
  - Generic audit helpers (`log_audit_event`, `_log_audit_event`) log authentication, MFA, and some consent actions.
- **MFA**
  - Finance and Admin roles are treated as higher-risk and **trigger MFA** via the risk engine where configured.

**Gaps:**
- **Coverage of financial actions**
  - Refund approvals, billing updates, and many Finance-specific actions are **not explicitly audited**.
  - `SponsorAuditService` likely has a schema mismatch with `AuditLog` (field naming discrepancy), which may prevent its logs from working as intended.
- **Retention & export masking**
  - No explicit configurable retention rules for invoices/financial records in code.
  - No standardized masking for PII in financial exports.

**Status:** **Foundational models and partial audit logging exist; finance-grade audit coverage and retention/masking rules are not yet fully implemented.**

---

## Analyst Role – Requirement vs Implementation

### 1. Access & Permissions (RBAC/ABAC)

**Intended:**
- Analytics **read-only** access.
- No PII access unless explicitly granted via consent scopes.

**Implemented:**
- **Role & permissions**
  - `analyst` role defined in `users/models.py`.
  - `seed_roles_permissions.py` gives `analyst` permissions like `read_analytics`, `list_analytics`.
- **Partial usage**
  - TalentScope analytics views sometimes check for `analyst` or `admin` roles when allowing cross-mentee access.

**Gaps:**
- **Read-only enforcement**
  - There is no **generic DRF permission class** that enforces “analytics read-only” semantics across analytics endpoints.
  - Some analytics-like endpoints rely on `is_staff` or `admin` instead of `analyst`, so the Analyst role cannot access them without admin privileges.
- **Consent-based PII gating**
  - No generic enforcement that `analyst` can only see PII if `analytics` or related consent scopes are present.

**Status:** **Analyst role and permissions exist; enforcement is spotty and not standardized across analytics endpoints.**

---

### 2. Scopes, Segregation, and Consent

**Intended:**
- Cohort, track, org-level segregation.
- Consent-gated access for sensitive data.

**Implemented:**
- **Segregation**
  - Analytics-related data (e.g. TalentScope, SponsorAnalytics, cohort analytics) are generally filtered by cohort/org context.
  - Program director/sponsor views have their own org/cohort scoping logic.
- **Consent model**
  - Consent scopes include `analytics`, and consent data is attached to users and tokens.

**Gaps:**
- **Systematic RLS/CLS**
  - There is **no row-level or column-level security layer** implemented at the ORM or database level for analytics; filtering is ad-hoc per view.
  - No central place where PII columns are consistently masked for analytics consumers.
- **Consent enforcement**
  - Analytics endpoints do not systematically call consent utilities or enforce `analytics` consent.
  - `ConsentMiddleware` is not enabled, so request/response pipelines do not enforce consent automatically.

**Status:** **Basic segregation by org/cohort exists via view logic; there is no unified RLS/CLS or consent enforcement for analytics.**

---

### 3. Functional Capabilities

**Intended Analyst capabilities:**
- Read dashboards, metrics, reports.
- Export CSV/JSON to analytics layer.
- Access cohort reports (seat utilization, completion).
- Access delivery metrics, logs, performance analytics.

**Implemented:**
- **Dashboards & metrics**
  - TalentScope and other analytics models provide readiness scores, signals, and sponsor analytics, which are surfaced via views.
  - Some director/sponsor dashboards expose cohort and program metrics.
- **Exports**
  - There are export endpoints for certain sponsor/program reports; however, they are generally wired for directors/sponsors, not explicitly for `analyst`.
- **Logs & metrics**
  - Notification and delivery logs exist, and some analytics are built on top of them.

**Gaps:**
- **Analyst-specific surfaces**
  - There is **no dedicated Analyst dashboard module**; analysts mostly reuse director/sponsor views where allowed.
  - Exports and analytics endpoints do not consistently check for the `analyst` role.
- **Consent-aware exports**
  - No evidence of exports that automatically strip or mask PII when performed under the Analyst role.

**Status:** **Analytics capabilities exist but are not cleanly separated or tailored for the Analyst role; exports and dashboards are primarily for directors/sponsors.**

---

### 4. Data Model Dependencies & Security/Compliance

**Intended:**
- Analytics tables: `usage_logs_daily`, `cohort_report_uri`, `notification_logs`.
- Consent integration: `consents`, `consent_scopes[]` embedded in tokens.
- Security & compliance:
  - RLS masks PII.
  - Consent enforcement for analytics involving personal data.
  - Audit logs for all analytics queries.

**Implemented:**
- **Data models**
  - Multiple analytics-related models exist (TalentScope readiness, signals, sponsor analytics, profiler analytics, notification logs).
  - Consent scopes are modeled and included in JWT/profile data.
- **Security hooks**
  - None of the analytics models are wrapped with formal RLS/CLS mechanisms in code.
  - No explicit audit logging for “analytics query” events.

**Gaps:**
- **RLS/CLS**
  - RLS is implemented only implicitly via ad-hoc filtering on request; it is not a general-purpose row-level security system.
  - There is no column-level masking system to hide PII fields in analytics contexts.
- **Consent enforcement**
  - No generic decorator or middleware enforces consent before returning analytics datasets containing personal data.
- **Audit for analytics**
  - Audit logging is focused on auth, MFA, and some sponsor actions; analytics reads and exports are **not audited**.

**Status:** **Building blocks exist (models, consents, audit infrastructure), but RLS/CLS, consent enforcement, and analytics query auditing are not implemented as first-class concerns.**

---

## Cross-Cutting: MFA, Consent, RLS/CLS, Audit

- **MFA**
  - Implemented via `risk_utils.requires_mfa()` and MFA views.
  - Finance and Admin roles are treated as high risk and can be forced through MFA at login.
- **Consent**
  - Consent models and utilities exist; some marketplace/employer flows use them.
  - Consent middleware is present but not enabled; billing and analytics endpoints do not generally call consent utils.
- **RLS/CLS**
  - No explicit, reusable RLS/CLS abstraction is in place; access control is mostly done with ORM filters and role checks in view code.
- **Audit**
  - Generic `AuditLog` model and helper utilities exist.
  - Auth/MFA/consent events are audited; some sponsor financial actions are intended to be audited but may suffer from schema mismatches.
  - Analytics reads/exports are not currently audited.

---

## Practical Interpretation

- **Finance Director** in the current system is **more of a conceptual role than a fully enforced one**: the role and permissions exist, and MFA is wired, but billing APIs still think in terms of sponsor/org membership and program director roles rather than Finance roles. Consent and PII masking for finance are not yet implemented.
- **Analyst** is **partially wired in TalentScope and permissions seeding**, but there is no unified analytics security layer (RLS/CLS, consent gating, audited queries). Analysts are not consistently distinguished from admins or directors across all analytics endpoints.

