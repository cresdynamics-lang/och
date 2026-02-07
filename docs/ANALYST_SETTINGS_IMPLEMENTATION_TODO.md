# Analyst Settings Page - Complete Implementation TODO

**Route**: `/analyst/[userId]/settings`  
**RBAC**: `role === 'analyst'` only  
**Target Users**: 127 SOC L1 trainees  
**Structure**: Tabbed interface (desktop) / Accordion (mobile)

---

## 📋 PRE-IMPLEMENTATION CHECKLIST

### Phase 0: Setup & Structure
- [ ] **0.1** Create route structure: `app/analyst/[userId]/settings/page.tsx`
- [ ] **0.2** Create layout component: `components/analyst/settings/SettingsLayout.tsx`
- [ ] **0.3** Create type definitions: `types/analyst-settings.ts`
- [ ] **0.4** Create API endpoint: `app/api/analyst/[userId]/settings/route.ts`
- [ ] **0.5** Verify RBAC middleware for `/analyst/[userId]/settings`
- [ ] **0.6** Review existing settings patterns (student/admin settings)
- [ ] **0.7** Create feature branch: `feature/analyst-settings-page`

---

## 🆔 TASK 1: ACCOUNT SETTINGS

### 1.1 Type Definitions

- [ ] **1.1.1** Create `types/analyst-settings.ts`:
  ```typescript
  export interface AccountSettings {
    email: {
      primary: string;
      verified: boolean;
      verificationDate?: string;
    };
    phone: {
      number: string;
      verified: boolean;
      sms2faEnabled: boolean;
    };
    password: {
      lastChanged?: string;
      strength?: 'weak' | 'medium' | 'strong';
    };
    mfa: {
      enabled: boolean;
      method: 'totp' | 'sms' | null;
      totpSecret?: string;
      qrCode?: string;
    };
    linkedAccounts: {
      google: boolean;
      whatsappBusiness: boolean;
    };
    sessions: Array<{
      id: string;
      device: string;
      location: string;
      lastActive: string;
      current: boolean;
    }>;
  }
  ```

### 1.2 API Endpoints

- [ ] **1.2.1** Create `app/api/analyst/[userId]/settings/account/route.ts`:
  - [ ] GET handler returning `AccountSettings`
  - [ ] PUT handler for updating account settings
  - [ ] POST `/verify-email` - Resend verification email
  - [ ] POST `/verify-phone` - Send SMS verification code
  - [ ] POST `/change-password` - Change password with validation
  - [ ] POST `/enable-mfa` - Enable MFA (TOTP/SMS)
  - [ ] POST `/disable-mfa` - Disable MFA (requires password)
  - [ ] POST `/sessions/logout-all` - Log out all sessions
  - [ ] DELETE `/delete-account` - Delete account (with confirmation)

### 1.3 Components

- [ ] **1.3.1** Create `components/analyst/settings/AccountSettings.tsx`:
  - [ ] Email section with verification status
  - [ ] "Resend verification" / "Change email" buttons
  - [ ] Phone section with SMS 2FA toggle
  - [ ] "Add/Edit Phone" button
  - [ ] Password section with "Change Password" button
  - [ ] Password strength meter component
  - [ ] MFA section with Enable/Disable toggle
  - [ ] TOTP QR code display (when enabling)
  - [ ] Linked accounts display (Google, WhatsApp)
  - [ ] Active sessions list with device info
  - [ ] "Log out all" button
  - [ ] "Delete Account" button (danger zone)

- [ ] **1.3.2** Create `components/analyst/settings/EmailVerification.tsx`:
  - [ ] Email display with verified badge
  - [ ] Resend verification button
  - [ ] Change email modal/form
  - [ ] Verification status indicator

- [ ] **1.3.3** Create `components/analyst/settings/PhoneVerification.tsx`:
  - [ ] Phone number display
  - [ ] Add/Edit phone form
  - [ ] SMS verification code input
  - [ ] SMS 2FA toggle switch
  - [ ] Verification status

- [ ] **1.3.4** Create `components/analyst/settings/PasswordChange.tsx`:
  - [ ] Current password input
  - [ ] New password input with strength meter
  - [ ] Confirm password input
  - [ ] Password requirements list
  - [ ] Save button with validation

