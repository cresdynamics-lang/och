# Subscription System Implementation

## Overview
Full-featured subscription management system for OCH platform with admin controls, student self-service, and payment simulation. Supports three tiers: Free, Starter ($3/mo with 6-month Enhanced Access), and Professional ($7/mo).

---

## 1. Backend Infrastructure

### Database Models
**Location**: `backend/django_app/subscriptions/models.py`

- **SubscriptionPlan**: Defines tiers (free, starter, premium), pricing, features, limits
- **UserSubscription**: Links users to plans, tracks status, billing periods, Enhanced Access
- **PaymentGateway**: Supports multiple gateways (Stripe, Paystack, Flutterwave, M-Pesa)
- **PaymentTransaction**: Records all payment events with gateway details
- **SubscriptionRule**: Configurable business rules (grace periods, upgrade policies)
- **PaymentSettings**: Global payment configuration

### API Endpoints
**Location**: `backend/django_app/subscriptions/views.py`

#### Student Endpoints
- `GET /api/v1/subscription/status` - Current subscription status
- `GET /api/v1/subscription/plans` - List all available plans
- `GET /api/v1/subscription/billing-history` - Payment transaction history
- `POST /api/v1/subscription/simulate-payment` - Upgrade/downgrade simulation
- `POST /api/v1/subscription/cancel` - Cancel subscription (access until period end)

#### Admin Endpoints
**Location**: `backend/django_app/subscriptions/admin_views.py`

- `SubscriptionPlanViewSet` - CRUD for subscription plans
- `UserSubscriptionAdminViewSet` - Manage user subscriptions with audit logging
  - `POST /upgrade` - Manually upgrade users
  - `POST /downgrade` - Schedule downgrades
- `PaymentGatewayViewSet` - Configure payment gateways
- `PaymentTransactionViewSet` - View/manage transactions, issue refunds
- `SubscriptionRuleViewSet` - Configure business rules
- `PaymentSettingsViewSet` - Global payment settings

### Background Jobs
**Location**: `backend/django_app/subscriptions/scheduler.py`

Uses `django-apscheduler` for automated tasks:
- **Grace Period Enforcement**: Downgrades expired subscriptions after grace period
- **Enhanced Access Expiry**: Transitions Starter users from Enhanced → Normal mode
- **Renewal Processing**: Handles subscription renewals (when Stripe is integrated)

**Setup**: Migrations completed, scheduler active on server start

---

## 2. Admin Subscription Management

### Admin Dashboard
**Location**: `frontend/nextjs_app/app/dashboard/admin/subscriptions/`

#### Main Overview (`subscription-overview-client.tsx`)
- **Quick Stats**: Total subs, active subs, MRR, active gateways (live data)
- **Recent Subscriptions**: Last 10 user subscriptions with status
- **Revenue Chart**: Placeholder for future analytics
- **Action Cards**: Quick links to manage plans, users, gateways

#### User Subscriptions (`users/page.tsx`)
**Features**:
- Search users by email/username
- Filter by plan, status
- View subscription details (tier, status, enhanced access, billing dates)
- Quick actions: Upgrade, downgrade, cancel
- **Upgrade Modal**: Select new plan, apply immediately with audit log
- Real-time status badges (Active, Cancelled, Past Due)

#### Payment Gateways (`gateways/page.tsx`)
**Features**:
- List all configured gateways (Stripe, Paystack, Flutterwave, etc.)
- Add new gateway with credentials (API keys stored securely)
- Edit gateway settings
- Toggle enabled/disabled status
- Gateway types: card, mobile_money, bank_transfer

#### Transactions (`transactions/page.tsx`)
**Features**:
- View all payment transactions with filters (user, status, gateway)
- Transaction details: amount, currency, gateway, status, timestamp
- **Refund Modal**: Mark transactions as refunded (updates status, logs audit)
- Export capability (planned)
- Status tracking: completed, pending, failed, refunded

#### Subscription Rules (`rules/page.tsx`)
**Features**:
- **Rules Tab**: Configure upgrade/downgrade policies, grace periods, Enhanced Access windows
- **Settings Tab**: Global payment settings (currency, tax rates, etc.)
- JSON editor for complex rule configurations
- Apply/save changes with validation

