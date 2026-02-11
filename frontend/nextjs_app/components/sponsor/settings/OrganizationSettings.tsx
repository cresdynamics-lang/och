'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Building2, Globe, MapPin } from 'lucide-react';
import type { OrganizationSettings as OrganizationSettingsType } from '@/types/sponsor-settings';

interface OrganizationSettingsProps {
  userId: string;
  data: OrganizationSettingsType;
  onUpdate: (section: string, updates: any) => Promise<void>;
}

export const OrganizationSettings = ({ userId, data, onUpdate }: OrganizationSettingsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(data);

  const handleSave = async () => {
    try {
      await onUpdate('organization', formData);
      setIsEditing(false);
      alert('Organization settings updated');
    } catch (error) {
      alert('Failed to update organization settings');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Organization Settings</h2>
        <p className="text-och-steel text-sm">
          Manage your organization profile, contact information, and branding
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-och-defender" />
            Basic Information
          </h3>
          <Button size="sm" variant="outline" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>

        <div className="space-y-4 p-4 bg-och-steel/10 rounded-lg border border-och-steel/20">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Organization Name</label>
            <input
              type="text"
              value={formData.basic.name}
              onChange={(e) => setFormData({ ...formData, basic: { ...formData.basic, name: e.target.value } })}
              disabled={!isEditing}
              className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Sponsor Type</label>
            <select
              value={formData.basic.sponsorType}
              onChange={(e) => setFormData({ ...formData, basic: { ...formData.basic, sponsorType: e.target.value as any } })}
              disabled={!isEditing}
              className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white disabled:opacity-50"
            >
              <option value="corporate">Corporate Partner</option>
              <option value="university">University/Institution</option>
              <option value="scholarship">Scholarship Provider</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Website</label>
            <input
              type="url"
              value={formData.basic.website || ''}
              onChange={(e) => setFormData({ ...formData, basic: { ...formData.basic, website: e.target.value } })}
              disabled={!isEditing}
              placeholder="https://example.com"
              className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white disabled:opacity-50"
            />
          </div>
        </div>
      </section>

      <section className="border-t border-och-steel/30 pt-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-och-defender" />
          Contact Information
        </h3>

        <div className="space-y-4 p-4 bg-och-steel/10 rounded-lg border border-och-steel/20">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Contact Email</label>
            <input
              type="email"
              value={formData.contact.email}
              onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, email: e.target.value } })}
              disabled={!isEditing}
              className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white disabled:opacity-50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">City</label>
              <input
                type="text"
                value={formData.contact.city || ''}
                onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, city: e.target.value } })}
                disabled={!isEditing}
                className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Country</label>
              <input
                type="text"
                value={formData.contact.country || ''}
                onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, country: e.target.value } })}
                disabled={!isEditing}
                className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </section>

      {isEditing && (
        <div className="flex justify-end gap-2">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      )}
    </div>
  );
};

