'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useMentorProfile } from '@/hooks/useMentorProfile'
import { useAuth } from '@/hooks/useAuth'

export function MentorProfileManagement() {
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const { profile, isLoading, error, updateProfile } = useMentorProfile(mentorId)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    bio: '',
    expertise_tags: [] as string[],
    availability: {
      timezone: '',
      available_hours: [] as Array<{ day: string; start: string; end: string }>,
    },
  })
  const [newTag, setNewTag] = useState('')
  const [newDay, setNewDay] = useState('')
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd] = useState('')

  if (isLoading) return <div className="text-och-steel text-sm">Loading profile...</div>
  if (error) return <div className="text-och-orange text-sm">Error: {error}</div>
  if (!profile) return null

  const handleEdit = () => {
    setFormData({
      bio: profile.bio || '',
      expertise_tags: profile.expertise_tags || [],
      availability: profile.availability || { timezone: '', available_hours: [] },
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    try {
      await updateProfile(formData)
      setIsEditing(false)
    } catch (err) {
      // Error handled by hook
    }
  }

  const addTag = () => {
    if (!newTag.trim() || formData.expertise_tags.includes(newTag)) return
    setFormData({ ...formData, expertise_tags: [...formData.expertise_tags, newTag] })
    setNewTag('')
  }

  const removeTag = (tag: string) => {
    setFormData({ ...formData, expertise_tags: formData.expertise_tags.filter(t => t !== tag) })
  }

  const addAvailableHour = () => {
    if (!newDay || !newStart || !newEnd) return
    setFormData({
      ...formData,
      availability: {
        ...formData.availability,
        available_hours: [...formData.availability.available_hours, { day: newDay, start: newStart, end: newEnd }],
      },
    })
    setNewDay('')
    setNewStart('')
    setNewEnd('')
  }

  const removeAvailableHour = (index: number) => {
    setFormData({
      ...formData,
      availability: {
        ...formData.availability,
        available_hours: formData.availability.available_hours.filter((_, i) => i !== index),
      },
    })
  }

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Mentor Profile</h2>
          <p className="text-sm text-och-steel">
            Manage your profile details, expertise, and availability.
          </p>
        </div>
        {!isEditing && (
          <Button variant="outline" onClick={handleEdit}>Edit Profile</Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Expertise Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add expertise tag..."
                className="flex-1 px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button variant="outline" size="sm" onClick={addTag}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.expertise_tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-och-defender/30 text-och-mint rounded text-xs flex items-center gap-2">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-och-steel hover:text-white">×</button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Availability</label>
            <div className="mb-2">
              <input
                type="text"
                value={formData.availability.timezone}
                onChange={(e) => setFormData({
                  ...formData,
                  availability: { ...formData.availability, timezone: e.target.value },
                })}
                placeholder="Timezone (e.g., UTC, America/New_York)"
                className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
              />
            </div>
            <div className="flex gap-2 mb-2">
              <select
                value={newDay}
                onChange={(e) => setNewDay(e.target.value)}
                className="px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
              >
                <option value="">Day</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
              </select>
              <input
                type="time"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                placeholder="Start"
                className="px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
              />
              <input
                type="time"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                placeholder="End"
                className="px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
              />
              <Button variant="outline" size="sm" onClick={addAvailableHour}>Add</Button>
            </div>
            <div className="space-y-1">
              {formData.availability.available_hours.map((hour, index) => (
                <div key={index} className="p-2 bg-och-midnight/50 rounded flex justify-between items-center">
                  <span className="text-sm text-white">
                    {hour.day}: {hour.start} - {hour.end}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => removeAvailableHour(index)}>Remove</Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button variant="defender" onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-och-steel mb-1">Bio</h3>
            <p className="text-white">{profile.bio || 'No bio provided.'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-och-steel mb-1">Expertise Tags</h3>
            <div className="flex flex-wrap gap-2">
              {profile.expertise_tags.length > 0 ? (
                profile.expertise_tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-och-defender/30 text-och-mint rounded text-xs">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-och-steel text-sm">No tags added.</span>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-och-steel mb-1">Availability</h3>
            <p className="text-white text-sm">Timezone: {profile.availability.timezone || 'Not set'}</p>
            <div className="mt-2 space-y-1">
              {profile.availability.available_hours.length > 0 ? (
                profile.availability.available_hours.map((hour, index) => (
                  <div key={index} className="text-sm text-och-steel">
                    {hour.day}: {hour.start} - {hour.end}
                  </div>
                ))
              ) : (
                <span className="text-och-steel text-sm">No availability set.</span>
              )}
            </div>
          </div>
          <div className="pt-4 border-t border-och-steel/20">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-och-steel">Current Mentees:</span>
                <span className="text-white ml-2">{profile.current_mentees} / {profile.max_mentees}</span>
              </div>
              <div>
                <span className="text-och-steel">Total Sessions:</span>
                <span className="text-white ml-2">{profile.total_sessions}</span>
              </div>
              {profile.rating && (
                <div>
                  <span className="text-och-steel">Rating:</span>
                  <span className="text-white ml-2">{profile.rating} / 5.0</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}