- [ ] **1.3.5** Create `components/analyst/settings/MFASetup.tsx`:
  - [ ] MFA enable/disable toggle
  - [ ] Method selection (TOTP/SMS)
  - [ ] TOTP QR code display
  - [ ] Manual entry code display
  - [ ] Verification code input
  - [ ] SMS opt-in checkbox

- [ ] **1.3.6** Create `components/analyst/settings/SessionManagement.tsx`:
  - [ ] List of active sessions
  - [ ] Device name, location, last active
  - [ ] Current session indicator
  - [ ] "Log out" button per session
  - [ ] "Log out all" button
  - [ ] Confirmation modal

- [ ] **1.3.7** Create `components/analyst/settings/DeleteAccountModal.tsx`:
  - [ ] Warning message
  - [ ] Confirmation input ("DELETE")
  - [ ] Data deletion explanation
  - [ ] Cancel/Confirm buttons

### 1.4 Integration

- [ ] **1.4.1** Add account settings to main settings page
- [ ] **1.4.2** Implement real-time save (optimistic UI)
- [ ] **1.4.3** Add validation for all forms
- [ ] **1.4.4** Add error handling and success messages

---

## 👤 TASK 2: PROFILE SETTINGS

### 2.1 Type Definitions

- [ ] **2.1.1** Add to `types/analyst-settings.ts`:
  ```typescript
  export interface ProfileSettings {
    personal: {
      name: string;
      photo: string | null;
      bio: string;
      location: string | null;
    };
    professional: {
      cohort: string;
      cohortRank: string; // "#3/127"
      track: string;
      trackProgress: number; // 68%
      readiness: number; // 82%
      certifications: Array<{
        id: string;
        name: string;
        issuer: string;
        date: string;
        badgeUrl?: string;
      }>;
    };
    portfolio: {
      publicProfile: boolean;
      viewsThisWeek: number;
      employerShare: Array<{
        company: string;
        enabled: boolean;
        views: number;
      }>;
      mentorShare: {
        enabled: boolean;
        mentorId?: string;
        mentorName?: string;
      };
      resumeUrl: string | null;
      resumeExpiry: string | null;
    };
  }
  ```

### 2.2 API Endpoints

- [ ] **2.2.1** Create `app/api/analyst/[userId]/settings/profile/route.ts`:
  - [ ] GET handler returning `ProfileSettings`
  - [ ] PUT handler for updating profile
  - [ ] POST `/photo` - Upload profile photo (300x300px)
  - [ ] POST `/certifications` - Add certification
  - [ ] DELETE `/certifications/[id]` - Remove certification
  - [ ] POST `/resume/generate` - Generate resume PDF
  - [ ] GET `/resume/download` - Download resume

### 2.3 Components

- [ ] **2.3.1** Create `components/analyst/settings/ProfileSettings.tsx`:
  - [ ] Personal section
  - [ ] Professional section
  - [ ] Portfolio sharing section

- [ ] **2.3.2** Create `components/analyst/settings/PersonalInfo.tsx`:
  - [ ] Name input (public)
  - [ ] Photo upload (300x300px preview)
  - [ ] Bio textarea
  - [ ] Location input (optional)
  - [ ] Save button

- [ ] **2.3.3** Create `components/analyst/settings/ProfessionalInfo.tsx`:
  - [ ] Cohort display (read-only, auto-updated)
  - [ ] Track display (read-only)
  - [ ] Readiness score display (read-only, auto-updated)
  - [ ] Certifications list
  - [ ] "Add Certification" button
  - [ ] Certification badges display

- [ ] **2.3.4** Create `components/analyst/settings/PortfolioSharing.tsx`:
  - [ ] Public profile toggle
  - [ ] Views counter (47 views/wk)
  - [ ] Employer sharing toggles (MTN, Vodacom, etc.)
  - [ ] Mentor sharing toggle
  - [ ] Resume PDF section
  - [ ] "Generate Resume" button
  - [ ] Download link with expiry countdown

