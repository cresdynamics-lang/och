'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Award, Plus, X } from 'lucide-react';

interface ProfessionalInfoProps {
  professional: {
    cohort: string;
    cohortRank: string;
    track: string;
    trackProgress: number;
    readiness: number;
    certifications: Array<{
      id: string;
      name: string;
      issuer: string;
      date: string;
      badgeUrl?: string;
    }>;
  };
  userId: string;
  onUpdate: (updates: any) => Promise<void>;
}

export const ProfessionalInfo = ({ professional, userId, onUpdate }: ProfessionalInfoProps) => {
  const [showAddCert, setShowAddCert] = useState(false);
  const [newCert, setNewCert] = useState({ name: '', issuer: '', date: '' });

  const handleAddCert = async () => {
    if (!newCert.name || !newCert.issuer || !newCert.date) {
      alert('Please fill all fields');
      return;
    }

    const updated = {
      ...professional,
      certifications: [
        ...professional.certifications,
        {
          id: `cert-${Date.now()}`,
          ...newCert,
        },
      ],
    };
    await onUpdate(updated);
    setNewCert({ name: '', issuer: '', date: '' });
    setShowAddCert(false);
  };

  const handleRemoveCert = async (id: string) => {
    const updated = {
      ...professional,
      certifications: professional.certifications.filter(c => c.id !== id),
    };
    await onUpdate(updated);
  };

  return (
    <div className="space-y-4">
      {/* Read-only Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
          <div className="text-sm text-och-steel-grey mb-1">Cohort</div>
          <div className="font-medium">{professional.cohort}</div>
          <div className="text-sm text-och-cyber-mint mt-1">{professional.cohortRank}</div>
        </div>

        <div className="p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
          <div className="text-sm text-och-steel-grey mb-1">Track</div>
          <div className="font-medium">{professional.track}</div>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Progress</span>
              <span className="text-och-cyber-mint">{professional.trackProgress}%</span>
            </div>
            <Progress value={professional.trackProgress} className="h-2" />
          </div>
        </div>

        <div className="p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
          <div className="text-sm text-och-steel-grey mb-1">Readiness Score</div>
          <div className="text-2xl font-bold text-och-cyber-mint">{professional.readiness}%</div>
          <div className="text-xs text-och-steel-grey mt-1">Auto-updated</div>
        </div>
      </div>

      {/* Certifications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium flex items-center gap-2">
            <Award className="w-5 h-5 text-och-defender-blue" />
            Certifications
          </h4>
          <Button size="sm" onClick={() => setShowAddCert(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Certification
          </Button>
        </div>

        {professional.certifications.length > 0 ? (
          <div className="space-y-2">
            {professional.certifications.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center justify-between p-3 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {cert.badgeUrl ? (
                    <img src={cert.badgeUrl} alt={cert.name} className="w-10 h-10 rounded" />
                  ) : (
                    <div className="w-10 h-10 bg-och-defender-blue/20 rounded flex items-center justify-center">
                      <Award className="w-5 h-5 text-och-defender-blue" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{cert.name}</div>
                    <div className="text-sm text-och-steel-grey">
                      {cert.issuer} • {new Date(cert.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveCert(cert.id)}
                  className="text-och-steel-grey hover:text-red-400 transition-colors"
                  aria-label={`Remove ${cert.name} certification`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-och-steel-grey text-center py-4">
            No certifications added yet
          </div>
        )}

        {showAddCert && (
          <div className="mt-4 p-4 bg-och-steel-grey/10 border border-och-defender-blue/30 rounded-lg space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Certification Name</label>
              <input
                type="text"
                value={newCert.name}
                onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                placeholder="e.g., SOC Triage"
                className="w-full px-4 py-2 bg-och-midnight-black border border-och-steel-grey/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Issuer</label>
              <input
                type="text"
                value={newCert.issuer}
                onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                placeholder="e.g., OCH"
                className="w-full px-4 py-2 bg-och-midnight-black border border-och-steel-grey/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={newCert.date}
                onChange={(e) => setNewCert({ ...newCert, date: e.target.value })}
                className="w-full px-4 py-2 bg-och-midnight-black border border-och-steel-grey/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender-blue"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddCert}>Add</Button>
              <Button size="sm" variant="outline" onClick={() => {
                setShowAddCert(false);
                setNewCert({ name: '', issuer: '', date: '' });
              }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

