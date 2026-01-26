/**
 * Django API Client
 * Type-safe functions for Django backend endpoints
 */

import { apiGateway } from './apiGateway';
import type {
  User,
  UserRole,
  SignupRequest,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ConsentUpdate,
  PasswordResetRequest,
  PasswordResetConfirm,
  Organization,
  CreateOrganizationRequest,
  AddMemberRequest,
  Progress,
  CreateProgressRequest,
  UpdateProgressRequest,
} from './types';

/**
 * Django API Client
 */
export const djangoClient = {
  /**
   * Authentication endpoints
   */
  auth: {
    /**
     * Sign up a new user
     */
    async signup(data: SignupRequest): Promise<{ detail: string; user_id: number }> {
      return apiGateway.post('/auth/signup', data, { skipAuth: true });
    },

    /**
     * Login and get tokens
     */
    async login(data: LoginRequest): Promise<LoginResponse> {
      return apiGateway.post('/auth/login', data, { skipAuth: true });
    },

    /**
     * Request magic link
     */
    async requestMagicLink(email: string): Promise<{ detail: string }> {
      return apiGateway.post('/auth/login/magic-link', { email }, { skipAuth: true });
    },

    /**
     * Get current user profile
     * Returns user with roles, consents, and entitlements
     * Backend returns: { user: {...}, roles: [...], consent_scopes: [...], entitlements: [...] }
     */
    async getCurrentUser(): Promise<User & { roles?: UserRole[]; consent_scopes?: string[]; entitlements?: string[] }> {
      const response = await apiGateway.get<{ user: any; roles?: UserRole[]; consent_scopes?: string[]; entitlements?: string[] }>('/auth/me');
      console.log('getCurrentUser response:', response);
      
      // Backend returns: { user: {...}, roles: [...], consent_scopes: [...], entitlements: [...] }
      // We need to merge roles into the user object
      const userData = response.user || response;
      const mergedUser = {
        ...userData,
        roles: response.roles || userData.roles || [],
        consent_scopes: response.consent_scopes || userData.consent_scopes || [],
        entitlements: response.entitlements || userData.entitlements || [],
      };
      
      console.log('Merged user with roles:', mergedUser);
      return mergedUser as User & { roles?: UserRole[]; consent_scopes?: string[]; entitlements?: string[] };
    },

    /**
     * Refresh access token
     */
    async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
      return apiGateway.post('/auth/token/refresh', data, { skipAuth: true });
    },

    /**
     * Logout
     */
    async logout(refreshToken: string): Promise<{ detail: string }> {
      return apiGateway.post('/auth/logout', { refresh_token: refreshToken });
    },

    /**
     * Update consent scopes
     */
    async updateConsent(data: ConsentUpdate): Promise<{ detail: string }> {
      return apiGateway.post('/auth/consents', data);
    },

    /**
     * Request password reset
     */
    async requestPasswordReset(data: PasswordResetRequest): Promise<{ detail: string }> {
      return apiGateway.post('/auth/password/reset/request', data, { skipAuth: true });
    },

    /**
     * Confirm password reset
     */
    async confirmPasswordReset(data: PasswordResetConfirm): Promise<{ detail: string }> {
      return apiGateway.post('/auth/password/reset/confirm', data, { skipAuth: true });
    },

    /**
     * Enroll in MFA
     */
    async enrollMFA(data: { method: 'totp' | 'sms'; phone_number?: string }): Promise<{
      mfa_method_id: string;
      secret: string;
      qr_code_uri: string;
    }> {
      return apiGateway.post('/auth/mfa/enroll', data);
    },

    /**
     * Verify MFA code
     */
    async verifyMFA(data: { code: string; method: 'totp' | 'sms' }): Promise<{
      detail: string;
      backup_codes?: string[];
    }> {
      return apiGateway.post('/auth/mfa/verify', data);
    },

    /**
     * Disable MFA
     */
    async disableMFA(): Promise<{ detail: string }> {
      return apiGateway.post('/auth/mfa/disable', {});
    },

    /**
     * SSO login (redirect to provider)
     */
    async ssoLogin(provider: 'google' | 'microsoft' | 'apple' | 'okta'): Promise<void> {
      // SSO redirects to external provider, so we return the redirect URL
      window.location.href = `${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000'}/api/v1/auth/sso/${provider}`;
    },
  },

  /**
   * User endpoints
   */
  users: {
    /**
     * Get comprehensive user profile with role-specific data
     */
    async getProfile(): Promise<User & { 
      roles?: UserRole[]; 
      primary_role?: UserRole;
      consent_scopes?: any[];
      entitlements?: string[];
      role_specific_data?: any;
    }> {
      return apiGateway.get('/profile');
    },

    /**
     * Update user profile
     */
    async updateProfile(data: Partial<User>): Promise<User> {
      return apiGateway.patch('/profile', data);
    },

    /**
     * Get user by ID
     */
    async getUser(id: number): Promise<User> {
      return apiGateway.get(`/users/${id}`);
    },

    /**
     * List users (admin only)
     * @param params - Optional query parameters including page, page_size, and role
     */
    async listUsers(params?: { 
      page?: number
      page_size?: number
      role?: string
      search?: string
    }): Promise<{ results: User[]; count: number; next?: string | null; previous?: string | null }> {
      return apiGateway.get('/users', { params });
    },

    /**
     * Update user profile
     */
    async updateUser(id: number, data: Partial<User>): Promise<User> {
      return apiGateway.patch(`/users/${id}/`, data);
    },

    /**
     * Delete user
     */
    async deleteUser(id: number): Promise<void> {
      return apiGateway.delete(`/users/${id}/`);
    },

    /**
     * Get pending applications
     */
    async getPendingApplications(params?: {
      page?: number
      page_size?: number
    }): Promise<{ results: User[]; count: number; page: number; page_size: number }> {
      return apiGateway.get('/users/pending_applications/', { params });
    },

    /**
     * Approve a pending application
     */
    async approveApplication(userId: number, assignRole?: string): Promise<{ detail: string; user: User }> {
      return apiGateway.post(`/users/${userId}/approve/`, { assign_role: assignRole });
    },

    /**
     * Reject a pending application
     */
    async rejectApplication(userId: number, reason?: string): Promise<{ detail: string }> {
      return apiGateway.post(`/users/${userId}/reject/`, { reason });
    },

    /**
     * Get role distribution statistics
     */
    async getRoleDistribution(): Promise<{
      role_distribution: Record<string, number>;
      total_users: number;
      active_users: number;
    }> {
      return apiGateway.get('/users/role_distribution/');
    },
  },

  /**
   * Role endpoints
   */
  roles: {
    /**
     * List all roles
     */
    async listRoles(): Promise<{ results: Array<{ id: number; name: string; display_name: string; description: string }> }> {
      return apiGateway.get('/roles');
    },

    /**
     * Assign role to user
     */
    async assignRole(userId: number, data: { role_id: number; scope?: string; scope_ref?: string }): Promise<{ detail: string; user_role: any }> {
      return apiGateway.post(`/users/${userId}/roles`, data);
    },

    /**
     * Revoke role from user
     */
    async revokeRole(userId: number, roleId: number): Promise<{ detail: string }> {
      return apiGateway.delete(`/users/${userId}/roles/${roleId}`);
    },
  },

  /**
   * Organization endpoints
   */
  organizations: {
    /**
     * List organizations
     */
    async listOrganizations(): Promise<{ results: Organization[]; count: number }> {
      return apiGateway.get('/orgs');
    },

    /**
     * Get organization by slug
     */
    async getOrganization(slug: string): Promise<Organization> {
      return apiGateway.get(`/orgs/${slug}`);
    },

    /**
     * Create organization
     */
    async createOrganization(data: CreateOrganizationRequest): Promise<Organization> {
      return apiGateway.post('/orgs', data);
    },

    /**
     * Add member to organization
     */
    async addMember(slug: string, data: AddMemberRequest): Promise<{ detail: string }> {
      return apiGateway.post(`/orgs/${slug}/members`, data);
    },
  },

  /**
   * Mentorship-specific endpoints (student ↔ mentor feedback, reviews, analytics)
   */
  mentorship: {
    /**
     * Get all mentor reviews submitted by students (for director Mentor Reviews dashboard)
     */
    async getMentorReviews(params?: { mentor_id?: string; min_rating?: number }): Promise<{
      reviews: Array<{
        id: string
        mentor_id: string
        mentor_name?: string
        mentor_email?: string
        student_id?: string
        student_name?: string
        student_email?: string
        cohort_id?: string | null
        cohort_name?: string | null
        rating: number
        feedback: string
        reviewed_at: string
        director_comments: any[]
        status: 'pending' | 'approved' | 'flagged'
      }>
    }> {
      return apiGateway.get('/mentorship/mentor-reviews', { params });
    },
  },

  /**
   * Progress endpoints
   */
  progress: {
    /**
     * List progress records
     */
    async listProgress(params?: { user?: number; content_type?: string }): Promise<{ results: Progress[]; count: number }> {
      return apiGateway.get('/progress', { params });
    },

    /**
     * Get progress by ID
     */
    async getProgress(id: number): Promise<Progress> {
      return apiGateway.get(`/progress/${id}`);
    },

    /**
     * Create progress record
     */
    async createProgress(data: CreateProgressRequest): Promise<Progress> {
      return apiGateway.post('/progress', data);
    },

    /**
     * Update progress record
     */
    async updateProgress(id: number, data: UpdateProgressRequest): Promise<Progress> {
      return apiGateway.patch(`/progress/${id}`, data);
    },

    /**
     * Delete progress record
     */
    async deleteProgress(id: number): Promise<void> {
      return apiGateway.delete(`/progress/${id}`);
    },
  },

  /**
   * Recipe Engine endpoints
   */
  recipes: {
    /**
     * List recipes
     */
    async listRecipes(params?: {
      track_code?: string;
      skill_code?: string;
      level?: string;
      difficulty?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }): Promise<any> {
      return apiGateway.get('/recipes', { params });
    },

    /**
     * Get recipe by ID
     */
    async getRecipe(id: string): Promise<any> {
      return apiGateway.get(`/recipes/${id}`);
    },

    /**
     * Get user's recipe progress
     */
    async getUserRecipes(userId: string): Promise<any> {
      return apiGateway.get(`/users/${userId}/recipes`);
    },

    /**
     * Get user recipe progress
     */
    async getRecipeProgress(userId: string, recipeId: string): Promise<any> {
      return apiGateway.get(`/users/${userId}/recipes/${recipeId}/progress`);
    },

    /**
     * Update user recipe progress
     */
    async updateRecipeProgress(userId: string, recipeId: string, data: any): Promise<any> {
      return apiGateway.post(`/users/${userId}/recipes/${recipeId}/progress`, data);
    },

    /**
     * List recipe sources
     */
    async listRecipeSources(): Promise<any> {
      return apiGateway.get('/recipe-sources');
    },

    /**
     * Create recipe source
     */
    async createRecipeSource(data: any): Promise<any> {
      return apiGateway.post('/recipe-sources', data);
    },

    /**
     * Trigger recipe source ingestion
     */
    async ingestRecipeSource(sourceId: string): Promise<any> {
      return apiGateway.post(`/recipe-sources/${sourceId}/ingest`);
    },

    /**
     * Generate recipe via LLM
     */
    async generateRecipe(data: any): Promise<any> {
      return apiGateway.post('/recipes/generate', data);
    },

    /**
     * Get pending LLM jobs
     */
    async getPendingLLMJobs(): Promise<any> {
      return apiGateway.get('/recipe-llm-jobs', { params: { status: 'pending', limit: 10 } });
    },

    /**
     * Update LLM job status
     */
    async updateLLMJob(jobId: string, data: any): Promise<any> {
      return apiGateway.patch(`/recipe-llm-jobs/${jobId}`, data);
    },

    /**
     * Run LLM normalization worker
     */
    async runLLMNormalization(): Promise<any> {
      return apiGateway.post('/llm/normalize-recipes/run-once');
    },
  },

  /**
   * API Key endpoints
   */
  apiKeys: {
    /**
     * List API keys
     */
    async listApiKeys(): Promise<Array<{ id: number; name: string; key_prefix: string; created_at: string }>> {
      return apiGateway.get('/api-keys');
    },

    /**
     * Create API key
     */
    async createApiKey(data: { name: string; key_type: string; scopes?: string[] }): Promise<{
      id: number;
      name: string;
      key_prefix: string;
      key: string;
      detail: string;
    }> {
      return apiGateway.post('/api-keys', data);
    },

    /**
     * Revoke API key
     */
    async revokeApiKey(id: number): Promise<{ detail: string }> {
      return apiGateway.delete(`/api-keys/${id}`);
    },
  },

  /**
   * Audit log endpoints
   */
  audit: {
    /**
     * List audit logs
     */
    async listAuditLogs(params?: {
      start_date?: string;
      end_date?: string;
      action?: string;
      resource_type?: string;
      result?: string;
    }): Promise<Array<any>> {
      return apiGateway.get('/audit-logs', { params });
    },

    /**
     * Get audit log statistics
     */
    async getAuditStats(): Promise<{ total: number; success: number; failure: number; action_counts: Record<string, number> }> {
      return apiGateway.get('/audit-logs/stats');
    },
  },

  /**
   * Profiling endpoints
   */
  profiler: {
    /**
     * Check Tier 0 completion (profiler + foundations)
     */
    async checkTier0Status(): Promise<{
      tier0_complete: boolean;
      profiler_complete: boolean;
      profiler_completed_at?: string;
      foundations_complete: boolean;
      foundations_completed_at?: string;
    }> {
      return apiGateway.get('/profiler/tier0-status');
    },

    /**
     * Check if profiling is required
     */
    async checkRequired(): Promise<{
      required: boolean;
      completed: boolean;
      has_active_session?: boolean;
      session_id?: string;
      session_token?: string;
      current_section?: string;
      completed_at?: string;
    }> {
      return apiGateway.get('/profiler/check-required');
    },

    /**
     * Start profiling session
     */
    async start(): Promise<{
      session_id: string;
      session_token: string;
      status: string;
      current_section: string;
      current_question_index?: number;
      total_questions: number;
      aptitude_questions: Array<{
        id: string;
        question_text: string;
        answer_type: string;
        options: string[];
        category: string;
      }>;
      behavioral_questions: Array<{
        id: string;
        question_text: string;
        answer_type: string;
        options: string[];
        category: string;
      }>;
    }> {
      return apiGateway.post('/profiler/start', {});
    },

    /**
     * Autosave a response
     */
    async autosave(sessionToken: string, questionId: string, answer: any): Promise<{
      status: string;
      question_id: string;
    }> {
      return apiGateway.post('/profiler/autosave', {
        session_token: sessionToken,
        question_id: questionId,
        answer,
      });
    },

    /**
     * Update section progress
     */
    async updateProgress(
      sessionToken: string,
      currentSection: string,
      currentQuestionIndex: number
    ): Promise<{
      status: string;
      current_section: string;
      current_question_index: number;
    }> {
      return apiGateway.post('/profiler/update-progress', {
        session_token: sessionToken,
        current_section: currentSection,
        current_question_index: currentQuestionIndex,
      });
    },

    /**
     * Complete a section
     */
    async completeSection(
      sessionToken: string,
      section: 'aptitude' | 'behavioral',
      responses: Record<string, any>
    ): Promise<{
      status: string;
      session_id: string;
    }> {
      return apiGateway.post('/profiler/complete-section', {
        session_token: sessionToken,
        section,
        responses,
      });
    },

    /**
     * Complete profiling
     */
    async complete(sessionToken: string): Promise<{
      status: string;
      session_id: string;
      result: {
        overall_score: number;
        aptitude_score: number;
        behavioral_score: number;
        strengths: string[];
        areas_for_growth: string[];
        aptitude_breakdown: Record<string, any>;
        behavioral_traits: Record<string, number>;
        och_mapping: Record<string, any>;
      };
    }> {
      return apiGateway.post('/profiler/complete', {
        session_token: sessionToken,
      });
    },

    /**
     * Get profiling results
     */
    async getResults(): Promise<{
      completed: boolean;
      session_id?: string;
      completed_at?: string;
      result?: {
        overall_score: number;
        aptitude_score: number;
        behavioral_score: number;
        strengths: string[];
        areas_for_growth: string[];
        aptitude_breakdown: Record<string, any>;
        behavioral_traits: Record<string, number>;
        recommended_tracks: any[];
        learning_path_suggestions: any[];
        och_mapping: Record<string, any>;
      };
    }> {
      return apiGateway.get('/profiler/results');
    },

    /**
     * Get profiling status
     */
    async getStatus(): Promise<{
      status: string;
      completed: boolean;
      session_id?: string;
      session_token?: string;
      current_section?: string;
      current_question_index?: number;
      total_questions?: number;
      profiling_required?: boolean;
    }> {
      return apiGateway.get('/profiler/status');
    },
  },
};

export default djangoClient;

