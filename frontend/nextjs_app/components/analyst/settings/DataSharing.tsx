'use client';

import { Switch } from '@/components/ui/Switch';
import { Building2, UserCheck, AlertTriangle } from 'lucide-react';

interface DataSharingProps {
  dataSharing: {
    employers: Array<{
      company: string;
      enabled: boolean;
      scope: 'full' | 'readiness-only';
      views: number;
    }>;
    mentors: {
      enabled: boolean;
      currentMentors: Array<{
        id: string;
        name: string;
        access: 'full' | 'limited';
      }>;
      futureMentors: boolean;
    };
  };
  userId: string;
  onUpdate: (updates: any) => Promise<void>;
}

export const DataSharing = ({ dataSharing, userId, onUpdate }: DataSharingProps) => {
  const handleEmployerToggle = async (company: string, enabled: boolean) => {
    const updated = dataSharing.employers.map(e =>
      e.company === company ? { ...e, enabled } : e
    );
    await onUpdate({ employers: updated });
  };

  const handleEmployerScope = async (company: string, scope: 'full' | 'readiness-only') => {
    const updated = dataSharing.employers.map(e =>
      e.company === company ? { ...e, scope } : e
    );
    await onUpdate({ employers: updated });
  };

  const handleMentorToggle = async (enabled: boolean) => {
    await onUpdate({ mentors: { ...dataSharing.mentors, enabled } });
  };

  const handleFutureMentorsToggle = async (enabled: boolean) => {
    await onUpdate({ mentors: { ...dataSharing.mentors, futureMentors: enabled } });
  };

  return (
    <div className="space-y-6">
      {/* Employer Sharing */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-och-defender-blue" />
          Employer Data Sharing
        </h4>
        <div className="space-y-3">
          {dataSharing.employers.map((employer) => (
            <div
              key={employer.company}
              className="p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-och-defender-blue/20 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-och-defender-blue">
                      {employer.company.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{employer.company}</div>
                    <div className="text-sm text-och-steel-grey">
                      {employer.views} view{employer.views !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={employer.enabled}
                  onCheckedChange={(enabled) => {
                    if (enabled) {
                      // Show confirmation modal
                      if (confirm(`Allow ${employer.company} to view your profile?`)) {
                        handleEmployerToggle(employer.company, enabled);
                      }
                    } else {
                      handleEmployerToggle(employer.company, enabled);
                    }
                  }}
                />
              </div>
              {employer.enabled && (
                <div className="pl-13 space-y-2">
                  <label className="block text-sm font-medium">Sharing Scope</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEmployerScope(employer.company, 'full')}
                      className={`px-3 py-1 rounded-lg border text-sm transition-all ${
                        employer.scope === 'full'
                          ? 'border-och-defender-blue bg-och-defender-blue/20 text-och-defender-blue'
                          : 'border-och-steel-grey/30 bg-och-steel-grey/10 text-och-steel-grey'
                      }`}
                    >
                      Full Profile
                    </button>
                    <button
                      onClick={() => handleEmployerScope(employer.company, 'readiness-only')}
                      className={`px-3 py-1 rounded-lg border text-sm transition-all ${
                        employer.scope === 'readiness-only'
                          ? 'border-och-defender-blue bg-och-defender-blue/20 text-och-defender-blue'
                          : 'border-och-steel-grey/30 bg-och-steel-grey/10 text-och-steel-grey'
                      }`}
                    >
                      Readiness Only
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mentor Sharing */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-och-defender-blue" />
          Mentor Data Sharing
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
            <div>
              <div className="font-medium">Current Mentors</div>
              <div className="text-sm text-och-steel-grey mt-1">
                {dataSharing.mentors.currentMentors.length > 0
                  ? dataSharing.mentors.currentMentors.map(m => m.name).join(', ')
                  : 'No mentors assigned'}
              </div>
            </div>
            <Switch
              checked={dataSharing.mentors.enabled}
              onCheckedChange={handleMentorToggle}
              disabled={dataSharing.mentors.currentMentors.length === 0}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
            <div>
              <div className="font-medium">Future Mentors</div>
              <div className="text-sm text-och-steel-grey mt-1">
                Automatically share with newly assigned mentors
              </div>
            </div>
            <Switch
              checked={dataSharing.mentors.futureMentors}
              onCheckedChange={handleFutureMentorsToggle}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

