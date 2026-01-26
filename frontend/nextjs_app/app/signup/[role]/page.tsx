'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { djangoClient } from '@/services/djangoClient';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import SSOButtons from '@/components/SSOButtons';
import { GoogleSignInButton } from '../../login/[role]/components/GoogleSignInButton';
import { Shield, Sparkles, Lock, Mail, User, Globe, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { SignupRequest } from '@/services/types';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

const PERSONAS = {
  student: { 
    name: 'Student', 
    icon: '🎓', 
    description: 'Begin your cyber defense journey',
    gradient: 'from-och-defender/20 via-och-mint/10 to-och-defender/20'
  },
  mentor: { 
    name: 'Mentor', 
    icon: '👨‍🏫', 
    description: 'Guide the next generation',
    gradient: 'from-och-gold/20 via-och-mint/10 to-och-gold/20'
  },
  director: { 
    name: 'Program Director', 
    icon: '👔', 
    description: 'Manage programs and operations',
    gradient: 'from-och-gold/20 via-och-mint/10 to-och-gold/20'
  },
  sponsor: { 
    name: 'Sponsor/Employer', 
    icon: '💼', 
    description: 'Support talent development',
    gradient: 'from-och-gold/20 via-och-mint/10 to-och-gold/20'
  },
  analyst: { 
    name: 'Analyst', 
    icon: '📊', 
    description: 'Access analytics and insights',
    gradient: 'from-och-defender/20 via-och-mint/10 to-och-defender/20'
  },
  admin: { 
    name: 'Admin', 
    icon: '⚡', 
    description: 'Full platform access',
    gradient: 'from-och-gold/20 via-och-orange/10 to-och-gold/20'
  },
};

const VALID_ROLES = Object.keys(PERSONAS);

export default function RoleSignupPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const role = (params?.role as string) || 'student';
  
  const [formData, setFormData] = useState<SignupRequest>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    country: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: 'en',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    if (role && !VALID_ROLES.includes(role)) {
      router.push('/signup/student');
    }
  }, [role, router]);

  useEffect(() => {
    // Calculate password strength
    if (formData.password) {
      let strength = 0;
      if (formData.password.length >= 8) strength++;
      if (formData.password.length >= 12) strength++;
      if (/[A-Z]/.test(formData.password)) strength++;
      if (/[a-z]/.test(formData.password)) strength++;
      if (/[0-9]/.test(formData.password)) strength++;
      if (/[^A-Za-z0-9]/.test(formData.password)) strength++;
      setPasswordStrength(Math.min(strength, 4));
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password]);

  const currentPersona = PERSONAS[role as keyof typeof PERSONAS] || PERSONAS.student;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!formData.email?.trim()) {
        setError('Email is required');
        setIsLoading(false);
        return;
      }
      if (!formData.first_name?.trim()) {
        setError('First name is required');
        setIsLoading(false);
        return;
      }
      if (!formData.last_name?.trim()) {
        setError('Last name is required');
        setIsLoading(false);
        return;
      }

      if (formData.password?.trim() && formData.password.trim().length < 8) {
        setError('Password must be at least 8 characters long');
        setIsLoading(false);
        return;
      }

      const signupData: any = {
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        timezone: formData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: formData.language || 'en',
      };

      if (formData.password?.trim()) {
        signupData.password = formData.password.trim();
        signupData.passwordless = false;
      } else {
        signupData.passwordless = true;
      }
      
      if (formData.country?.trim()) {
        const countryCode = formData.country.trim().toUpperCase().substring(0, 2);
        if (countryCode.length === 2) {
          signupData.country = countryCode;
        }
      }

      const response = await djangoClient.auth.signup(signupData);
      if (response?.detail || response?.user_id) {
        // Redirect to AI Profiler for students
        if (role === 'student') {
          router.push('/onboarding/ai-profiler');
        } else {
          router.push(`/login/${role}?registered=true`);
        }
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      let errorMessage = 'Signup failed. Please try again.';
      
      if (err?.data?.detail) {
        errorMessage = err.data.detail;
      } else if (err?.data) {
        const fieldErrors = Object.entries(err.data)
          .map(([field, messages]: [string, any]) => {
            const msg = Array.isArray(messages) ? messages.join(', ') : String(messages);
            const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `${fieldName}: ${msg}`;
          })
          .join('\n');
        errorMessage = fieldErrors || errorMessage;
      } else if (err?.response?.data) {
        const responseData = err.response.data;
        if (responseData.detail) {
          errorMessage = responseData.detail;
        } else if (typeof responseData === 'object') {
          const fieldErrors = Object.entries(responseData)
            .map(([field, messages]: [string, any]) => {
              const msg = Array.isArray(messages) ? messages.join(', ') : String(messages);
              const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              return `${fieldName}: ${msg}`;
            })
            .join('\n');
          errorMessage = fieldErrors || errorMessage;
        }
      } else if (err?.detail) {
        errorMessage = err.detail;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = (newRole: string) => {
    router.push(`/signup/${newRole}`);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-och-steel/30';
    if (passwordStrength === 1) return 'bg-och-orange';
    if (passwordStrength === 2) return 'bg-och-orange';
    if (passwordStrength === 3) return 'bg-och-gold';
    return 'bg-och-mint';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-och-midnight via-slate-950 to-och-midnight flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br ${currentPersona.gradient} rounded-full blur-3xl opacity-20 animate-pulse`} />
        <div className={`absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br ${currentPersona.gradient} rounded-full blur-3xl opacity-20 animate-pulse delay-1000`} />
      </div>

      <div className="w-full max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid md:grid-cols-2 gap-8 items-center"
        >
          {/* Left Side - Hero Section */}
          <div className="hidden md:block space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-och-defender to-och-mint/20 rounded-xl">
                  <Shield className="w-8 h-8 text-och-mint" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white tracking-tight">
                    Join the Mission
                  </h1>
                  <p className="text-och-steel text-sm">Start Your Cybersecurity Journey</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-och-defender/10 to-och-mint/5 border border-och-defender/20 rounded-xl">
                  <div className="p-2 bg-och-defender/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-och-mint" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">AI-Powered Matching</h3>
                    <p className="text-och-steel text-sm">Get matched to the perfect track for your goals</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-och-defender/10 to-och-mint/5 border border-och-defender/20 rounded-xl">
                  <div className="p-2 bg-och-mint/20 rounded-lg">
                    <Lock className="w-5 h-5 text-och-mint" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Hands-On Learning</h3>
                    <p className="text-och-steel text-sm">Real-world missions and practical experience</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-och-defender/10 to-och-mint/5 border border-och-defender/20 rounded-xl">
                  <div className="p-2 bg-och-gold/20 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-och-gold" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Career Ready</h3>
                    <p className="text-och-steel text-sm">Build your portfolio and launch your career</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Side - Signup Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full"
          >
            <Card className="p-8 shadow-2xl border border-och-defender/30 bg-och-midnight/95 backdrop-blur-sm">
              {/* Mobile Header */}
              <div className="md:hidden text-center mb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-och-defender to-och-mint/20 rounded-lg">
                    <Shield className="w-6 h-6 text-och-mint" />
                  </div>
                  <h1 className="text-2xl font-black text-white">Join the Mission</h1>
                </div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r ${currentPersona.gradient} border border-och-steel/30`}>
                  <span className="text-lg">{currentPersona.icon}</span>
                  <span className="text-sm font-medium text-och-steel">{currentPersona.name} Portal</span>
                </div>
              </div>

              {/* Desktop Role Badge */}
              <div className="hidden md:flex items-center justify-between mb-6">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r ${currentPersona.gradient} border border-och-steel/30`}>
                  <span className="text-lg">{currentPersona.icon}</span>
                  <span className="text-sm font-medium text-och-steel">{currentPersona.name} Portal</span>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Create Your Account</h2>
              <p className="text-och-steel text-sm mb-6">Start your cybersecurity journey today</p>

              {/* Success Message */}
              {searchParams.get('registered') === 'true' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 p-4 bg-och-mint/10 border border-och-mint/30 rounded-lg"
                >
                  <p className="text-och-mint text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Account created successfully! Please sign in.
                  </p>
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 p-4 bg-och-orange/10 border border-och-orange/30 rounded-lg"
                  role="alert"
                >
                  <p className="text-och-orange text-sm flex items-center gap-2">
                    <span className="font-semibold">⚠️</span>
                    {error}
                  </p>
                </motion.div>
              )}

              {/* Google Sign-In Button */}
              <div className="mb-6">
                <GoogleSignInButton role={role} />
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-och-steel/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-och-midnight text-och-steel">or continue with email</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="first_name"
                      className="text-sm font-medium text-och-steel flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      First Name
                    </label>
                    <input
                      id="first_name"
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-och-midnight border border-och-steel/30 focus:border-och-mint focus:ring-2 focus:ring-och-mint/20 transition-all text-white placeholder-och-steel/50"
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="last_name"
                      className="text-sm font-medium text-och-steel flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Last Name
                    </label>
                    <input
                      id="last_name"
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-och-midnight border border-och-steel/30 focus:border-och-mint focus:ring-2 focus:ring-och-mint/20 transition-all text-white placeholder-och-steel/50"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-och-steel flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-och-midnight border border-och-steel/30 focus:border-och-mint focus:ring-2 focus:ring-och-mint/20 transition-all text-white placeholder-och-steel/50"
                    placeholder="your.email@example.com"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-och-steel flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 pr-12 rounded-lg bg-och-midnight border border-och-steel/30 focus:border-och-mint focus:ring-2 focus:ring-och-mint/20 transition-all text-white placeholder-och-steel/50"
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-och-steel hover:text-och-mint transition-colors p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="space-y-2">
                      <div className="flex gap-1 h-1.5">
                        {[0, 1, 2, 3].map((level) => (
                          <div
                            key={level}
                            className={`flex-1 rounded-full transition-all ${
                              level < passwordStrength
                                ? getPasswordStrengthColor()
                                : 'bg-och-steel/20'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-och-steel">
                        {passwordStrength === 0 && 'Password must be at least 8 characters'}
                        {passwordStrength === 1 && 'Weak password'}
                        {passwordStrength === 2 && 'Fair password'}
                        {passwordStrength === 3 && 'Good password'}
                        {passwordStrength === 4 && 'Strong password'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <label
                    htmlFor="country"
                    className="text-sm font-medium text-och-steel flex items-center gap-2"
                  >
                    <Globe className="w-4 h-4" />
                    Country (Optional)
                  </label>
                  <input
                    id="country"
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 rounded-lg bg-och-midnight border border-och-steel/30 focus:border-och-mint focus:ring-2 focus:ring-och-mint/20 transition-all text-white placeholder-och-steel/50 uppercase"
                    placeholder="BW"
                    maxLength={2}
                  />
                  <p className="text-xs text-och-steel">
                    2-letter ISO code (e.g., BW, US, KE)
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  variant="defender"
                  className="w-full py-3 text-base font-semibold rounded-lg shadow-lg hover:shadow-och-defender/20 transition-all"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Creating Account...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>

              {/* Sign In Link */}
              <div className="mt-6 pt-6 border-t border-och-steel/20">
                <p className="text-center text-sm text-och-steel mb-3">
                  Already have an account?
                </p>
                <Button
                  variant="outline"
                  className="w-full py-3 text-base rounded-lg border-och-steel/30 hover:border-och-mint hover:text-och-mint transition-all"
                  onClick={() => router.push(`/login/${role}`)}
                >
                  Sign In
                </Button>
              </div>

              {/* Role Switching - Compact */}
              <div className="mt-6 pt-6 border-t border-och-steel/20">
                <p className="text-xs text-och-steel/70 mb-3 text-center">Sign up as:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {Object.entries(PERSONAS).map(([key, { name, icon }]) => (
                    <button
                      key={key}
                      onClick={() => switchRole(key)}
                      className={`px-3 py-1.5 text-xs border rounded-lg transition-all ${
                        role === key
                          ? 'border-och-mint text-och-mint bg-och-mint/10 shadow-lg shadow-och-mint/20'
                          : 'border-och-steel/30 text-och-steel hover:border-och-mint/50 hover:text-och-mint/80 bg-och-midnight'
                      }`}
                    >
                      {icon} {name}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
