'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { djangoClient } from '@/services/djangoClient'

interface AddStudentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddStudentModal({ isOpen, onClose, onSuccess }: AddStudentModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    country: '',
    timezone: 'UTC',
    language: 'en',
    cohort_id: '',
    track_key: '',
    passwordless: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // Call the signup endpoint to create the student
      // According to spec: POST /auth/signup → creates user with pending_verification status
      // and sends verification email
      await djangoClient.auth.signup({
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        country: formData.country || undefined,
        timezone: formData.timezone,
        language: formData.language,
        cohort_id: formData.cohort_id || undefined,
        track_key: formData.track_key || undefined,
        passwordless: formData.passwordless
      })

      // Success - close modal and refresh list
      alert(`Student account created successfully!\n\nA verification email has been sent to ${formData.email}`)
      onSuccess()
      onClose()
      
      // Reset form
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        country: '',
        timezone: 'UTC',
        language: 'en',
        cohort_id: '',
        track_key: '',
        passwordless: true
      })
    } catch (err: any) {
      console.error('Failed to create student:', err)
      setError(err.response?.data?.detail || err.message || 'Failed to create student account')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Add New Student</h2>
            <button
              onClick={onClose}
              className="text-och-steel hover:text-white transition-colors"
              disabled={isSubmitting}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4 p-4 bg-och-mint/10 border border-och-mint/30 rounded-lg">
            <p className="text-sm text-och-steel">
              <strong className="text-white">Account Creation Flow:</strong>
              <br />
              1. Student account will be created with "Pending Verification" status
              <br />
              2. Verification email will be sent automatically to the student
              <br />
              3. Student clicks the link in email to verify and activate their account
              <br />
              4. After verification, student can log in and complete onboarding
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-och-orange/10 border border-och-orange/30 rounded-lg">
              <p className="text-och-orange text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-och-steel mb-2">
                    First Name <span className="text-och-orange">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-och-steel mb-2">
                    Last Name <span className="text-och-orange">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-och-steel mb-2">
                  Email Address <span className="text-och-orange">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                  placeholder="student@example.com"
                />
                <p className="text-xs text-och-steel mt-1">
                  Verification email will be sent to this address
                </p>
              </div>
            </div>

            {/* Program Assignment */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Program Assignment (Optional)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-och-steel mb-2">
                    Cohort ID
                  </label>
                  <input
                    type="text"
                    value={formData.cohort_id}
                    onChange={(e) => setFormData({ ...formData, cohort_id: e.target.value })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                    placeholder="e.g., cohort-2026-01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-och-steel mb-2">
                    Track
                  </label>
                  <select
                    value={formData.track_key}
                    onChange={(e) => setFormData({ ...formData, track_key: e.target.value })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                  >
                    <option value="">Select Track (Optional)</option>
                    <option value="defender">Defender</option>
                    <option value="offensive">Offensive Security</option>
                    <option value="grc">GRC (Governance, Risk & Compliance)</option>
                    <option value="innovation">Innovation & Development</option>
                    <option value="leadership">Leadership</option>
                  </select>
                  <p className="text-xs text-och-steel mt-1">
                    Leave blank for student to complete profiler
                  </p>
                </div>
              </div>
            </div>

            {/* Location Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Location & Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-och-steel mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                    placeholder="e.g., BW, KE, ZA"
                    maxLength={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-och-steel mb-2">
                    Timezone
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                  >
                    <option value="UTC">UTC</option>
                    <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                    <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                    <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                    <option value="Africa/Cairo">Africa/Cairo (EET)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-och-steel mb-2">
                    Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                  >
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="sw">Swahili</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t border-och-steel/20">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="mint"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Creating Account...' : 'Create Student Account'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}