- [ ] **2.3.5** Create `components/analyst/settings/PhotoUpload.tsx`:
  - [ ] Current photo display
  - [ ] Upload button
  - [ ] Image crop/resize (300x300px)
  - [ ] Preview before save
  - [ ] Remove photo option

- [ ] **2.3.6** Create `components/analyst/settings/CertificationManager.tsx`:
  - [ ] List of certifications
  - [ ] "Add Certification" modal
  - [ ] Certification form (name, issuer, date, badge)
  - [ ] Remove certification button
  - [ ] Badge display

- [ ] **2.3.7** Create `components/analyst/settings/ResumeGenerator.tsx`:
  - [ ] Current resume status
  - [ ] Generate button
  - [ ] Download link
  - [ ] Expiry countdown
  - [ ] Resume sections editor (skills, experience)

### 2.4 Integration

- [ ] **2.4.1** Add profile settings to main settings page
- [ ] **2.4.2** Connect to portfolio API
- [ ] **2.4.3** Implement photo upload with validation
- [ ] **2.4.4** Add real-time preview for profile changes

---

## 🔔 TASK 3: NOTIFICATIONS SETTINGS

### 3.1 Type Definitions

- [ ] **3.1.1** Add to `types/analyst-settings.ts`:
  ```typescript
  export interface NotificationSettings {
    channels: {
      email: {
        enabled: boolean;
        frequency: 'daily' | 'immediate';
        categories: {
          dailyDigest: boolean;
          quizDue: boolean;
          careerMatch: boolean;
        };
      };
      sms: {
        enabled: boolean;
        whatsappBusiness: boolean;
        categories: {
          urgentAlerts: boolean;
          mttrBreach: boolean;
          placement: boolean;
        };
      };
      push: {
        enabled: boolean;
        deviceTokens: string[];
        categories: {
          newMission: boolean;
          streakBroken: boolean;
        };
      };
      inApp: {
        enabled: boolean; // Always true, cannot disable
        style: 'banner' | 'toast' | 'email-fallback';
      };
    };
    priorities: {
      critical: Array<'mttr' | 'quiz-overdue'>;
      high: Array<'career-match' | 'portfolio-view'>;
      low: Array<'daily-streak' | 'video-recommended'>;
    };
  }
  ```

### 3.2 API Endpoints

- [ ] **3.2.1** Create `app/api/analyst/[userId]/settings/notifications/route.ts`:
  - [ ] GET handler returning `NotificationSettings`
  - [ ] PUT handler for updating notification preferences
  - [ ] POST `/test-email` - Send test email
  - [ ] POST `/test-sms` - Send test SMS
  - [ ] POST `/test-push` - Send test push notification

### 3.3 Components

- [ ] **3.3.1** Create `components/analyst/settings/NotificationSettings.tsx`:
  - [ ] Channel toggles (Email, SMS, Push, In-App)
  - [ ] Category checkboxes per channel
  - [ ] Priority settings
  - [ ] Test buttons

- [ ] **3.3.2** Create `components/analyst/settings/EmailNotifications.tsx`:
  - [ ] Email enabled toggle
  - [ ] Frequency selector (Daily/Immediate)
  - [ ] Category checkboxes
  - [ ] "Send Test Email" button
  - [ ] Unsubscribe link

- [ ] **3.3.3** Create `components/analyst/settings/SMSNotifications.tsx`:
  - [ ] SMS enabled toggle
  - [ ] WhatsApp Business toggle
  - [ ] Category checkboxes (urgent only)
  - [ ] "Send Test SMS" button
  - [ ] Phone number display

- [ ] **3.3.4** Create `components/analyst/settings/PushNotifications.tsx`:
  - [ ] Push enabled toggle
  - [ ] Device tokens list
  - [ ] Category checkboxes
  - [ ] "Send Test Push" button
  - [ ] Device management

- [ ] **3.3.5** Create `components/analyst/settings/NotificationPriorities.tsx`:
  - [ ] Critical priority settings
  - [ ] High priority settings
  - [ ] Low priority settings
  - [ ] Drag-and-drop priority reordering

### 3.4 Integration

- [ ] **3.4.1** Add notification settings to main settings page
- [ ] **3.4.2** Connect to notification service
- [ ] **3.4.3** Implement test notification functionality
- [ ] **3.4.4** Add real-time preference updates

