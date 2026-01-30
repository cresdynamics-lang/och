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

  const { login, isLoading, isAuthenticated, user } = useAuth();

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
      if (redirectTo && redirectTo.startsWith('/dashboard')) {
        hasRedirectedRef.current = true;
        router.push(redirectTo);
      }
    }
  }, [isAuthenticated, user, isLoading, isLoggingIn, isRedirecting, router, searchParams]);

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

      if (!result || !result.user) {
        throw new Error('Login failed: No user data received');
      }

      const token = result.access_token || localStorage.getItem('access_token');

      if (!token) {
        throw new Error('Authentication token not found');
      }

      localStorage.setItem('access_token', token);

      const userRoles = result?.user?.roles || []
      const isStudent = userRoles.some((r: any) => {
        const roleName = typeof r === 'string' ? r : (r?.role || r?.name || '').toLowerCase()
        return roleName === 'student' || roleName === 'mentee'
      })

      if (isStudent) {
        try {
          const { fastapiClient } = await import('@/services/fastapiClient')
          const fastapiStatus = await fastapiClient.profiling.checkStatus()

          if (!fastapiStatus.completed) {
            setIsRedirecting(true)
            hasRedirectedRef.current = true
            window.location.href = '/onboarding/ai-profiler'
            return
          }
        } catch (fastapiError: any) {
          if ((result as any)?.profiling_required) {
            setIsRedirecting(true)
            hasRedirectedRef.current = true
            window.location.href = '/onboarding/ai-profiler'
            return
          }
        }
      } else if ((result as any)?.profiling_required) {
        setIsRedirecting(true)
        hasRedirectedRef.current = true
        router.push('/profiling')
        return
      }

      const redirectTo = searchParams.get('redirect');
      let route: string = '/dashboard/student';

      await new Promise(resolve => setTimeout(resolve, 500));

      let updatedUser = result?.user || user;

      let retries = 0;
      while ((!updatedUser || !updatedUser.roles || updatedUser.roles.length === 0) && retries < 5) {
        await new Promise(resolve => setTimeout(resolve, 200));
        updatedUser = user || result?.user;
        retries++;
      }

      let dashboardFromCookie: string | null = null;
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        const dashboardCookie = cookies.find(c => c.trim().startsWith('och_dashboard='));
        if (dashboardCookie) {
          dashboardFromCookie = dashboardCookie.split('=')[1]?.trim() || null;
        }
      }

      if (redirectTo && (redirectTo.startsWith('/dashboard') || redirectTo.startsWith('/students/'))) {
        route = redirectTo;
      } else {
        if (!updatedUser || !updatedUser.roles || updatedUser.roles.length === 0) {
          if (dashboardFromCookie) {
            route = dashboardFromCookie;
          } else {
            route = '/dashboard/student';
          }
        } else {
          // Use getRedirectRoute as the primary routing mechanism
          // This ensures users are routed to the correct dashboard based on their role priority
          route = getRedirectRoute(updatedUser);
        }
      }

      // Validate the final route
      if (!route || (!route.startsWith('/dashboard') && !route.startsWith('/students/'))) {
        console.warn('login: Invalid route generated, using fallback:', route);
        route = '/dashboard/student';
      }

      // Additional validation for dashboard routes
      if (route.startsWith('/dashboard/')) {
        const { isValidDashboardRoute, getFallbackRoute } = await import('@/utils/redirect');
        if (!isValidDashboardRoute(route)) {
          console.warn('login: Dashboard route validation failed, using fallback for user:', updatedUser?.id);
          route = getFallbackRoute(updatedUser);
        }
      }

      setIsRedirecting(true);
      hasRedirectedRef.current = true;
      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.href = route;

    } catch (err: any) {
      setIsLoggingIn(false);
      setIsRedirecting(false);

      let message = 'Login failed. Please check your credentials.';

      if (err?.mfa_required) {
        message = 'Multi-factor authentication is required. Please contact support to set up MFA.';
      } else if (err?.data?.detail) {
        message = err.data.detail;
      } else if (err?.data?.error) {
        message = err.data.error;
      } else if (err?.detail) {
        message = err.detail;
      } else if (err?.message) {
        message = err.message;
        if (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('ECONNREFUSED')) {
          message = 'Cannot connect to backend server. Please ensure the Django API is running on port 8000.';
        }
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
