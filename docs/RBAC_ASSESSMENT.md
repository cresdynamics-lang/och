# RBAC Implementation Assessment

This document summarizes whether **full RBAC** (Role-Based Access Control) is implemented in the system.

---

## Summary: **Partial RBAC — Not Full**

The system has **RBAC building blocks and role-based UI/route control**, but **API authorization is not driven by the central permission model**. Fine-grained (resource + action) checks exist in code but are **not wired to views**.

---

## What Is Implemented

### 1. **Data model (full RBAC schema)**

| Component | Location | Status |
|-----------|----------|--------|
| **Role** | `users/models.py` | ✅ Defined with `ROLE_TYPES`, `display_name`, `description`, `is_system_role` |
| **Permission** | `users/models.py` | ✅ Resource + action model (`resource_type`, `action`), e.g. `read_portfolio`, `manage_cohorts` |
| **Role ↔ Permission** | `users/models.py` | ✅ M2M: `Role.permissions` |
| **UserRole** | `users/models.py` | ✅ User–role assignment with **scope** (`global`, `org`, `cohort`, `track`) and `scope_ref` |

### 2. **Seeding (roles + permissions)**

- **Command**: `python manage.py seed_roles_permissions`
- **File**: `users/management/commands/seed_roles_permissions.py`
- **Behavior**: Creates many permissions (user, organization, cohort, track, portfolio, profiling, mentorship, analytics, billing, invoice, api_key, webhook) and assigns them to roles:
  - **admin**: all permissions  
  - **program_director**, **mentor**, **mentee**, **student**, **finance**, **finance_admin**, **sponsor_admin**, **analyst**: defined subsets  
- **Note**: `employer` role is **not** in this seed (used in frontend/serializers; may be created elsewhere via `get_or_create`).

### 3. **Central RBAC+ABAC engine (implemented but unused)**

- **File**: `users/utils/policy_engine.py`
- **Function**: `check_permission(user, resource_type, action, context=None)`
  - Uses **RBAC**: loads user’s roles, checks if any role has a `Permission` for that `(resource_type, action)`.
  - Then uses **ABAC**: evaluates `Policy` rules (conditions, allow/deny).
- **Usage**: **Not used by any view.** No import of `policy_engine` or `check_permission` in API/view code.

### 4. **DRF permission classes (role-name only)**

- **File**: `users/permissions.py`
- **Classes**: `IsMentor`, `IsProgramDirector`, `IsSponsorAdmin`, `IsFinance`, `IsAnalyst`
- **Logic**: Check `UserRole` with `role__name='...'` (or `role__name__in=[...]`). They **do not** use the `Permission` model or `check_permission`.
- **Usage**: Used in a subset of views (e.g. `IsProgramDirector` in director views, `IsSponsorAdmin` in sponsor API, `IsMentor` in mentors app). Many other views use only `IsAuthenticated` or ad-hoc checks like `_is_director_or_admin`.

### 5. **Frontend RBAC (route ↔ role)**

- **File**: `frontend/nextjs_app/utils/rbac.ts`
- **Content**: `ROUTE_PERMISSIONS` (path → required roles), `getUserRoles()`, `hasRouteAccess()`, `getPrimaryRole()`, `getDashboardRoute()`.
- **Middleware**: `frontend/nextjs_app/middleware.ts` uses role cookies and `canAccess(pathname, roles)` to protect dashboard routes.
- **Status**: **Implemented** for UI/route access by role.

### 6. **Scoped roles**

- **UserRole** supports `scope` and `scope_ref` (org/cohort/track).
- Used for sponsor/org segregation (e.g. `UserRole.org_id`, sponsor billing views). Not used consistently for all resource types.

---

## Gaps (Why It’s Not “Full” RBAC)

1. **API does not use the permission model**  
   No view calls `check_permission(resource_type, action)`. Authorization is either:
   - **Role-name only** (e.g. IsProgramDirector, IsSponsorAdmin), or  
   - **IsAuthenticated** plus ad-hoc logic (e.g. “own data”, “director or admin”).

2. **Policy engine is unused**  
   `policy_engine.check_permission` and ABAC `Policy` evaluation are never invoked from the API.

3. **Inconsistent use of permission classes**  
   Many endpoints use only `IsAuthenticated`; role-based classes are applied only in specific apps (programs, director, sponsors, mentors). There is no single pattern that maps “resource + action” to the backend.

4. **No DRF permission class based on (resource, action)**  
   There is no class that uses `Role.permissions` or `check_permission` for a given resource/action.

5. **Employer role**  
   Frontend and serializers reference `employer`; `Role.ROLE_TYPES` and `seed_roles_permissions` do not include it (role may be created on-the-fly elsewhere).

---

## Recommendations to Move Toward Full RBAC

1. **Wire API to the permission engine**  
   - Introduce a DRF permission class that calls `check_permission(request.user, resource_type, action, context)` (resource/action could come from view or decorator).  
   - Gradually attach this class to views that correspond to sensitive resources (e.g. cohort, billing, user management).

2. **Map endpoints to (resource, action)**  
   - Define for each API (or viewset) the logical `resource_type` and `action` (e.g. `cohort`, `update`).  
   - Use the same (resource, action) in the new permission class and ensure they exist in `Permission` and are assigned to roles in seed.

3. **Keep or extend ABAC**  
   - Keep using the policy engine for context (e.g. org_id, cohort_id, consent) so that “role has permission” is refined by ABAC where needed.

4. **Add employer to backend**  
   - Add `employer` to `Role.ROLE_TYPES` and to `seed_roles_permissions` (with appropriate permissions) so backend and frontend stay in sync.

5. **Audit views**  
   - For each protected endpoint, document required role or (resource, action), and replace ad-hoc checks with the central permission check where possible.

---

## Quick reference

| Layer | Uses RBAC model (Role/Permission) | Uses policy_engine | Notes |
|-------|-----------------------------------|--------------------|--------|
| **Models** | ✅ Full schema | — | Role, Permission, UserRole, Policy |
| **Seed** | ✅ Yes | — | Roles + permissions; employer missing |
| **policy_engine.check_permission** | ✅ Yes | ✅ Yes | **Not used by any view** |
| **DRF permission classes** | ❌ Role name only | ❌ No | IsMentor, IsProgramDirector, etc. |
| **API views** | ❌ No | ❌ No | Mostly IsAuthenticated or ad-hoc |
| **Frontend routes** | ✅ By role name | — | ROUTE_PERMISSIONS + middleware |

**Conclusion:** Full RBAC is **not** implemented end-to-end. The data model and policy engine support it, but the API layer does not use them; access control is largely role-name-based and ad-hoc. Implementing a single permission class that calls `check_permission` and attaching it to APIs would align the system with the existing RBAC/ABAC design.