### Permissions
**Location**: `backend/django_app/subscriptions/admin_views.py`

`IsAdmin` permission class checks:
- `user.is_staff = True` OR
- User has active 'admin' role in `user_roles` table

---

## 3. Student Subscription Pages

### Main Subscription Page
**Location**: `frontend/nextjs_app/app/dashboard/student/subscription/subscription-client.tsx`

**Route**: `/dashboard/student/subscription`

**Features**:
- **Current Plan Card**:
  - Tier badge (Free, Starter, Professional)
  - Status badge (Active, Cancelled, Past Due)
  - Next renewal date
  - Enhanced Access countdown (days remaining)
  - Included features list
  - Cancel subscription button (for paid plans)

- **Available Plans Grid**:
  - 3 plan cards (Free, Starter, Professional)
  - "Current Plan" badge on active tier
  - "Most Popular" badge on Professional
  - Pricing with monthly cost
  - Enhanced Access callout for Starter (6 months included)
  - Feature list with checkmarks
  - **Upgrade buttons**: Gold for Professional, Mint for Starter
  - **Downgrade buttons**: Outline variant, shows price
  - All buttons fully functional

- **Billing History Table**:
  - Date, plan name, amount, status
  - Shows simulated and real transactions
  - Empty state CTA for free users

**Functionality**:
- Real-time data loading from 3 endpoints (status, plans, billing)
- **Upgrade/Downgrade**: Single click → instant tier change via `/simulate-payment`
- **Cancel**: Marks subscription as cancelled, retains access until period end
- Error handling with user-friendly messages

### Settings Subscription Page
**Location**: `frontend/nextjs_app/components/ui/settings/sections/OCHSettingsSubscription.tsx`

**Route**: `/dashboard/student/settings/subscription`

**Features**:
- **Current Subscription Section**:
  - Tier and status display
  - Next payment date
  - Enhanced Access indicator with expiry
  - Grace period warning (if applicable)
  - Feature grid with included entitlements
  - Action buttons: Upgrade, Manage (navigates to main page), Refresh

- **Available Tiers Section**:
  - 3 tier cards with dynamic data from backend
  - Color-coded: Free (steel), Starter (mint), Professional (gold)
  - Pricing, mode notes, features
  - **Smart buttons**:
    - Current plan: Disabled "Current Plan" button
    - Higher tier: Upgrade button (colored by tier)
    - Lower tier: Downgrade button (outline)
  - Inline upgrade/downgrade (no navigation required)

**Functionality**:
- `handleUpgradeOrDowngrade(planName, action)` - Unified upgrade/downgrade handler
- Success alerts with plan name
- Tier level logic: `{ free: 0, starter: 1, premium: 2, professional: 2 }`
- Passes `plan.name` (e.g., "starter_3", "professional_7") to backend

---

## 4. Tier Mapping & Plan Seeding

### Tier Mapping
**Database tier → Frontend display**:
- `free` → `free`
- `starter` → `starter`
- `premium` → `professional`

**Why?**: Backend uses "premium" tier name, frontend displays "professional" for consistency.

### Current Plans (DSD Pricing)
Seeded via `backend/django_app/subscriptions/management/commands/seed_plans.py`:

| Plan ID | Name | Tier | Price | Enhanced Access | Features |
|---------|------|------|-------|-----------------|----------|
| `62697cea...` | free | free | $0 | - | Basic missions, limited AI coach |
| `14265ef5...` | starter_3 | starter | $3/mo | 180 days | All missions, higher AI limit, 6mo Enhanced Access |
| `ba5b2437...` | professional_7 | premium | $7/mo | - | Full access, mentorship, unlimited AI, marketplace contact |

**Run**: `python manage.py seed_plans` (idempotent, skips existing)

---

## 5. Payment Simulation

### How It Works
**Endpoint**: `POST /api/v1/subscription/simulate-payment`

**Flow**:
1. Frontend sends `{ plan: "starter_3" }` or `{ plan: "professional_7" }`
2. Backend resolves plan by name or tier mapping
3. Creates/updates `UserSubscription`:
   - Sets `status = 'active'`
   - Updates `current_period_start` and `current_period_end` (30 days)
   - For starter: Sets `enhanced_access_expires_at` (180 days, first time only)