---

## 🔒 TASK 4: PRIVACY & SHARING SETTINGS

### 4.1 Type Definitions

- [ ] **4.1.1** Add to `types/analyst-settings.ts`:
  ```typescript
  export interface PrivacySettings {
    profileVisibility: {
      publicPortfolio: boolean;
      viewsThisWeek: number;
      readinessScore: boolean;
      missionSubmissions: 'private' | 'mentors' | 'all';
    };
    dataSharing: {
      employers: Array<{
        company: string;
        enabled: boolean;
        scope: 'full' | 'readiness-only';
        views: number;
      }>;
      mentors: {
        enabled: boolean;
        currentMentors: Array<{
          id: string;
          name: string;
          access: 'full' | 'limited';
        }>;
        futureMentors: boolean;
      };
    };
    gdpr: {
      dataExport: {
        lastExport?: string;
        formats: Array<'json' | 'pdf'>;
      };
      analyticsOptOut: boolean;
      dataRetention: 'forever' | '2-years';
    };
    auditLog: Array<{
      id: string;
      action: string;
      timestamp: string;
      details: string;
    }>;
  }
  ```

### 4.2 API Endpoints

- [ ] **4.2.1** Create `app/api/analyst/[userId]/settings/privacy/route.ts`:
  - [ ] GET handler returning `PrivacySettings`
  - [ ] PUT handler for updating privacy settings
  - [ ] POST `/export-data` - Generate data export (JSON/PDF)
  - [ ] GET `/audit-log` - Get audit log (last 30 days)
  - [ ] POST `/consent` - Update consent scopes

### 4.3 Components

- [ ] **4.3.1** Create `components/analyst/settings/PrivacySettings.tsx`:
  - [ ] Profile visibility section
  - [ ] Data sharing section
  - [ ] GDPR section
  - [ ] Audit log section

- [ ] **4.3.2** Create `components/analyst/settings/ProfileVisibility.tsx`:
  - [ ] Public portfolio toggle
  - [ ] Views counter display
  - [ ] Readiness score sharing toggle
  - [ ] Mission submissions radio buttons
  - [ ] Preview of public profile

- [ ] **4.3.3** Create `components/analyst/settings/DataSharing.tsx`:
  - [ ] Employer sharing toggles (per company)
  - [ ] Scope selector (Full/Readiness only)
  - [ ] Views counter per employer
  - [ ] Mentor sharing toggle
  - [ ] Current mentors list
  - [ ] Future mentors toggle
  - [ ] Confirmation modals for changes

- [ ] **4.3.4** Create `components/analyst/settings/GDPRSettings.tsx`:
  - [ ] Data export section
  - [ ] "Export Data" button (JSON/PDF)
  - [ ] Analytics opt-out toggle
  - [ ] Data retention selector
  - [ ] Last export date display

- [ ] **4.3.5** Create `components/analyst/settings/AuditLog.tsx`:
  - [ ] Audit log list (last 30 days)
  - [ ] Filter by action type
  - [ ] Search functionality
  - [ ] Export audit log button
  - [ ] Pagination

- [ ] **4.3.6** Create `components/analyst/settings/ConsentManager.tsx`:
  - [ ] Granular consent toggles
  - [ ] Per-company consent
  - [ ] Per-mentor consent
  - [ ] Confirmation modals

### 4.4 Integration

- [ ] **4.4.1** Add privacy settings to main settings page
- [ ] **4.4.2** Connect to consent/audit APIs
- [ ] **4.4.3** Implement data export functionality
- [ ] **4.4.4** Add confirmation modals for sensitive changes

---

## 💳 TASK 5: SUBSCRIPTION SETTINGS

### 5.1 Type Definitions

