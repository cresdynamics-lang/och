'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Mail, 
  Phone, 
  Lock, 
  Shield, 
  LogOut, 
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { EmailVerification } from './EmailVerification';
import { PhoneVerification } from './PhoneVerification';
import { PasswordChange } from './PasswordChange';
import { MFASetup } from './MFASetup';
import { SessionManagement } from './SessionManagement';
import { DeleteAccountModal } from './DeleteAccountModal';
import type { AccountSettings as AccountSettingsType } from '@/types/analyst-settings';

interface AccountSettingsProps {
  userId: string;
  data: AccountSettingsType;
  onUpdate: (section: string, updates: any) => Promise<void>;
}

export const AccountSettings = ({ userId, data, onUpdate }: AccountSettingsProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleLogoutAll = async () => {
    if (!confirm('Are you sure you want to log out of all devices?')) return;
    
    setIsUpdating('sessions');
    try {
      await fetch(`/api/analyst/${userId}/settings/account/sessions/logout-all`, {
        method: 'POST',
      });
      await onUpdate('account', { sessions: [] });
    } catch (error) {
      alert('Failed to log out all sessions');
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Section */}
      <section className="space-y-4" aria-labelledby="email-heading">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-och-defender-blue" />
            <h3 id="email-heading" className="text-lg font-semibold">Email Address</h3>
          </div>
          {data.email.verified && (
            <Badge className="bg-och-cyber-mint/20 text-och-cyber-mint border-och-cyber-mint/30">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
        <EmailVerification
          email={data.email}
          userId={userId}
          onUpdate={(updates) => onUpdate('account', { email: { ...data.email, ...updates } })}
        />
      </section>

      {/* Phone Section */}
      <section className="space-y-4 border-t border-och-steel-grey/30 pt-6" aria-labelledby="phone-heading">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-och-defender-blue" />
            <h3 id="phone-heading" className="text-lg font-semibold">Phone Number</h3>
          </div>
          {data.phone.verified && (
            <Badge className="bg-och-cyber-mint/20 text-och-cyber-mint border-och-cyber-mint/30">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
        <PhoneVerification
          phone={data.phone}
          userId={userId}
          onUpdate={(updates) => onUpdate('account', { phone: { ...data.phone, ...updates } })}
        />
      </section>

      {/* Password Section */}
      <section className="space-y-4 border-t border-och-steel-grey/30 pt-6" aria-labelledby="password-heading">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-och-defender-blue" />
          <h3 id="password-heading" className="text-lg font-semibold">Password</h3>
        </div>
        <PasswordChange
          password={data.password}
          userId={userId}
          onUpdate={(updates) => onUpdate('account', { password: { ...data.password, ...updates } })}
        />
      </section>

      {/* MFA Section */}
      <section className="space-y-4 border-t border-och-steel-grey/30 pt-6" aria-labelledby="mfa-heading">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-och-defender-blue" />
          <h3 id="mfa-heading" className="text-lg font-semibold">Multi-Factor Authentication</h3>
        </div>
        <MFASetup
          mfa={data.mfa}
          userId={userId}
          onUpdate={(updates) => onUpdate('account', { mfa: { ...data.mfa, ...updates } })}
        />
      </section>

      {/* Linked Accounts */}
      <section className="space-y-4 border-t border-och-steel-grey/30 pt-6" aria-labelledby="linked-heading">
        <h3 id="linked-heading" className="text-lg font-semibold">Linked Accounts</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-och-midnight-black font-bold">G</span>
              </div>
              <div>
                <div className="font-medium">Google</div>
                <div className="text-sm text-och-steel-grey">
                  {data.linkedAccounts.google ? 'Connected' : 'Not connected'}
                </div>
              </div>
            </div>
            {data.linkedAccounts.google ? (
              <Button variant="outline" size="sm">Disconnect</Button>
            ) : (
              <Button size="sm">Connect</Button>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">W</span>
              </div>
              <div>
                <div className="font-medium">WhatsApp Business</div>
                <div className="text-sm text-och-steel-grey">
                  {data.linkedAccounts.whatsappBusiness ? 'Connected' : 'Not connected'}
                </div>
              </div>
            </div>
            {data.linkedAccounts.whatsappBusiness ? (
              <Button variant="outline" size="sm">Disconnect</Button>
            ) : (
              <Button size="sm">Connect</Button>
            )}
          </div>
        </div>
      </section>

      {/* Sessions */}
      <section className="space-y-4 border-t border-och-steel-grey/30 pt-6" aria-labelledby="sessions-heading">
        <div className="flex items-center justify-between">
          <h3 id="sessions-heading" className="text-lg font-semibold">Active Sessions</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogoutAll}
            disabled={isUpdating === 'sessions'}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out All
          </Button>
        </div>
        <SessionManagement
          sessions={data.sessions}
          userId={userId}
          onUpdate={(sessions) => onUpdate('account', { sessions })}
        />
      </section>

      {/* Danger Zone */}
      <section className="space-y-4 border-t border-red-500/30 pt-6" aria-labelledby="danger-heading">
        <h3 id="danger-heading" className="text-lg font-semibold text-red-400">Danger Zone</h3>
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-red-400">Delete Account</div>
              <div className="text-sm text-och-steel-grey mt-1">
                Permanently delete your account and all associated data. This action cannot be undone.
              </div>
            </div>
            <Button
              variant="outline"
              className="border-red-500 text-red-400 hover:bg-red-500/20"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </div>
      </section>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <DeleteAccountModal
          userId={userId}
          onClose={() => setShowDeleteModal(false)}
          onDelete={async () => {
            // Handle account deletion
            await fetch(`/api/analyst/${userId}/settings/account/delete`, {
              method: 'DELETE',
            });
            window.location.href = '/login';
          }}
        />
      )}
    </div>
  );
};

