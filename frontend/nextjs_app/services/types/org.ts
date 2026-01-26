/**
 * Organization types matching Django DRF OrganizationSerializer
 * These types should stay in sync with backend/django_app/organizations/serializers.py
 */

import { User } from './user';

export interface Organization {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website?: string;
  org_type: 'sponsor' | 'employer' | 'partner';
  status: 'active' | 'inactive' | 'suspended';
  owner: number; // User ID
  member_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: number;
  organization: number;
  user: number;
  role: string;
  joined_at: string;
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  description?: string;
  org_type: 'sponsor' | 'employer' | 'partner';
  website?: string;
}

export interface AddMemberRequest {
  user_id: number;
  role_id: number;
}

