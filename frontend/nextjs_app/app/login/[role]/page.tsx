'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getRedirectRoute } from '@/utils/redirect';
import { Eye, EyeOff, ArrowRight, Lock, Mail, Shield, Sparkles } from 'lucide-react';
import type { LoginRequest } from '@/services/types';

const PERSONAS = {
  student: {
    name: 'Student',
    icon: '🎓',
    color: 'defender-blue',
    description: 'Begin your cyber defense journey',
    gradient: 'from-blue-500/20 via-blue-600/10 to-slate-900/30'
  },
  mentor: {
    name: 'Mentor',
    icon: '👨‍🏫',
    color: 'sahara-gold',
    description: 'Guide the next generation',
    gradient: 'from-yellow-500/20 via-yellow-600/10 to-slate-900/30'
  },
  admin: {
    name: 'Admin',
    icon: '⚡',
    color: 'sahara-gold',
    description: 'Full platform access',
    gradient: 'from-yellow-500/20 via-orange-600/10 to-slate-900/30'
  },
  director: {
    name: 'Program Director',
    icon: '👔',
    color: 'sahara-gold',
    description: 'Manage programs and operations',
    gradient: 'from-yellow-500/20 via-yellow-600/10 to-slate-900/30'
  },
  sponsor: {
    name: 'Sponsor/Employer',
    icon: '💼',
    color: 'sahara-gold',
    description: 'Support talent development',
    gradient: 'from-yellow-500/20 via-yellow-600/10 to-slate-900/30'
  },
  analyst: {
    name: 'Analyst',
    icon: '📊',
    color: 'defender-blue',
    description: 'Access analytics and insights',
    gradient: 'from-blue-500/20 via-blue-600/10 to-slate-900/30'
  },
  finance: {
    name: 'Finance',
    icon: '💰',
    color: 'defender-blue',
    description: 'Manage billing and revenue operations',
    gradient: 'from-blue-500/20 via-blue-600/10 to-slate-900/30'
  },
};

const VALID_ROLES = Object.keys(PERSONAS);