4. Creates `PaymentTransaction` record with `status = 'completed'`
5. Syncs `MarketplaceProfile` tier
6. Returns success response with transaction ID

**Use Cases**:
- Development/testing without real payment gateway
- Instant tier changes for demos
- Admin manual upgrades

---

## 6. Subscription Lifecycle

### State Transitions

```
[New User] → Free Tier (auto-assigned)
    ↓
[Upgrade to Starter] → Active + Enhanced Access (180 days)
    ↓ (after 180 days)
[Enhanced Access Expires] → Normal Mode (limited features)
    ↓ (if payment fails)
[Grace Period] → 7 days to resolve payment
    ↓ (grace period ends)
[Auto-Downgrade] → Free Tier
```

### Cancel Flow
1. User clicks "Cancel Subscription"
2. Subscription status → `cancelled`
3. Access retained until `current_period_end`
4. Scheduler downgrades to Free at period end

---

## 7. Fixed Issues

### Database
- ✅ Fixed FK type mismatch (`user_id`: varchar → bigint)
- ✅ Removed non-existent `is_active` field from queries
- ✅ Fixed broken plan references (orphaned subscriptions)
- ✅ Applied django-apscheduler migrations

### Backend
- ✅ Fixed tier mapping (premium → professional)
- ✅ Added `SerializerMethodField` for nullable gateway names
- ✅ Enhanced `simulate_payment` to handle tier/name mapping
- ✅ Added audit logging for admin subscription changes

### Frontend
- ✅ Loaded plans dynamically from API (removed hardcoded tiers)
- ✅ Fixed upgrade button to pass plan name instead of tier
- ✅ Implemented downgrade functionality (was missing)
- ✅ Enabled downgrade buttons on both pages
- ✅ Fixed tier comparison logic (free < starter < professional)

---

## 8. Next Steps

### Phase 1: Payment Gateway Integration (Priority)
**Goal**: Replace simulated payments with real Stripe checkout

**Tasks**:
1. **Stripe Setup**:
   - [ ] Create Stripe products/prices for each plan
   - [ ] Configure webhook endpoint (`/api/v1/subscription/webhooks/stripe`)
   - [ ] Test checkout session creation
   - [ ] Handle successful payment events
   - [ ] Handle failed payment events

2. **Webhook Processing**:
   - [ ] Verify webhook signatures
   - [ ] Process `checkout.session.completed` → activate subscription
   - [ ] Process `invoice.payment_failed` → mark past_due
   - [ ] Process `customer.subscription.deleted` → cancel subscription

3. **Frontend Updates**:
   - [ ] Replace "Simulate Payment" with "Checkout" flow
   - [ ] Redirect to Stripe checkout on upgrade
   - [ ] Handle return from successful payment
   - [ ] Handle payment cancellation

4. **Additional Gateways** (Optional):
   - [ ] Paystack integration for African markets
   - [ ] Flutterwave for mobile money
   - [ ] M-Pesa direct integration

### Phase 2: Access Control & Feature Gating
**Goal**: Restrict features based on subscription tier

**Tasks**:
1. **Backend Permissions**:
   - [ ] Create `@subscription_required` decorator
   - [ ] Create `@tier_required(min_tier='starter')` decorator
   - [ ] Add subscription checks to protected endpoints:
     - [ ] AI Coach: Enforce daily limits by tier
     - [ ] Missions: Restrict advanced missions to paid tiers
     - [ ] Mentorship: Professional tier only
     - [ ] TalentScope: Limit free tier access
     - [ ] Marketplace: Contact restrictions

2. **Enhanced Access Logic**:
   - [ ] Create `get_user_mode()` utility: Enhanced vs Normal
   - [ ] Apply Enhanced Access limits to Starter users after 180 days
   - [ ] Update API responses to include mode information

3. **Frontend Access Control**:
   - [ ] Create `useSubscription()` hook with tier checks
   - [ ] Add paywall modals for restricted features
   - [ ] Show upgrade CTAs on feature boundaries
   - [ ] Disable premium features for free/starter users

4. **Marketplace Integration**:
   - [ ] Sync subscription tier to marketplace profile (✅ Done)
   - [ ] Restrict contact visibility based on tier
   - [ ] Show tier badges on marketplace profiles