- [ ] **5.1.1** Add to `types/analyst-settings.ts`:
  ```typescript
  export interface SubscriptionSettings {
    tier: {
      name: 'pro7' | 'pro7-max' | 'enterprise' | 'free';
      displayName: string;
      active: boolean;
      activeUntil: string;
      price: {
        amount: number;
        currency: string;
        period: 'monthly' | 'yearly';
      };
    };
    seats: {
      used: number;
      total: number;
      upgradeAvailable: boolean;
    };
    billing: {
      paymentMethod: {
        type: 'card' | 'mpesa';
        last4?: string;
        brand?: string;
      };
      nextBilling: {
        date: string;
        amount: number;
        currency: string;
      };
      history: Array<{
        id: string;
        date: string;
        amount: number;
        currency: string;
        status: 'paid' | 'pending' | 'failed';
        invoiceUrl?: string;
      }>;
    };
  }
  ```

### 5.2 API Endpoints

- [ ] **5.2.1** Create `app/api/analyst/[userId]/settings/subscription/route.ts`:
  - [ ] GET handler returning `SubscriptionSettings`
  - [ ] POST `/upgrade` - Upgrade subscription tier
  - [ ] POST `/downgrade` - Downgrade subscription
  - [ ] POST `/cancel` - Cancel subscription
  - [ ] POST `/payment-method` - Add/update payment method
  - [ ] GET `/invoices/[id]` - Download invoice PDF
  - [ ] GET `/usage` - Get usage statistics

### 5.3 Components

- [ ] **5.3.1** Create `components/analyst/settings/SubscriptionSettings.tsx`:
  - [ ] Current tier display
  - [ ] Seats usage display
  - [ ] Billing section
  - [ ] Upgrade options
  - [ ] Cancel subscription

- [ ] **5.3.2** Create `components/analyst/settings/TierDisplay.tsx`:
  - [ ] Current tier badge
  - [ ] Active until date
  - [ ] Price display
  - [ ] Tier features list
  - [ ] Upgrade button (if applicable)

- [ ] **5.3.3** Create `components/analyst/settings/BillingInfo.tsx`:
  - [ ] Payment method display
  - [ ] "Update Payment Method" button
  - [ ] Next billing date/amount
  - [ ] Invoice history table
  - [ ] Download invoice buttons

- [ ] **5.3.4** Create `components/analyst/settings/PaymentMethod.tsx`:
  - [ ] Current payment method display
  - [ ] "Add Card" button
  - [ ] "Add M-Pesa" button
  - [ ] Payment method form modal
  - [ ] Stripe integration

- [ ] **5.3.5** Create `components/analyst/settings/InvoiceHistory.tsx`:
  - [ ] Invoice list table
  - [ ] Date, amount, status columns
  - [ ] Download PDF buttons
  - [ ] Pagination

- [ ] **5.3.6** Create `components/analyst/settings/UpgradeOptions.tsx`:
  - [ ] Available tiers comparison
  - [ ] Feature comparison table
  - [ ] Upgrade buttons
  - [ ] Pricing display

- [ ] **5.3.7** Create `components/analyst/settings/CancelSubscriptionModal.tsx`:
  - [ ] Warning message
  - [ ] Downgrade options
  - [ ] Cancellation date
  - [ ] Feedback form
  - [ ] Confirm/Cancel buttons

### 5.4 Integration

- [ ] **5.4.1** Add subscription settings to main settings page
- [ ] **5.4.2** Integrate payment processing (Stripe/M-Pesa)
- [ ] **5.4.3** Implement upgrade/downgrade flows
- [ ] **5.4.4** Add invoice download functionality

---

## ⚙️ TASK 6: PREFERENCES SETTINGS

### 6.1 Type Definitions

- [ ] **6.1.1** Add to `types/analyst-settings.ts`:
  ```typescript
  export interface PreferencesSettings {
    dashboard: {
      layout: 'compact' | 'detailed';
      defaultTab: 'lab' | 'learning' | 'career' | 'metrics';
      theme: 'dark' | 'light';
    };
    workflow: {
      alertUrgency: 'high' | 'all';
      mttrTarget: number; // minutes (30, 20, custom)
      autoSave: {
        screenshots: boolean;
        notes: boolean;
      };
    };
    lab: {
      defaultTool: 'siem' | 'wireshark' | 'yara' | 'sigma';
      alertFilters: Array<'ryuk' | 'phishing' | 'all'>;
    };
    accessibility: {
      highContrast: boolean;
      screenReader: boolean;
      keyboardShortcuts: boolean;
    };
    notifications: {
      sound: 'default' | 'none';
    };
  }
  ```

