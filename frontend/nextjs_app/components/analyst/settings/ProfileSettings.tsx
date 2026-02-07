'use client';

import { PersonalInfo } from './PersonalInfo';
import { ProfessionalInfo } from './ProfessionalInfo';
import { PortfolioSharing } from './PortfolioSharing';
import type { ProfileSettings as ProfileSettingsType } from '@/types/analyst-settings';

interface ProfileSettingsProps {
  userId: string;
  data: ProfileSettingsType;
  onUpdate: (section: string, updates: any) => Promise<void>;
}

export const ProfileSettings = ({ userId, data, onUpdate }: ProfileSettingsProps) => {
  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <section className="space-y-4" aria-labelledby="personal-heading">
        <h3 id="personal-heading" className="text-lg font-semibold">Personal Information</h3>
        <PersonalInfo
          personal={data.personal}
          userId={userId}
          onUpdate={(updates) => onUpdate('profile', { personal: { ...data.personal, ...updates } })}
        />
      </section>

      {/* Professional Information */}
      <section className="space-y-4 border-t border-och-steel-grey/30 pt-6" aria-labelledby="professional-heading">
        <h3 id="professional-heading" className="text-lg font-semibold">Professional Information</h3>
        <ProfessionalInfo
          professional={data.professional}
          userId={userId}
          onUpdate={(updates) => onUpdate('profile', { professional: { ...data.professional, ...updates } })}
        />
      </section>

      {/* Portfolio Sharing */}
      <section className="space-y-4 border-t border-och-steel-grey/30 pt-6" aria-labelledby="portfolio-heading">
        <h3 id="portfolio-heading" className="text-lg font-semibold">Portfolio Sharing</h3>
        <PortfolioSharing
          portfolio={data.portfolio}
          userId={userId}
          onUpdate={(updates) => onUpdate('profile', { portfolio: { ...data.portfolio, ...updates } })}
        />
      </section>
    </div>
  );
};

