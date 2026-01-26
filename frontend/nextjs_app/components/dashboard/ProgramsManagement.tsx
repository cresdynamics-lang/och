'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  usePrograms,
  useCreateProgram,
  useUpdateProgram,
  useDeleteProgram,
} from '@/hooks/usePrograms'
import type { Program } from '@/services/programsClient'

// Helper function to safely format price
const formatPrice = (price: number | string | undefined): string => {
  if (price === undefined || price === null) return '0.00'
  const numPrice = typeof price === 'number' ? price : parseFloat(String(price))
  return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2)
}

interface ProgramsManagementProps {
  onCreateNew?: () => void
  showCreateFormByDefault?: boolean
}

export function ProgramsManagement({
  onCreateNew,
  showCreateFormByDefault = false,
}: ProgramsManagementProps) {
  const { programs, isLoading, error, reload } = usePrograms()
  
  // Debug: Log programs whenever they change
  useEffect(() => {
    console.log('📋 Programs updated:', programs.length, 'programs')
    if (programs.length > 0) {
      console.log('Programs:', programs.map(p => ({ id: p.id, name: p.name })))
    }
  }, [programs])
  const { createProgram, isLoading: isCreating } = useCreateProgram()
  const { updateProgram, isLoading: isUpdating } = useUpdateProgram()
  const { deleteProgram, isLoading: isDeleting } = useDeleteProgram()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(showCreateFormByDefault)
  const [formData, setFormData] = useState<Partial<Program>>({
    name: '',
    category: 'technical',
    description: '',
    duration_months: 6,
    default_price: 0,
    currency: 'USD',
    status: 'active',
  })

  const handleCreate = async () => {
    try {
      const newProgram = await createProgram(formData)
      console.log('Program created successfully:', newProgram)
      
      // Reset form
      setShowCreateForm(false)
      setFormData({
        name: '',
        category: 'technical',
        description: '',
        duration_months: 6,
        default_price: 0,
        currency: 'USD',
        status: 'active',
      })
      
      // Force reload programs list immediately after creation
      // Use a small delay to ensure backend has fully processed the creation
      setTimeout(() => {
        console.log('🔄 Reloading programs list after creation...')
        reload().then(() => {
          console.log('✅ Programs list reloaded successfully')
        }).catch((err) => {
          console.error('❌ Failed to reload programs:', err)
        })
      }, 300)
    } catch (err: any) {
      console.error('Failed to create program:', err)
      alert(`Failed to create program: ${err.message || 'Unknown error'}`)
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      await updateProgram(id, formData)
      setEditingId(null)
      reload()
    } catch (err) {
      console.error('Failed to update program:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this program?')) {
      try {
        await deleteProgram(id)
        reload()
      } catch (err) {
        console.error('Failed to delete program:', err)
      }
    }
  }

  const startEdit = (program: Program) => {
    setEditingId(program.id || null)
    setFormData({
      name: program.name,
      category: program.category,
      description: program.description,
      duration_months: program.duration_months,
      default_price: program.default_price,
      currency: program.currency,
      status: program.status,
    })
  }

  if (isLoading) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-och-steel">Loading programs...</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-och-orange mb-2">Error loading programs: {error}</p>
          <p className="text-och-steel text-sm mb-4">
            Please check your connection and try again.
          </p>
          <Button variant="outline" onClick={reload} className="mt-4">
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {showCreateFormByDefault ? 'Create Program' : 'Programs Management'}
          </h2>
          <p className="text-och-steel">
            {showCreateFormByDefault
              ? 'Create a new program and view all existing programs'
              : 'Create, view, and manage all programs'}
          </p>
        </div>
        {!showCreateForm && (
          <Button
            variant="orange"
            onClick={() => {
              setShowCreateForm(true)
              setEditingId(null)
              setFormData({
                name: '',
                category: 'technical',
                description: '',
                duration_months: 6,
                default_price: 0,
                currency: 'USD',
                status: 'active',
              })
            }}
          >
            ➕ Create Program
          </Button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingId) && (
        <Card className="border-och-mint/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">
              {editingId ? 'Edit Program' : 'Create New Program'}
            </h3>
            {!editingId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCreateForm(false)
                  setFormData({
                    name: '',
                    category: 'technical',
                    description: '',
                    duration_months: 6,
                    default_price: 0,
                    currency: 'USD',
                    status: 'active',
                  })
                }}
              >
                Cancel
              </Button>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Program Name *
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                placeholder="Enter program name"
              />
            </div>

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
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
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
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description *
              </label>
              <textarea
                required
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                placeholder="Enter program description"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Duration (months) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.duration_months || 6}
                  onChange={(e) =>
                    setFormData({ ...formData, duration_months: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
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
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Currency *
                </label>
                <select
                  value={formData.currency || 'USD'}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                >
                  <option value="USD">USD</option>
                  <option value="KES">KES</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="mint"
                onClick={() => {
                  if (editingId) {
                    handleUpdate(editingId)
                  } else {
                    handleCreate()
                  }
                }}
                disabled={isCreating || isUpdating}
              >
                {editingId ? 'Update' : 'Create'} Program
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingId(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Programs List - Data retrieved from /api/v1/programs/ */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">All Programs ({programs.length})</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => reload()} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
          </Button>
        </div>
        {isLoading && programs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-och-steel">Loading programs from database...</p>
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-och-steel mb-2">No programs found in database.</p>
            <p className="text-och-steel text-sm">
              {showCreateForm 
                ? 'Fill out the form above to create your first program!'
                : 'Click "Create Program" to get started.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {programs.map((program) => (
              <div
                key={program.id}
                className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20 hover:border-och-defender/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-white">{program.name}</h4>
                      <Badge variant={program.status === 'active' ? 'mint' : 'defender'}>
                        {program.status}
                      </Badge>
                      <Badge variant="steel">{program.category}</Badge>
                    </div>
                    <p className="text-sm text-och-steel mb-2">{program.description}</p>
                    <div className="flex gap-4 text-sm text-och-steel">
                      <span>Duration: {program.duration_months} months</span>
                      <span>
                        Price: {program.currency} {formatPrice(program.default_price)}
                      </span>
                      <span>
                        Created: {program.created_at ? new Date(program.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => startEdit(program)}>
                    ✏️ Edit
                  </Button>
                  <Button
                    variant="orange"
                    size="sm"
                    onClick={() => program.id && handleDelete(program.id)}
                    disabled={isDeleting}
                  >
                    🗑️ Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

