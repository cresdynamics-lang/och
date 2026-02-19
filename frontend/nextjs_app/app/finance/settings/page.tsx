"use client"

import { Suspense } from 'react';
import { Card } from "@/components/ui/Card";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card-enhanced";
import { useAuth } from '@/hooks/useAuth';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { User, Shield, Mail, Phone } from 'lucide-react';

function SettingsContent() {
  const { user } = useAuth();

  return (
    <div className="w-full max-w-4xl py-6 px-4 sm:px-6 lg:px-8 mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>
      
      <div className="space-y-6">
        {/* Profile Settings */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-slate-400">Email</label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4 text-slate-500" />
                <p className="text-white">{user?.email || 'Not set'}</p>
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400">Name</label>
              <p className="text-white mt-1">{user?.first_name || user?.last_name ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim() : 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm text-slate-400">Role</label>
              <p className="text-white mt-1">Finance Director</p>
            </div>
          </CardContent>
        </Card>

        {/* MFA Settings */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="w-5 h-5" />
              Multi-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-4">
                Enhance your account security by enabling multi-factor authentication.
              </p>
              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">MFA Status</p>
                  <p className="text-sm text-slate-400">Two-factor authentication</p>
                </div>
                <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                  Enabled
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Phone className="w-4 h-4" />
              <span>SMS and Authenticator App configured</span>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Email notifications</span>
              <div className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm">On</div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Revenue alerts</span>
              <div className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm">On</div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Invoice reminders</span>
              <div className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm">On</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RouteGuard requiredRoles={['finance']}>
      <Suspense fallback={<div className="text-cyan-400 animate-pulse">Loading settings...</div>}>
        <SettingsContent />
      </Suspense>
    </RouteGuard>
  );
}