### Phase 3: Analytics & Optimization
**Tasks**:
- [ ] Revenue dashboard (MRR, churn, LTV)
- [ ] Subscription analytics (conversion funnel, upgrade rates)
- [ ] Usage tracking per tier
- [ ] A/B testing for pricing

### Phase 4: Advanced Features
**Tasks**:
- [ ] Annual billing (discount for yearly plans)
- [ ] Promo codes / coupons
- [ ] Referral program
- [ ] Team/organization plans
- [ ] Auto-retry failed payments
- [ ] Dunning management (recovery emails)

---

## 9. Testing Checklist

### Admin Tests
- [x] Admin can view all subscriptions
- [x] Admin can upgrade user subscription
- [x] Admin can downgrade user subscription
- [x] Admin can add/edit payment gateways
- [x] Admin can view transactions
- [x] Admin can refund transactions
- [x] Audit logs created for admin actions

### Student Tests
- [x] Student can view current subscription
- [x] Student can upgrade to higher tier
- [x] Student can downgrade to lower tier
- [x] Student can cancel subscription
- [x] Student can view billing history
- [x] Enhanced Access countdown visible for Starter tier
- [x] Settings page shows correct tier info
- [x] Both pages load plans from backend API

### Backend Tests
- [x] simulate_payment creates subscription
- [x] simulate_payment creates transaction record
- [x] Tier mapping works (premium → professional)
- [x] Scheduler jobs registered (django-apscheduler)
- [x] All API endpoints return correct data
- [ ] Grace period enforcement job works (pending test)
- [ ] Enhanced Access expiry job works (pending test)

---

## 10. Key Files Reference

### Backend
- `backend/django_app/subscriptions/models.py` - Database models
- `backend/django_app/subscriptions/views.py` - Student API endpoints
- `backend/django_app/subscriptions/admin_views.py` - Admin API endpoints
- `backend/django_app/subscriptions/serializers.py` - API serializers
- `backend/django_app/subscriptions/scheduler.py` - Background jobs
- `backend/django_app/subscriptions/urls.py` - URL routing
- `backend/django_app/subscriptions/management/commands/seed_plans.py` - Plan seeding

### Frontend - Admin
- `frontend/nextjs_app/app/dashboard/admin/subscriptions/subscription-overview-client.tsx` - Overview
- `frontend/nextjs_app/app/dashboard/admin/subscriptions/users/page.tsx` - User management
- `frontend/nextjs_app/app/dashboard/admin/subscriptions/gateways/page.tsx` - Gateway config
- `frontend/nextjs_app/app/dashboard/admin/subscriptions/transactions/page.tsx` - Transactions
- `frontend/nextjs_app/app/dashboard/admin/subscriptions/rules/page.tsx` - Rules & settings

### Frontend - Student
- `frontend/nextjs_app/app/dashboard/student/subscription/subscription-client.tsx` - Main page
- `frontend/nextjs_app/components/ui/settings/sections/OCHSettingsSubscription.tsx` - Settings page

### Shared
- `frontend/nextjs_app/services/apiGateway.ts` - API client (used by both)

---

## 11. Environment Variables

### Required for Stripe Integration
```env
# Backend (.env)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Frontend (.env.local)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Optional (Other Gateways)
```env
PAYSTACK_SECRET_KEY=sk_test_...
FLUTTERWAVE_SECRET_KEY=...
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
```

---

## 12. Security Considerations

### Current Implementation
- ✅ Authentication required for all endpoints
- ✅ Admin permission checks (IsAdmin)
- ✅ Audit logging for admin actions
- ✅ CSRF protection enabled
- ✅ Secure gateway credential storage (encrypted in DB)

### Before Production
- [ ] Enable HTTPS only
- [ ] Validate webhook signatures (Stripe, Paystack)
- [ ] Rate limiting on payment endpoints
- [ ] PCI compliance review (if storing card data)
- [ ] Encrypt sensitive gateway credentials at rest
- [ ] Add fraud detection rules
- [ ] Implement 3D Secure for cards

---

## Summary

**Completed**: Full subscription infrastructure with admin management, student self-service, payment simulation, and background job scheduling.

**Next Priority**: Integrate Stripe payment gateway and implement tier-based access control to restrict features according to subscription level.

**Status**: ✅ Ready for payment gateway integration and feature gating.