### 6.2 API Endpoints

- [ ] **6.2.1** Create `app/api/analyst/[userId]/settings/preferences/route.ts`:
  - [ ] GET handler returning `PreferencesSettings`
  - [ ] PUT handler for updating preferences
  - [ ] POST `/reset` - Reset to defaults

### 6.3 Components

- [ ] **6.3.1** Create `components/analyst/settings/PreferencesSettings.tsx`:
  - [ ] Dashboard preferences
  - [ ] Workflow preferences
  - [ ] Lab preferences
  - [ ] Accessibility preferences

- [ ] **6.3.2** Create `components/analyst/settings/DashboardPreferences.tsx`:
  - [ ] Layout selector (Compact/Detailed)
  - [ ] Default tab selector
  - [ ] Theme toggle (Dark/Light)
  - [ ] Preview of changes

- [ ] **6.3.3** Create `components/analyst/settings/WorkflowPreferences.tsx`:
  - [ ] Alert urgency selector
  - [ ] MTTR target input (with presets)
  - [ ] Auto-save toggles (Screenshots, Notes)

- [ ] **6.3.4** Create `components/analyst/settings/LabPreferences.tsx`:
  - [ ] Default tool selector
  - [ ] Alert filter checkboxes
  - [ ] Tool shortcuts display

- [ ] **6.3.5** Create `components/analyst/settings/AccessibilityPreferences.tsx`:
  - [ ] High contrast toggle
  - [ ] Screen reader optimization toggle
  - [ ] Keyboard shortcuts toggle
  - [ ] Shortcuts reference modal

### 6.4 Integration

- [ ] **6.4.1** Add preferences to main settings page
- [ ] **6.4.2** Implement real-time preference updates
- [ ] **6.4.3** Add preference persistence
- [ ] **6.4.4** Add reset to defaults functionality

---

## 📱 TASK 7: MOBILE & RESPONSIVE DESIGN

### 7.1 Mobile Layout

- [ ] **7.1.1** Create `components/analyst/settings/SettingsMobile.tsx`:
  - [ ] Accordion sections for mobile
  - [ ] Collapsible panels
  - [ ] Touch-optimized controls
  - [ ] Bottom navigation integration

- [ ] **7.1.2** Update `components/analyst/settings/SettingsLayout.tsx`:
  - [ ] Responsive breakpoints
  - [ ] Mobile accordion view
  - [ ] Desktop sidebar tabs view
  - [ ] Smooth transitions

### 7.2 Search Functionality

- [ ] **7.2.1** Create `components/analyst/settings/SettingsSearch.tsx`:
  - [ ] Search input
  - [ ] Search results highlighting
  - [ ] Jump to section functionality
  - [ ] Search history

- [ ] **7.2.2** Implement URL search params:
  - [ ] `/settings?search=mfa` → Jump to MFA section
  - [ ] `/settings?tab=account` → Open Account tab
  - [ ] Deep linking support

### 7.3 Mobile Optimizations

- [ ] **7.3.1** Optimize forms for mobile:
  - [ ] Larger touch targets
  - [ ] Mobile-friendly inputs
  - [ ] Keyboard handling
  - [ ] Scroll optimization

- [ ] **7.3.2** Add mobile-specific features:
  - [ ] Swipe gestures for navigation
  - [ ] Pull-to-refresh
  - [ ] Bottom sheet modals

---

## ♿ TASK 8: ACCESSIBILITY

### 8.1 ARIA Labels

- [ ] **8.1.1** Add ARIA labels to all interactive elements:
  - [ ] Toggles and switches
  - [ ] Buttons and links
  - [ ] Form inputs
  - [ ] Modals and dialogs

- [ ] **8.1.2** Add ARIA live regions:
  - [ ] Success messages
  - [ ] Error messages
  - [ ] Loading states

### 8.2 Keyboard Navigation

- [ ] **8.2.1** Implement keyboard shortcuts:
  - [ ] Tab navigation through sections
  - [ ] Enter/Space for toggles
  - [ ] Escape to close modals
  - [ ] Arrow keys for navigation

