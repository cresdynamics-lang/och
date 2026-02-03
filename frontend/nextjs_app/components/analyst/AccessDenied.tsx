import React from 'react';
import { Button } from '@/components/ui/Button';
import { Lock, Shield } from 'lucide-react';

interface AccessDeniedProps {
  requiredRole?: string;
  feature?: string;
  onUpgrade?: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredRole = 'analyst',
  feature = 'this feature',
  onUpgrade
}) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-och-signal-orange/20 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-10 h-10 text-och-signal-orange" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-och-defender-blue rounded-full flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-2">Access Restricted</h3>

      <p className="text-och-steel-grey text-sm mb-6 max-w-xs">
        {feature} is only available to {requiredRole} users.
        Upgrade your account to access career matching and job opportunities.
      </p>

      <div className="space-y-3 w-full max-w-xs">
        {onUpgrade && (
          <Button
            className="w-full bg-gradient-to-r from-och-sahara-gold to-och-signal-orange hover:from-och-sahara-gold/90"
            onClick={onUpgrade}
          >
            Upgrade to Analyst
          </Button>
        )}

        <Button
          variant="outline"
          className="w-full border-och-steel-grey/50 text-och-steel-grey hover:border-och-steel-grey"
          onClick={() => window.location.href = '/dashboard'}
        >
          Return to Dashboard
        </Button>
      </div>

      <div className="mt-6 p-3 bg-och-midnight-black/50 rounded-lg">
        <p className="text-xs text-och-steel-grey">
          Need help? Contact support for role upgrade options.
        </p>
      </div>
    </div>
  );
};
