'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useCreateProgram, usePrograms } from '@/hooks/usePrograms'
import type { Program } from '@/services/programsClient'

// Helper function to safely format price
const formatPrice = (price: number | string | undefined): string => {
  if (price === undefined || price === null) return '0.00'
  const numPrice = typeof price === 'number' ? price : parseFloat(String(price))
  return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2)
}

export function CreateProgramView() {
  const { createProgram, isLoading: isCreating, error: createError } = useCreateProgram()
  const { programs, reload } = usePrograms()
  
  const [formData, setFormData] = useState<Partial<Program>>({
    name: '',
    category: 'technical',
    description: '',
    duration_months: 6,
    default_price: 0,
    currency: 'USD',
    status: 'active',
  })

  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage(null)
    
    try {
      const newProgram = await createProgram(formData)
      console.log('✅ Program created successfully:', newProgram)
      
      // Show success message
      setSuccessMessage(`Program "${newProgram.name}" created successfully!`)
      
      // Reset form
      setFormData({
        name: '',
        category: 'technical',
        description: '',
        duration_months: 6,
        default_price: 0,
        currency: 'USD',
        status: 'active',
      })
      
      // Reload programs list to show the new program
      setTimeout(() => {
        reload()
      }, 300)
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)
    } catch (err: any) {
      console.error('❌ Failed to create program:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Create New Program</h2>
        <p className="text-och-steel">
          Define a new program with its details, pricing, and configuration
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Card className="border-och-mint/50 bg-och-mint/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <p className="text-och-mint font-semibold">{successMessage}</p>
          </div>
        </Card>
      )}

      {/* Error Message */}
      {createError && (
        <Card className="border-och-orange/50 bg-och-orange/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">❌</span>
            <p className="text-och-orange font-semibold">
              Error: {createError}
            </p>
          </div>
        </Card>
      )}

      {/* Create Form */}
      <Card className="border-och-mint/30">
        <h3 className="text-xl font-bold text-white mb-6">Program Details</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Program Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Program Name *
            </label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint transition-colors"
              placeholder="e.g., Cybersecurity Fundamentals"
            />
          </div>

          {/* Category and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Category *
              </label>
              <select
                value={formData.category || 'technical'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as 'technical' | 'leadership' | 'mentorship',
                  })
                }
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint transition-colors"
              >
                <option value="technical">Technical</option>
                <option value="leadership">Leadership</option>
                <option value="mentorship">Mentorship</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Status *
              </label>
              <select
                value={formData.status || 'active'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'active' | 'inactive' | 'archived',
                  })
                }
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint transition-colors"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description *
            </label>
            <textarea
              required
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint transition-colors resize-none"
              placeholder="Describe the program, its objectives, and target audience..."
            />
          </div>

          {/* Duration, Price, Currency */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Duration (months) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="36"
                value={formData.duration_months || 6}
                onChange={(e) =>
                  setFormData({ ...formData, duration_months: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Price *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.default_price || 0}
                onChange={(e) =>
                  setFormData({ ...formData, default_price: parseFloat(e.target.value) })
                }
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Currency *
              </label>
              <select
                value={formData.currency || 'USD'}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint transition-colors"
              >
                <option value="USD">USD ($)</option>
                <option value="KES">KES (KSh)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              variant="mint"
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating ? '⏳ Creating...' : '✅ Create Program'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  name: '',
                  category: 'technical',
                  description: '',
                  duration_months: 6,
                  default_price: 0,
                  currency: 'USD',
                  status: 'active',
                })
                setSuccessMessage(null)
              }}
            >
              Clear Form
            </Button>
          </div>
        </form>
      </Card>

      {/* Recent Programs Preview */}
      {programs.length > 0 && (
        <Card>
          <h3 className="text-lg font-bold text-white mb-4">
            Recently Created Programs ({programs.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {programs.slice(0, 5).map((program) => (
              <div
                key={program.id}
                className="p-3 bg-och-midnight/50 rounded-lg border border-och-steel/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">{program.name}</p>
                    <p className="text-xs text-och-steel">
                      {program.category} • {program.duration_months} months •{' '}
                      {program.currency} {formatPrice(program.default_price)}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      program.status === 'active'
                        ? 'bg-och-mint/20 text-och-mint'
                        : 'bg-och-steel/20 text-och-steel'
                    }`}
                  >
                    {program.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {programs.length > 5 && (
            <p className="text-xs text-och-steel mt-2 text-center">
              Showing 5 of {programs.length} programs
            </p>
          )}
        </Card>
      )}
    </div>
  )
}