- [ ] **8.2.2** Add focus management:
  - [ ] Focus trap in modals
  - [ ] Focus return after modal close
  - [ ] Skip links
  - [ ] Focus indicators

### 8.3 Screen Reader Support

- [ ] **8.3.1** Add semantic HTML:
  - [ ] Proper headings hierarchy
  - [ ] Landmark regions
  - [ ] Form labels
  - [ ] Error announcements

- [ ] **8.3.2** Test with screen readers:
  - [ ] NVDA (Windows)
  - [ ] VoiceOver (macOS/iOS)
  - [ ] JAWS (Windows)

---

## 🔐 TASK 9: SECURITY & VALIDATION

### 9.1 Form Validation

- [ ] **9.1.1** Implement client-side validation:
  - [ ] Email format validation
  - [ ] Phone number validation
  - [ ] Password strength validation
  - [ ] Required field validation

- [ ] **9.1.2** Implement server-side validation:
  - [ ] API endpoint validation
  - [ ] Input sanitization
  - [ ] Rate limiting
  - [ ] CSRF protection

### 9.2 Security Features

- [ ] **9.2.1** Add verification requirements:
  - [ ] Email change → Verify old + new
  - [ ] Password change → Verify old password
  - [ ] MFA changes → Require current password
  - [ ] Account deletion → Confirmation + password

- [ ] **9.2.2** Add audit logging:
  - [ ] Log all settings changes
  - [ ] Log security events
  - [ ] Log access attempts
  - [ ] Display in audit log section

### 9.3 Confirmation Modals

- [ ] **9.3.1** Create confirmation modals for:
  - [ ] Email changes
  - [ ] Password changes
  - [ ] MFA enable/disable
  - [ ] Sharing toggle changes
  - [ ] Account deletion
  - [ ] Subscription cancellation

---

## 🎨 TASK 10: UI/UX POLISH

### 10.1 Visual Design

- [ ] **10.1.1** Ensure cyber blue theme consistency:
  - [ ] Primary: `#0648A8` (och-defender-blue)
  - [ ] Accent: `#33FFC1` (och-cyber-mint)
  - [ ] Alert: `#F55F28` (och-signal-orange)
  - [ ] Dark: `#0A0A0C` → `#1A1A1E` gradient

- [ ] **10.1.2** Add loading states:
  - [ ] Skeleton loaders
  - [ ] Spinner animations
  - [ ] Progress indicators

- [ ] **10.1.3** Add success/error states:
  - [ ] Toast notifications
  - [ ] Inline error messages
  - [ ] Success badges

### 10.2 User Experience

- [ ] **10.2.1** Implement optimistic UI:
  - [ ] Immediate feedback on changes
  - [ ] Rollback on error
  - [ ] Loading states

- [ ] **10.2.2** Add helpful tooltips:
  - [ ] Explain each setting
  - [ ] Show examples
  - [ ] Link to documentation

- [ ] **10.2.3** Add real-time preview:
  - [ ] Profile preview
  - [ ] Theme preview
  - [ ] Layout preview

---

## 📊 TASK 11: API INTEGRATION

### 11.1 Main Settings API

- [ ] **11.1.1** Create `app/api/analyst/[userId]/settings/route.ts`:
  - [ ] GET handler returning all settings
  - [ ] PUT handler for bulk updates
  - [ ] GET `/export` - Export all settings

### 11.2 Sub-APIs

- [ ] **11.2.1** Create all sub-API routes:
  - [ ] `/account`
  - [ ] `/profile`
  - [ ] `/notifications`
  - [ ] `/privacy`
  - [ ] `/subscription`
  - [ ] `/preferences`

### 11.3 Data Fetching

- [ ] **11.3.1** Create React Query hooks:
  - [ ] `useAnalystSettings`
  - [ ] `useAccountSettings`
  - [ ] `useProfileSettings`
  - [ ] `useNotificationSettings`
  - [ ] `usePrivacySettings`
  - [ ] `useSubscriptionSettings`
  - [ ] `usePreferencesSettings`

---

## ✅ TASK 12: TESTING & VALIDATION