const MFA_RESEND_COOLDOWN_SECONDS = 60;
const MFA_CODE_EXPIRY_SECONDS = 300; // 5 minutes

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function LoginForm() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roleParam = params?.role as string;
  const urlRole = roleParam && VALID_ROLES.includes(roleParam) ? roleParam : 'student';

  const [currentRole, setCurrentRole] = useState(urlRole);

  useEffect(() => {
    if (urlRole !== currentRole) {
      setCurrentRole(urlRole);
    }
  }, [urlRole, currentRole]);

  const { login, isLoading, isAuthenticated, user, completeMFA, sendMFAChallenge } = useAuth();

  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
    device_fingerprint: 'web-' + Date.now(),
    device_name: 'Web Browser',
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const hasRedirectedRef = useRef(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mfaPending, setMfaPending] = useState<{
    refresh_token: string;
    mfa_method: string;
    mfa_methods_available?: string[];
  } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaMethod, setMfaMethod] = useState<'totp' | 'sms' | 'email' | 'backup_codes'>('totp');
  const [mfaSending, setMfaSending] = useState(false);
  const [mfaSubmitting, setMfaSubmitting] = useState(false);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);
  const [expirySecondsRemaining, setExpirySecondsRemaining] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('remembered_email');
      const savedRememberMe = localStorage.getItem('remember_me') === 'true';
      if (savedEmail && savedRememberMe) {
        setFormData(prev => ({ ...prev, email: savedEmail }));
        setRememberMe(true);
      }
    }
  }, []);

  useEffect(() => {
    if (currentRole && !VALID_ROLES.includes(currentRole)) {
      router.push('/login/student');
    }
  }, [currentRole, router]);

  useEffect(() => {
    if (hasRedirectedRef.current) return;
    if (isLoggingIn || isRedirecting) return;
    if (isLoading) return;

    if (isAuthenticated && user) {
      const redirectTo = searchParams.get('redirect');
      if (redirectTo && (redirectTo.startsWith('/dashboard') || redirectTo.startsWith('/onboarding/'))) {
        hasRedirectedRef.current = true;
        router.push(redirectTo);
      }
    }
  }, [isAuthenticated, user, isLoading, isLoggingIn, isRedirecting, router, searchParams]);

  // Countdown for MFA resend cooldown and code expiry (SMS/email only)
  const isMfaSmsOrEmail = mfaPending && (mfaPending.mfa_method === 'sms' || mfaPending.mfa_method === 'email');
  useEffect(() => {
    if (!isMfaSmsOrEmail) return;
    const interval = setInterval(() => {
      setResendCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      setExpirySecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isMfaSmsOrEmail]);

  // Auto-send MFA code when landing on SMS/email step (backend does not send on login response)
  const mfaSentRef = useRef(false);
  useEffect(() => {
    if (!mfaPending?.refresh_token || (mfaPending.mfa_method !== 'sms' && mfaPending.mfa_method !== 'email')) {
      mfaSentRef.current = false;
      return;
    }
    if (mfaSentRef.current) return;
    mfaSentRef.current = true;
    const method = mfaPending.mfa_method === 'sms' ? 'sms' : 'email';
    sendMFAChallenge(mfaPending.refresh_token, method).catch((e: any) => {
      mfaSentRef.current = false;
      setError(e?.data?.detail || e?.message || 'Failed to send verification code');
    });
  }, [mfaPending?.refresh_token, mfaPending?.mfa_method, sendMFAChallenge]);

  const currentPersona = PERSONAS[currentRole as keyof typeof PERSONAS] || PERSONAS.student;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 handleSubmit called with:', { email: formData.email, password: formData.password?.length ? '[HIDDEN]' : '', currentRole });
    setError(null);
    setIsLoggingIn(true);
    setIsRedirecting(false);

    try {
      console.log('Login attempt:', { email: formData.email, currentRole });

      if (rememberMe && typeof window !== 'undefined') {
        localStorage.setItem('remembered_email', formData.email);
        localStorage.setItem('remember_me', 'true');
      } else if (typeof window !== 'undefined') {
        localStorage.removeItem('remembered_email');
        localStorage.removeItem('remember_me');
      }

      const result = await login(formData);
      console.log('[Login] Login result:', { 
        hasResult: !!result, 
        hasUser: !!(result && 'user' in result && result.user),
        hasToken: !!(result && 'access_token' in result && result.access_token),
        mfaRequired: !!(result && 'mfaRequired' in result && result.mfaRequired),
      });

      // MFA required — show MFA step without throwing (backend sends preferred method: TOTP → email → SMS)
      if (result && 'mfaRequired' in result && result.mfaRequired && result.refresh_token) {
        const backendMethod = (result.mfa_method || 'totp').toLowerCase();
        const available: string[] = Array.isArray((result as any).mfa_methods_available)
          ? (result as any).mfa_methods_available
          : [backendMethod];
        setMfaPending({
          refresh_token: result.refresh_token,
          mfa_method: backendMethod,
          mfa_methods_available: available,
        });
        if (backendMethod === 'sms' || backendMethod === 'email') {
          setMfaMethod(backendMethod === 'sms' ? 'sms' : 'email');
          setResendCooldownSeconds(MFA_RESEND_COOLDOWN_SECONDS);
          setExpirySecondsRemaining(MFA_CODE_EXPIRY_SECONDS);
        } else {
          setMfaMethod((backendMethod === 'backup_codes' ? 'backup_codes' : 'totp') as 'totp' | 'sms' | 'email' | 'backup_codes');
        }
        setMfaCode('');
        setError(null);
        setIsLoggingIn(false);
        return;
      }

      if (!result || !('user' in result) || !result.user) {
        throw new Error('Login failed: No user data received');
      }

      const token = result.access_token || localStorage.getItem('access_token');

      if (!token) {
        throw new Error('Authentication token not found');
      }

      localStorage.setItem('access_token', token);
      console.log('[Login] Token stored, proceeding with redirect logic');

      const redirectTo = searchParams.get('redirect');
      // Route will be determined below based on user roles

      await new Promise(resolve => setTimeout(resolve, 500));

      let updatedUser = result?.user || user;
      console.log('[Login] Initial user from result:', { 
        hasUser: !!result?.user, 
        hasRoles: !!(result?.user?.roles?.length),
        roles: result?.user?.roles 
      });
      console.log('[Login] User from auth hook:', { 
        hasUser: !!user, 
        hasRoles: !!(user?.roles?.length),
        roles: user?.roles 
      });

      let retries = 0;
      while ((!updatedUser || !updatedUser.roles || updatedUser.roles.length === 0) && retries < 5) {
        await new Promise(resolve => setTimeout(resolve, 200));
        updatedUser = user || result?.user;
        retries++;
        console.log(`[Login] Retry ${retries}:`, { 
          hasUser: !!updatedUser, 
          hasRoles: !!(updatedUser?.roles?.length),
          roles: updatedUser?.roles 
        });
      }
      
      // If still no roles, try to fetch user from API
      if (!updatedUser || !updatedUser.roles || updatedUser.roles.length === 0) {
        console.warn('[Login] No roles found, attempting to fetch user from API');
        try {
          const { djangoClient } = await import('@/services/djangoClient');
          const fullUser = await djangoClient.auth.getCurrentUser();
          if (fullUser) {
            updatedUser = fullUser;
            console.log('[Login] Fetched user from API:', { 
              hasRoles: !!(fullUser?.roles?.length),
              roles: fullUser?.roles,
              profiling_complete: fullUser?.profiling_complete
            });
          }
        } catch (fetchError) {
          console.error('[Login] Failed to fetch user from API:', fetchError);
        }
      }

      // Check if user is a student/mentee and needs onboarding
      const userRolesForProfiling = updatedUser?.roles || [];
      const isStudent = userRolesForProfiling.some((r: any) => {
        const roleName = typeof r === 'string' ? r : (r?.role || r?.name || '').toLowerCase();
        return roleName === 'student' || roleName === 'mentee';
      });

      if (isStudent) {
        console.log('[Login] User is student/mentee, checking onboarding status');
        
        // Check email verification status
        const emailVerified = updatedUser?.email_verified || updatedUser?.account_status === 'active';
        const mfaEnabled = updatedUser?.mfa_enabled || false;
        const profilingComplete = updatedUser?.profiling_complete ?? false;
        
        console.log('[Login] Onboarding status:', { emailVerified, mfaEnabled, profilingComplete });
        
        // Step 1: Email verification
        if (!emailVerified) {
          console.log('[Login] Email not verified - redirecting to email verification');
          setIsRedirecting(true);
          hasRedirectedRef.current = true;
          const verifyUrl = redirectTo 
            ? `/auth/verify-email?email=${encodeURIComponent(updatedUser?.email || '')}&redirect=${encodeURIComponent(redirectTo)}`
            : `/auth/verify-email?email=${encodeURIComponent(updatedUser?.email || '')}`;
          window.location.href = verifyUrl;
          return;
        }
        
        // Step 2: MFA setup (optional but recommended)
        // Note: We'll skip MFA requirement for now to not block onboarding
        // Users can set it up later in settings
        
        // Step 3: Profiling
        if (!profilingComplete) {
          console.log('[Login] Profiling not complete - redirecting to AI profiler');
          setIsRedirecting(true);
          hasRedirectedRef.current = true;
          window.location.href = redirectTo || '/onboarding/ai-profiler';
          return;
        }
        
        // Django says complete, optionally verify with FastAPI (non-blocking)
        // Don't block redirect if FastAPI check fails - Django is source of truth
        try {
          const { fastapiClient } = await import('@/services/fastapiClient');
          const fastapiStatus = await fastapiClient.profiling.checkStatus();
          console.log('[Login] FastAPI profiling status:', fastapiStatus);
          
          if (!fastapiStatus.completed) {
            console.log('[Login] FastAPI says not complete - redirecting to profiler');
            setIsRedirecting(true);
            hasRedirectedRef.current = true;
            window.location.href = '/onboarding/ai-profiler';
            return;
          }
          console.log('[Login] FastAPI confirms profiling complete - proceeding to dashboard');
        } catch (fastapiError: any) {
          // FastAPI unavailable or error - trust Django's profiling_complete status
          // Don't block redirect - Django is the source of truth
          console.log('[Login] FastAPI check failed (non-critical):', fastapiError?.message || 'Unknown error');
          console.log('[Login] Django says complete - proceeding to dashboard');
          // Continue to dashboard redirect - don't return here
        }
      } else if ((result as any)?.profiling_required) {
        setIsRedirecting(true);
        hasRedirectedRef.current = true;
        router.push('/profiling');
        return;
      }

      // CRITICAL: Check for mentor role FIRST before any route determination
      // Mentors should NEVER be redirected to student dashboard
      const userRoles = updatedUser?.roles || [];
      const hasMentorRole = userRoles.some((r: any) => {
        const roleName = typeof r === 'string' ? r : (r?.role || r?.name || '').toLowerCase().trim();
        return roleName === 'mentor';
      });
      
      console.log('[Login] Role check:', { 
        hasMentorRole, 
        userRoles, 
        rolesCount: userRoles.length,
        updatedUserRoles: updatedUser?.roles 
      });
      
      // Initialize route variable
      let route: string;
      
      // CRITICAL: If user is a mentor, ALWAYS use mentor dashboard - NO EXCEPTIONS
      if (hasMentorRole) {
        route = '/dashboard/mentor';
        console.log('[Login] ✅ MENTOR DETECTED - FORCING /dashboard/mentor route');
        console.log('[Login] Mentor role check passed - route set to /dashboard/mentor');
      } else {
        // Only determine route for non-mentors
        route = '/dashboard/student'; // Default fallback
        
        let dashboardFromCookie: string | null = null;
        if (typeof document !== 'undefined') {
          const cookies = document.cookie.split(';');
          const dashboardCookie = cookies.find(c => c.trim().startsWith('och_dashboard='));
          if (dashboardCookie) {
            dashboardFromCookie = dashboardCookie.split('=')[1]?.trim() || null;
          }
        }

        if (redirectTo && (redirectTo.startsWith('/dashboard') || redirectTo.startsWith('/students/') || redirectTo.startsWith('/onboarding/'))) {
          route = redirectTo;
          console.log('[Login] Using redirectTo route:', route);
        } else {
          if (!updatedUser || !updatedUser.roles || updatedUser.roles.length === 0) {
            if (dashboardFromCookie) {
              route = dashboardFromCookie;
              console.log('[Login] Using dashboard cookie route:', route);
            } else {
              route = '/dashboard/student';
              console.log('[Login] Using default student route:', route);
            }
          } else {
            // Use getRedirectRoute as the primary routing mechanism
            // This ensures users are routed to the correct dashboard based on their role priority
            route = getRedirectRoute(updatedUser);
            console.log('[Login] Route from getRedirectRoute:', route);
            console.log('[Login] User roles:', updatedUser?.roles);
          }
        }
      }

      console.log('[Login] Final route before validation:', route);
      
      // CRITICAL: Final mentor check - ensure mentors NEVER get student dashboard
      // This is a safety net that runs AFTER all route determination logic
      if (updatedUser?.roles) {
        const hasMentorRoleFinal = updatedUser.roles.some((r: any) => {
          const roleName = typeof r === 'string' ? r : (r?.role || r?.name || '').toLowerCase().trim();
          return roleName === 'mentor';
        });
        
        if (hasMentorRoleFinal) {
          // If mentor detected, FORCE mentor dashboard - override ANY other route
          if (route !== '/dashboard/mentor') {
            console.error('[Login] 🚨 CRITICAL ERROR: Mentor detected but route is:', route);
            console.error('[Login] 🚨 FORCING route to /dashboard/mentor');
            route = '/dashboard/mentor';
          }
        }
      }
      
      // CRITICAL: Check for mentor role AGAIN - mentors should NEVER be associated with student routes
      if (updatedUser?.roles) {
        const hasMentorRoleCheck = updatedUser.roles.some((r: any) => {
          const roleName = typeof r === 'string' ? r : (r?.role || r?.name || '').toLowerCase().trim();
          return roleName === 'mentor';
        });
        if (hasMentorRoleCheck && route === '/dashboard/student') {
          console.error('[Login] 🚨 CRITICAL ERROR - Mentor detected but route is student dashboard!');
          console.error('[Login] 🚨 FORCING route to /dashboard/mentor');
          console.log('[Login] 🚫 Mentors are NEVER associated with student routes');
          route = '/dashboard/mentor';
        }
      }
      
      // Check for other roles that should override default student route
      if (route === '/dashboard/student' && updatedUser?.roles) {
        // Check for sponsor role
        const hasSponsorRole = updatedUser.roles.some((r: any) => {
          const roleName = typeof r === 'string' ? r : (r?.role || r?.name || '').toLowerCase().trim();
          return roleName === 'sponsor_admin' || roleName === 'sponsor';
        });
        if (hasSponsorRole) {
          console.log('[Login] FORCING sponsor route - user has sponsor role but route was student');
          route = '/dashboard/sponsor';
        }
      }

      // Validate the final route
      // Allow /dashboard/* and /students/* routes
      if (!route || (!route.startsWith('/dashboard') && !route.startsWith('/students/'))) {
        console.warn('login: Invalid route generated, using fallback:', route);
        // CRITICAL: Check for mentor role BEFORE falling back to student
        if (updatedUser?.roles) {
          const hasMentorRoleCheck = updatedUser.roles.some((r: any) => {
            const roleName = typeof r === 'string' ? r : (r?.role || r?.name || '').toLowerCase().trim();
            return roleName === 'mentor';
          });
          if (hasMentorRoleCheck) {
            console.log('[Login] Invalid route but user is mentor - using mentor dashboard');
            route = '/dashboard/mentor';
          } else {
            // Only fallback to student if user is NOT a mentor
            route = '/dashboard/student';
          }
        } else {
          // No roles - default to student (but this should rarely happen)
          route = '/dashboard/student';
        }
      }

      // Additional validation for dashboard routes
      if (route.startsWith('/dashboard/')) {
        const { isValidDashboardRoute, getFallbackRoute } = await import('@/utils/redirect');
        const isValid = isValidDashboardRoute(route);
        console.log('[Login] Route validation:', { route, isValid });
        if (!isValid) {
          console.warn('login: Dashboard route validation failed, using fallback for user:', updatedUser?.id);
          // Before falling back, check if user has mentor role
          if (updatedUser?.roles) {
            const hasMentorRole = updatedUser.roles.some((r: any) => {
              const roleName = typeof r === 'string' ? r : (r?.role || r?.name || '').toLowerCase().trim();
              return roleName === 'mentor';
            });
            if (hasMentorRole) {
              console.log('[Login] Route validation failed but user is mentor - using mentor dashboard');
              route = '/dashboard/mentor';
            } else {
              route = getFallbackRoute(updatedUser);
            }
          } else {
            route = getFallbackRoute(updatedUser);
          }
          console.log('[Login] Fallback route:', route);
        }
      }

      // CRITICAL: ABSOLUTE FINAL CHECK - Force mentor route if mentor detected
      // This runs RIGHT BEFORE redirect to ensure nothing can override it
      if (updatedUser?.roles && Array.isArray(updatedUser.roles)) {
        const finalMentorCheck = updatedUser.roles.some((r: any) => {
          const roleName = typeof r === 'string' ? r : (r?.role || r?.name || r?.role_display_name || '').toLowerCase().trim();
          const isMentor = roleName === 'mentor';
          if (isMentor) {
            console.log('[Login] 🔍 FINAL CHECK: Mentor role found:', { roleName, role: r });
          }
          return isMentor;
        });
        
        if (finalMentorCheck) {
          if (route !== '/dashboard/mentor') {
            console.error('[Login] 🚨🚨🚨 CRITICAL: Mentor detected in FINAL CHECK but route is:', route);
            console.error('[Login] 🚨🚨🚨 FORCING route to /dashboard/mentor');
            route = '/dashboard/mentor';
          } else {
            console.log('[Login] ✅ FINAL CHECK: Mentor route confirmed as /dashboard/mentor');
          }
        }
      }

      // Before redirect: if destination requires 2 MFA, check now so we never show dashboard URL with "Verifying..."
      const ROUTES_REQUIRING_TWO_MFA = ['/dashboard/director', '/dashboard/mentor', '/dashboard/admin', '/dashboard/finance', '/dashboard/analyst'];
      const needsMfaCheck = ROUTES_REQUIRING_TWO_MFA.some((r) => route === r || route.startsWith(r + '/'));
      if (needsMfaCheck) {
        try {
          const { djangoClient } = await import('@/services/djangoClient');
          const res = await djangoClient.auth.getMFAMethods();
          const count = (res.methods || []).length;
          if (count < 2) {
            route = '/dashboard/mfa-required';
            if (typeof window !== 'undefined') window.sessionStorage.removeItem('mfa_compliant');
          } else {
            if (typeof window !== 'undefined') window.sessionStorage.setItem('mfa_compliant', '1');
          }
        } catch (_e) {
          route = '/dashboard/mfa-required';
          if (typeof window !== 'undefined') window.sessionStorage.removeItem('mfa_compliant');
        }
      }
      
      console.log('[Login] Redirecting to:', route);
      console.log('[Login] User object:', { 
        id: updatedUser?.id, 
        email: updatedUser?.email, 
        roles: updatedUser?.roles,
        rolesCount: updatedUser?.roles?.length || 0
      });
      
      setIsRedirecting(true);
      setIsLoggingIn(false); // Stop showing "Signing in..." 
      hasRedirectedRef.current = true;
      
      // Force immediate redirect - use window.location.replace (doesn't add to history)
      console.log('[Login] Executing immediate redirect to:', route);
      console.log('[Login] Current pathname:', typeof window !== 'undefined' ? window.location.pathname : 'N/A');
      
      // Use both methods to ensure redirect happens
      if (typeof window !== 'undefined') {
        try {
          console.log('[Login] Attempting window.location.replace to:', route);
          window.location.replace(route);
          // If we reach here, redirect might have been blocked - try href as backup
          setTimeout(() => {
            if (window.location.pathname.includes('/login/')) {
              console.warn('[Login] window.location.replace may have failed, trying window.location.href');
              window.location.href = route;
            }
          }, 100);
        } catch (redirectError) {
          console.error('[Login] window.location.replace failed:', redirectError);
          window.location.href = route;
        }
      }
      
      // Fallback: If still on login page after 1 second, force redirect
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath.includes('/login/')) {
            console.warn('[Login] Still on login page after 1s, forcing redirect with router to:', route);
            router.replace(route);
          }
        }
      }, 1000);

    } catch (err: any) {
      const isServiceUnavailable =
        err?.code === 'BAD_GATEWAY' ||
        err?.status === 502 ||
        err?.message?.includes('temporarily unavailable');
      if (isServiceUnavailable) {
        console.warn('[Login] Backend temporarily unavailable:', err?.message);
      } else {
        console.error('[Login] Error during login flow:', err);
      }
      setIsLoggingIn(false);
      setIsRedirecting(false);
      
      // Even if there's an error, try to redirect if we have a user
      if (user && user.roles && user.roles.length > 0) {
        console.log('[Login] Error occurred but user is authenticated, attempting redirect');
        let fallbackRoute = getRedirectRoute(user);
        
        // CRITICAL: Ensure mentors NEVER get student dashboard, even in error cases
        if (user.roles && Array.isArray(user.roles)) {
          const hasMentorRole = user.roles.some((r: any) => {
            const roleName = typeof r === 'string' ? r : (r?.role || r?.name || '').toLowerCase().trim();
            return roleName === 'mentor';
          });
          if (hasMentorRole && fallbackRoute === '/dashboard/student') {
            console.error('[Login] 🚨 CRITICAL: Mentor detected in error fallback but route is student dashboard!');
            fallbackRoute = '/dashboard/mentor';
          }
        }
        
        console.log('[Login] Fallback redirect route:', fallbackRoute);
        setTimeout(() => {
          window.location.replace(fallbackRoute);
        }, 500);
        return; // Exit early to prevent error display
      }
      
      // Also check if login was successful but error occurred during redirect logic
      const token = localStorage.getItem('access_token');
      if (token) {
        console.log('[Login] Token exists, user might be authenticated, attempting to fetch user and redirect');
        try {
          const { djangoClient } = await import('@/services/djangoClient');
          const currentUser = await djangoClient.auth.getCurrentUser();
          if (currentUser && currentUser.roles && currentUser.roles.length > 0) {
            let redirectRoute = getRedirectRoute(currentUser);
            
            // CRITICAL: Ensure mentors NEVER get student dashboard, even in error cases
            if (currentUser.roles && Array.isArray(currentUser.roles)) {
              const hasMentorRole = currentUser.roles.some((r: any) => {
                const roleName = typeof r === 'string' ? r : (r?.role || r?.name || '').toLowerCase().trim();
                return roleName === 'mentor';
              });
              if (hasMentorRole && redirectRoute === '/dashboard/student') {
                console.error('[Login] 🚨 CRITICAL: Mentor detected in token fallback but route is student dashboard!');
                redirectRoute = '/dashboard/mentor';
              }
            }
            
            console.log('[Login] Redirecting authenticated user to:', redirectRoute);
            setTimeout(() => {
              window.location.replace(redirectRoute);
            }, 500);
            return; // Exit early
          }
        } catch (fetchErr) {
          console.error('[Login] Failed to fetch user for redirect:', fetchErr);
        }
      }

      let message = 'Login failed. Please check your credentials.';

      if (err?.mfa_required && err?.refresh_token) {
        const backendMethod = (err.mfa_method || 'totp').toLowerCase();
        const available: string[] = Array.isArray(err.mfa_methods_available) ? err.mfa_methods_available : [backendMethod];
        setMfaPending({
          refresh_token: err.refresh_token,
          mfa_method: backendMethod,
          mfa_methods_available: available,
        });
        if (backendMethod === 'sms' || backendMethod === 'email') {
          setMfaMethod(backendMethod === 'sms' ? 'sms' : 'email');
          setResendCooldownSeconds(MFA_RESEND_COOLDOWN_SECONDS);
          setExpirySecondsRemaining(MFA_CODE_EXPIRY_SECONDS);
        } else {
          setMfaMethod((backendMethod === 'backup_codes' ? 'backup_codes' : 'totp') as 'totp' | 'sms' | 'email' | 'backup_codes');
        }
        setMfaCode('');
        setError(null);
        setIsLoggingIn(false);
        return;
      } else if (err?.data?.detail) {
        message = err.data.detail;
        // Check for connection errors in detail
        if (message.includes('Cannot connect') || message.includes('backend server')) {
          message = 'Cannot connect to backend server. Please ensure the Django API is running on port 8000.';
        } else if (message === 'Invalid credentials') {
          // Provide more helpful message for invalid credentials
          message = 'Invalid email or password. Please check your credentials and try again.';
        }
      } else if (err?.data?.error) {
        message = err.data.error;
      } else if (err?.detail) {
        message = err.detail;
      } else if (err?.message) {
        message = err.message;
        if (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('ECONNREFUSED') || err.message.includes('Cannot connect')) {
          message = 'Cannot connect to backend server. Please ensure the Django API is running on port 8000.';
        }
      }

      if (!isServiceUnavailable) {
        console.error('Login error:', err);
      }
      setError(message);
    }
  };

  const switchRole = (newRole: string) => {
    if (newRole === currentRole) {
      return;
    }

    setCurrentRole(newRole);
    const redirectTo = searchParams.get('redirect');
    let newUrl = `/login/${newRole}`;
    if (redirectTo) {
      newUrl += `?redirect=${encodeURIComponent(redirectTo)}`;
    }
    router.replace(newUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br ${currentPersona.gradient} rounded-full blur-3xl opacity-20 animate-pulse`} />
        <div className={`absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br ${currentPersona.gradient} rounded-full blur-3xl opacity-20 animate-pulse delay-1000`} />
      </div>
      <div className="w-full max-w-5xl relative z-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Side - Hero Section */}
          <div className="hidden md:block space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600/20 rounded-xl">
                  <Shield className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white tracking-tight">
                    Ongoza CyberHub
                  </h1>
                  <p className="text-slate-400 text-sm">Elite Cybersecurity Training</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500/10 to-blue-400/5 border border-blue-500/20 rounded-xl">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">AI-Powered Learning</h3>
                    <p className="text-slate-300 text-sm">Personalized pathways matched to your goals</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-500/10 to-green-400/5 border border-green-500/20 rounded-xl">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Lock className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Real-World Missions</h3>
                    <p className="text-slate-300 text-sm">Hands-on experience with industry tools</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-500/10 to-yellow-400/5 border border-yellow-500/20 rounded-xl">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <ArrowRight className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Career Ready</h3>
                    <p className="text-slate-300 text-sm">Build your portfolio and land your dream role</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <Card className="p-8 shadow-2xl border border-slate-700/50 bg-slate-900/95 backdrop-blur-sm">
          {/* Mobile Header */}
          <div className="md:hidden text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-400/20 rounded-lg">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="text-2xl font-black text-white">Ongoza CyberHub</h1>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r ${currentPersona.gradient} border border-slate-600/30`}>
              <span className="text-lg">{currentPersona.icon}</span>
              <span className="text-sm font-medium text-slate-300">{currentPersona.name} Portal</span>
            </div>
          </div>

          {/* Desktop Role Badge */}
          <div className="hidden md:flex items-center justify-between mb-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r ${currentPersona.gradient} border border-slate-600/30`}>
              <span className="text-lg">{currentPersona.icon}</span>
              <span className="text-sm font-medium text-slate-300">{currentPersona.name} Portal</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-slate-400 text-sm mb-6">Sign in to continue your cybersecurity journey</p>

          {error && (
            <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-lg" role="alert">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {isRedirecting && !error && (
            <div className="mb-5 p-4 bg-green-500/10 border border-green-500/30 rounded-lg" role="status">
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <div className="animate-spin h-4 w-4 border-2 border-green-400 border-t-transparent rounded-full"></div>
                <span>Login successful! Redirecting to your dashboard...</span>
              </div>
            </div>
          )}

          {mfaPending ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Verify your identity</h2>
                <p className="text-slate-400 text-sm">
                  {mfaMethod === 'totp'
                    ? 'Enter the code from your authenticator app.'
                    : mfaMethod === 'backup_codes'
                    ? 'Enter one of your backup codes.'
                    : mfaMethod === 'sms'
                    ? 'Enter the code we sent to your phone.'
                    : 'Enter the code we sent to your email.'}
                </p>
              </div>
              {(mfaMethod === 'sms' || mfaMethod === 'email') && (
                <div className="space-y-2">
                  <p className="text-slate-400 text-xs">
                    {expirySecondsRemaining > 0
                      ? `Code expires in ${formatCountdown(expirySecondsRemaining)}`
                      : 'Code expired. Request a new code below.'}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full py-2 rounded-lg border-slate-600 text-slate-300"
                    disabled={mfaSending || resendCooldownSeconds > 0}
                    onClick={async () => {
                      setError(null);
                      setMfaSending(true);
                      try {
                        await sendMFAChallenge(mfaPending.refresh_token, mfaMethod === 'sms' ? 'sms' : 'email');
                        setError(null);
                        setResendCooldownSeconds(MFA_RESEND_COOLDOWN_SECONDS);
                        setExpirySecondsRemaining(MFA_CODE_EXPIRY_SECONDS);
                      } catch (e: any) {
                        setError(e?.data?.detail || e?.message || 'Failed to send code');
                      } finally {
                        setMfaSending(false);
                      }
                    }}
                  >
                    {mfaSending
                      ? 'Sending...'
                      : resendCooldownSeconds > 0
                        ? `Resend code (${formatCountdown(resendCooldownSeconds)})`
                        : mfaMethod === 'sms'
                          ? 'Resend code via SMS'
                          : 'Resend code via email'}
                  </Button>
                  {(() => {
                    const available = mfaPending.mfa_methods_available ?? [mfaPending.mfa_method];
                    const others = available.filter((m) => m !== mfaMethod && (m === 'totp' || m === 'email' || m === 'sms'));
                    if (others.length === 0) return null;
                    const labels: Record<string, string> = { totp: 'Use authenticator app', email: 'Use email instead', sms: 'Use SMS instead' };
                    return (
                      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                        {others.map((method) => (
                          <button
                            key={method}
                            type="button"
                            className="text-sm text-och-steel hover:text-och-mint transition-colors disabled:opacity-50"
                            disabled={mfaSending || resendCooldownSeconds > 0}
                            onClick={async () => {
                              setMfaCode('');
                              setError(null);
                              setMfaMethod(method as 'totp' | 'sms' | 'email');
                              if (method === 'email' || method === 'sms') {
                                setMfaSending(true);
                                try {
                                  await sendMFAChallenge(mfaPending.refresh_token, method);
                                  setResendCooldownSeconds(MFA_RESEND_COOLDOWN_SECONDS);
                                  setExpirySecondsRemaining(MFA_CODE_EXPIRY_SECONDS);
                                } catch (e: any) {
                                  setError(e?.data?.detail || e?.message || 'Failed to send code');
                                } finally {
                                  setMfaSending(false);
                                }
                              }
                            }}
                          >
                            {labels[method] ?? method}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!mfaCode.trim() || !mfaPending) return;
                  setError(null);
                  setMfaSubmitting(true);
                  try {
                    const result = await completeMFA({
                      refresh_token: mfaPending.refresh_token,
                      code: mfaCode.trim(),
                      method: mfaMethod,
                    });
                    setMfaPending(null);
                    setMfaCode('');
                    setResendCooldownSeconds(0);
                    setExpirySecondsRemaining(0);
                    setIsRedirecting(true);
                    const { getRedirectRoute } = await import('@/utils/redirect');
                    const u = result?.user;
                    const roles = (u as any)?.roles || [];
                    const roleNames = roles.map((r: any) => typeof r === 'string' ? r : (r?.role || r?.name || ''));
                    const needsProfiling = (u as any)?.profiling_complete === false && roleNames.some((name: string) => ['student', 'mentee'].includes(name));
                    if (u && needsProfiling) {
                      router.push('/profiling');
                    } else {
                      router.push(u ? getRedirectRoute(u) : '/dashboard/student');
                    }
                  } catch (e: any) {
                    setError(e?.data?.detail || e?.message || 'Invalid code');
                  } finally {
                    setMfaSubmitting(false);
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label htmlFor="mfa-code" className="text-sm font-medium text-slate-300">
                    Verification code
                  </label>
                  <input
                    id="mfa-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-400"
                    placeholder={mfaMethod === 'backup_codes' ? 'Backup code' : '000000'}
                  />
                </div>
                {((mfaPending.mfa_methods_available?.includes('totp')) ?? (mfaPending.mfa_method === 'totp')) && (mfaMethod === 'totp' || mfaMethod === 'backup_codes') && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setMfaMethod('totp')}
                        className={`px-3 py-1.5 text-sm rounded-lg ${mfaMethod === 'totp' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'border border-slate-600 text-slate-400 hover:text-slate-300'}`}
                      >
                        Authenticator app
                      </button>
                      <button
                        type="button"
                        onClick={() => setMfaMethod('backup_codes')}
                        className={`px-3 py-1.5 text-sm rounded-lg ${mfaMethod === 'backup_codes' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'border border-slate-600 text-slate-400 hover:text-slate-300'}`}
                      >
                        Backup code
                      </button>
                    </div>
                    {(() => {
                      const available = mfaPending.mfa_methods_available ?? [mfaPending.mfa_method];
                      const others = available.filter((m) => m === 'email' || m === 'sms');
                      if (others.length === 0) return null;
                      const labels: Record<string, string> = { email: 'Use email instead', sms: 'Use SMS instead' };
                      return (
                        <div className="flex flex-wrap justify-center gap-x-4">
                          {others.map((method) => (
                            <button
                              key={method}
                              type="button"
                              className="text-sm text-och-steel hover:text-och-mint transition-colors"
                              onClick={async () => {
                                setMfaCode('');
                                setError(null);
                                setMfaMethod(method as 'email' | 'sms');
                                setMfaSending(true);
                                try {
                                  await sendMFAChallenge(mfaPending.refresh_token, method);
                                  setResendCooldownSeconds(MFA_RESEND_COOLDOWN_SECONDS);
                                  setExpirySecondsRemaining(MFA_CODE_EXPIRY_SECONDS);
                                } catch (e: any) {
                                  setError(e?.data?.detail || e?.message || 'Failed to send code');
                                } finally {
                                  setMfaSending(false);
                                }
                              }}
                            >
                              {labels[method]}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={!mfaCode.trim() || mfaSubmitting}
                    variant="defender"
                    className="flex-1 py-3"
                  >
                    {mfaSubmitting ? 'Verifying...' : 'Verify'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="py-3 border-slate-600 text-slate-300"
                    onClick={() => { setMfaPending(null); setMfaCode(''); setError(null); setResendCooldownSeconds(0); setExpirySecondsRemaining(0); }}
                  >
                    Back
                  </Button>
                </div>
              </form>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-white placeholder-slate-400"
                placeholder="your.email@example.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 rounded-lg bg-slate-800 border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-white placeholder-slate-400"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 focus:ring-2 cursor-pointer"
                />
                <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                  Remember me
                </span>
              </label>

              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                Forgot Password?
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading || isLoggingIn || isRedirecting}
              variant="defender"
              className="w-full py-3 text-base font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/20 transition-all"
            >
              {isRedirecting ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Redirecting...
                </span>
              ) : isLoggingIn ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
          )}

          {!mfaPending && (
          <>
          {/* Google OAuth Button */}
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-950 text-slate-500">or</span>
              </div>
            </div>
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full py-3 text-base rounded-lg border-slate-600 text-slate-300 hover:border-slate-500 hover:text-slate-200 transition-all flex items-center justify-center gap-3"
                onClick={() => {
                  window.location.href = `http://localhost:8000/api/v1/auth/google/initiate?role=${currentRole}`;
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-600/20">
            <p className="text-center text-sm text-slate-400 mb-3">
              Don't have an account?
            </p>
            <Button
              variant="outline"
              className="w-full py-3 text-base rounded-lg border-slate-600 text-slate-300 hover:border-slate-500 hover:text-slate-200 transition-all"
              onClick={() => router.push(`/signup/${currentRole}`)}
            >
              Create Account
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-600/20">
            <p className="text-xs text-slate-500/70 mb-3 text-center">Switch Role:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {Object.entries(PERSONAS).map(([key, { name, icon }]) => (
                <button
                  key={key}
                  onClick={() => switchRole(key)}
                  className={`px-3 py-1.5 text-xs border rounded-lg transition-all ${
                    currentRole === key
                      ? 'border-blue-500 text-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                      : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300 bg-slate-800'
                  }`}
                >
                  {icon} {name}
                </button>
              ))}
            </div>
          </div>
          </>
          )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function RoleLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
