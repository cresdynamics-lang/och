'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { User, MapPin, Camera } from 'lucide-react';

interface PersonalInfoProps {
  personal: {
    name: string;
    photo: string | null;
    bio: string;
    location: string | null;
  };
  userId: string;
  onUpdate: (updates: any) => Promise<void>;
}

export const PersonalInfo = ({ personal, userId, onUpdate }: PersonalInfoProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(personal);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(formData);
      setIsEditing(false);
    } catch (error) {
      alert('Failed to update personal information');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Photo Upload */}
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-och-steel-grey/20 border-2 border-och-defender-blue/30 flex items-center justify-center overflow-hidden">
            {formData.photo ? (
              <img src={formData.photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-och-steel-grey" />
            )}
          </div>
          {isEditing && (
            <button
              className="absolute bottom-0 right-0 w-6 h-6 bg-och-defender-blue rounded-full flex items-center justify-center border-2 border-och-midnight-black"
              aria-label="Change photo"
            >
              <Camera className="w-3 h-3 text-white" />
            </button>
          )}
        </div>
        <div className="flex-1">
          <div className="text-sm text-och-steel-grey mb-1">Profile Photo</div>
          <div className="text-xs text-och-steel-grey">300x300px recommended</div>
          {isEditing && (
            <Button size="sm" variant="outline" className="mt-2">
              Upload Photo
            </Button>
          )}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-2">Name (Public)</label>
        {isEditing ? (
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 bg-och-midnight-black border border-och-steel-grey/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender-blue"
            aria-label="Name"
          />
        ) : (
          <div className="px-4 py-2 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
            {formData.name}
          </div>
        )}
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium mb-2">Bio</label>
        {isEditing ? (
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 bg-och-midnight-black border border-och-steel-grey/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender-blue resize-none"
            aria-label="Bio"
          />
        ) : (
          <div className="px-4 py-2 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg min-h-[60px]">
            {formData.bio || <span className="text-och-steel-grey">No bio set</span>}
          </div>
        )}
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-och-steel-grey" />
          Location (Optional)
        </label>
        {isEditing ? (
          <input
            type="text"
            value={formData.location || ''}
            onChange={(e) => setFormData({ ...formData, location: e.target.value || null })}
            placeholder="Nairobi, KE"
            className="w-full px-4 py-2 bg-och-midnight-black border border-och-steel-grey/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender-blue"
            aria-label="Location"
          />
        ) : (
          <div className="px-4 py-2 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
            {formData.location || <span className="text-och-steel-grey">Not set</span>}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {isEditing ? (
          <>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFormData(personal);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)}>
            Edit Personal Info
          </Button>
        )}
      </div>
    </div>
  );
};

