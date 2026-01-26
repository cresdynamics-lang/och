/**
 * Django API client for Next.js frontend.
 */
import axios from 'axios';

const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || '';

const djangoApiClient = axios.create({
  baseURL: `${DJANGO_API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
djangoApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  bio?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website?: string;
  owner: User;
  member_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Progress {
  id: number;
  user: number;
  content_id: string;
  content_type: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  completion_percentage: number;
  score?: number;
  started_at?: string;
  completed_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const djangoApi = {
  // Users
  async getCurrentUser(): Promise<User> {
    const response = await djangoApiClient.get('/users/me/');
    return response.data;
  },

  async getUser(id: number): Promise<User> {
    const response = await djangoApiClient.get(`/users/${id}/`);
    return response.data;
  },

  // Organizations
  async getOrganizations(): Promise<Organization[]> {
    const response = await djangoApiClient.get('/organizations/');
    return response.data.results;
  },

  async getOrganization(slug: string): Promise<Organization> {
    const response = await djangoApiClient.get(`/organizations/${slug}/`);
    return response.data;
  },

  // Progress
  async getProgress(userId?: number): Promise<Progress[]> {
    const params = userId ? { user: userId } : {};
    const response = await djangoApiClient.get('/progress/', { params });
    return response.data.results;
  },

  async createProgress(data: Partial<Progress>): Promise<Progress> {
    const response = await djangoApiClient.post('/progress/', data);
    return response.data;
  },

  async updateProgress(id: number, data: Partial<Progress>): Promise<Progress> {
    const response = await djangoApiClient.patch(`/progress/${id}/`, data);
    return response.data;
  },
};

export default djangoApi;


