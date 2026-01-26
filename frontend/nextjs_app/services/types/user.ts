/**
 * User types matching Django DRF UserSerializer
 * These types should stay in sync with backend/django_app/users/serializers.py
 */

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  bio?: string;
  avatar_url?: string;
  phone_number?: string;
  country?: string;
  timezone: string;
  language: string;
  cohort_id?: string;
  track_key?: string;
  org_id?: number;
  account_status: 'pending_verification' | 'active' | 'suspended' | 'deactivated' | 'erased';
  email_verified: boolean;
  mfa_enabled: boolean;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  roles?: UserRole[];
  consent_scopes?: string[];
  entitlements?: string[];
  preferred_learning_style?: string;
  career_goals?: string;
  cyber_exposure_level?: string;
  // Mentor-specific properties
  mentor_capacity_weekly?: number;
  mentor_specialties?: string[];
  mentor_availability?: any;
  // Profiling completion tracking (Tier 0)
  profiling_complete?: boolean;
  profiling_completed_at?: string;
  profiling_session_id?: string;
  recommended_track?: string; // Track key from profiler (e.g., 'defender', 'offensive', 'grc', 'innovation', 'leadership')
  // Foundations completion tracking (Tier 1)
  foundations_complete?: boolean;
  foundations_completed_at?: string;
  // University/Community profile
  university_id?: number | null;
  university_name?: string | null;
}

export interface UserRole {
  role: string;
  scope: 'global' | 'org' | 'cohort' | 'track';
  scope_ref?: string;
  role_display_name?: string;
}

export interface SignupRequest {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  country?: string;
  timezone?: string;
  language?: string;
  passwordless?: boolean;
  invite_token?: string;
  cohort_id?: string;
  track_key?: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
  code?: string;
  device_fingerprint?: string;
  device_name?: string;
}

export interface LoginResponse {
  access_token?: string;
  refresh_token?: string;
  user?: User;
  mfa_required?: boolean;
  session_id?: string;
  detail?: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
  device_fingerprint?: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface ConsentUpdate {
  scope_type: string;
  granted: boolean;
  expires_at?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

