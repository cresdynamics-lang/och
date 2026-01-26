/**
 * Google OAuth 2.0 Client
 * Handles Google SSO for account activation and signup
 */

import { apiGateway } from './apiGateway'

export interface GoogleOAuthInitiateResponse {
  auth_url: string
  state: string
}

export interface GoogleOAuthCallbackRequest {
  code: string
  state: string
  device_fingerprint?: string
  device_name?: string
}

export interface GoogleOAuthCallbackResponse {
  access_token: string
  refresh_token: string
  user: any
  consent_scopes: string[]
  account_created: boolean
  account_activated: boolean
}

export const googleOAuthClient = {
  /**
   * Initiate Google OAuth flow
   * GET /api/v1/auth/google/initiate
   * Returns the Google authorization URL to redirect user to
   */
  async initiate(): Promise<GoogleOAuthInitiateResponse> {
    return apiGateway.get('/auth/google/initiate', { skipAuth: true })
  },

  /**
   * Handle Google OAuth callback
   * POST /api/v1/auth/google/callback
   * Exchanges authorization code for tokens and creates/activates account
   */
  async callback(data: GoogleOAuthCallbackRequest): Promise<GoogleOAuthCallbackResponse> {
    return apiGateway.post('/auth/google/callback', data, { skipAuth: true })
  },
}
