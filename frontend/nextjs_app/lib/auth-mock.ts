/**
 * Mock Auth Service
 * Provides a simple interface for authentication during development
 * This can be replaced with real backend calls when ready
 */

interface AuthResult {
  success: boolean
  message?: string
  user?: {
    id: string
    email: string
    role: string
  }
  requiresOnboarding?: boolean
  requiresProfileCompletion?: boolean
}

export const authService = {
  /**
   * Login with email and password
   */
  async login(email: string, _password: string): Promise<AuthResult> {
    // For now, allow any login for development
    // In production, this would call the real API
    return {
      success: true,
      user: {
        id: '1',
        email,
        role: 'student', // Default to student/mentee
      },
      requiresOnboarding: false,
      requiresProfileCompletion: false,
    }
  },

  /**
   * Signup with email and password
   */
  async signupWithEmail(email: string, _password: string): Promise<AuthResult> {
    // For development, simulate successful signup
    return {
      success: true,
      user: {
        id: '1',
        email,
        role: 'student',
      },
      requiresOnboarding: true,
    }
  },

  /**
   * Signup with Google
   */
  async signupWithGoogle(): Promise<AuthResult> {
    // For development, simulate Google signup
    return {
      success: true,
      user: {
        id: '1',
        email: 'user@gmail.com',
        role: 'student',
      },
      requiresOnboarding: true,
    }
  },

  /**
   * Signup with Apple
   */
  async signupWithApple(): Promise<AuthResult> {
    // For development, simulate Apple signup
    return {
      success: true,
      user: {
        id: '1',
        email: 'user@icloud.com',
        role: 'student',
      },
      requiresOnboarding: true,
    }
  },

  /**
   * Complete onboarding
   */
  async completeOnboarding(userId: string): Promise<AuthResult> {
    // For development, simulate onboarding completion
    return {
      success: true,
      user: {
        id: userId,
        email: 'user@example.com',
        role: 'student',
      },
      requiresOnboarding: false,
      requiresProfileCompletion: true,
    }
  },

  /**
   * Verify OTP
   */
  async verifyOTP(email: string, otp: string): Promise<AuthResult> {
    // For development, accept any 6-digit OTP
    if (otp.length === 6) {
      return {
        success: true,
        user: {
          id: '1',
          email,
          role: 'student',
        },
        requiresOnboarding: true,
      }
    }
    return {
      success: false,
      message: 'Invalid OTP',
    }
  },

  /**
   * Resend OTP
   */
  async resendOTP(_email: string): Promise<AuthResult> {
    // For development, simulate OTP resend
    return {
      success: true,
      message: 'OTP sent successfully',
    }
  },

  /**
   * Complete profile
   */
  async completeProfile(userId: string): Promise<AuthResult> {
    // For development, simulate profile completion
    return {
      success: true,
      user: {
        id: userId,
        email: 'user@example.com',
        role: 'student',
      },
      requiresOnboarding: false,
      requiresProfileCompletion: false,
    }
  },
}