### 12.1 Unit Tests

- [ ] **12.1.1** Test components:
  - [ ] AccountSettings
  - [ ] ProfileSettings
  - [ ] NotificationSettings
  - [ ] PrivacySettings
  - [ ] SubscriptionSettings
  - [ ] PreferencesSettings

### 12.2 Integration Tests

- [ ] **12.2.1** Test API endpoints:
  - [ ] GET requests
  - [ ] PUT requests
  - [ ] POST requests
  - [ ] DELETE requests

### 12.3 E2E Tests

- [ ] **12.3.1** Test user flows:
  - [ ] Update email
  - [ ] Change password
  - [ ] Enable MFA
  - [ ] Update profile
  - [ ] Change notification preferences
  - [ ] Update privacy settings

### 12.4 Accessibility Tests

- [ ] **12.4.1** Run accessibility audit:
  - [ ] Lighthouse accessibility score
  - [ ] WCAG 2.1 AA compliance
  - [ ] Keyboard navigation
  - [ ] Screen reader testing

---

## 🚀 TASK 13: DEPLOYMENT

### 13.1 Pre-Deployment

- [ ] **13.1.1** Run TypeScript type checking
- [ ] **13.1.2** Run linter
- [ ] **13.1.3** Run build
- [ ] **13.1.4** Fix all errors

### 13.2 Production Checklist

- [ ] **13.2.1** Verify RBAC enforcement
- [ ] **13.2.2** Test all API endpoints
- [ ] **13.2.3** Verify mobile responsiveness
- [ ] **13.2.4** Test accessibility
- [ ] **13.2.5** Performance optimization

### 13.3 Deployment

- [ ] **13.3.1** Deploy to staging
- [ ] **13.3.2** Smoke test on staging
- [ ] **13.3.3** Deploy to production
- [ ] **13.3.4** Monitor for errors

---

## 📝 IMPLEMENTATION NOTES

### File Structure

```
app/analyst/[userId]/settings/
  ├── page.tsx (Main settings page)
  ├── layout.tsx (Settings layout wrapper)
  └── loading.tsx (Loading skeleton)

components/analyst/settings/
  ├── SettingsLayout.tsx (Desktop sidebar + mobile accordion)
  ├── SettingsSearch.tsx (Search functionality)
  ├── AccountSettings.tsx
  ├── ProfileSettings.tsx
  ├── NotificationSettings.tsx
  ├── PrivacySettings.tsx
  ├── SubscriptionSettings.tsx
  ├── PreferencesSettings.tsx
  └── [sub-components for each section]

app/api/analyst/[userId]/settings/
  ├── route.ts (Main settings API)
  ├── account/route.ts
  ├── profile/route.ts
  ├── notifications/route.ts
  ├── privacy/route.ts
  ├── subscription/route.ts
  └── preferences/route.ts

types/
  └── analyst-settings.ts (All type definitions)
```

### Key Patterns

1. **Real-time Save**: Optimistic UI with rollback on error
2. **Validation**: Client + server-side validation
3. **Security**: Verification for sensitive changes
4. **Accessibility**: ARIA labels, keyboard nav, screen reader support
5. **Mobile**: Accordion sections, touch-optimized
6. **Theme**: Cyber blue consistency throughout

---

## 🎯 PRIORITY ORDER

### Phase 1: Foundation (Week 1)
1. Task 0: Setup & Structure
2. Task 1: Account Settings
3. Task 11: API Integration (basic)

### Phase 2: Core Features (Week 2)
1. Task 2: Profile Settings
2. Task 3: Notifications Settings
3. Task 4: Privacy & Sharing Settings

### Phase 3: Advanced Features (Week 3)
1. Task 5: Subscription Settings
2. Task 6: Preferences Settings
3. Task 7: Mobile & Responsive

### Phase 4: Polish & Deploy (Week 4)
1. Task 8: Accessibility
2. Task 9: Security & Validation
3. Task 10: UI/UX Polish
4. Task 12: Testing
5. Task 13: Deployment

---

**Total Tasks**: ~200+ individual checklist items  
**Estimated Time**: 4 weeks  
**Status**: Ready to begin implementation

