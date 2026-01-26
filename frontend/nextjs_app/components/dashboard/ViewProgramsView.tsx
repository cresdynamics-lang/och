'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  usePrograms,
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

export function ViewProgramsView() {
  const { programs, isLoading, error, reload } = usePrograms()
  const { updateProgram, isLoading: isUpdating } = useUpdateProgram()
  const { deleteProgram, isLoading: isDeleting } = useDeleteProgram()

  // Debug: Log programs whenever they change
  useEffect(() => {
    console.log('📋 ViewProgramsView - Programs updated:', {
      count: programs.length,
      isLoading,
      error,
      programs: programs.map(p => ({ id: p.id, name: p.name, status: p.status }))
    })
  }, [programs, isLoading, error])

  // Ensure programs are loaded when component mounts
  useEffect(() => {
    if (!isLoading && programs.length === 0 && !error) {
      console.log('🔄 No programs found, reloading...')
      reload()
    }
  }, [isLoading, programs.length, error, reload])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Program>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const handleUpdate = async (id: string) => {
    try {
      await updateProgram(id, formData)
      setEditingId(null)
      setFormData({})
      reload()
    } catch (err) {
      console.error('Failed to update program:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
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

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({})
  }

  // Filter programs
  const filteredPrograms = programs.filter((program) => {
    const matchesSearch =
      searchQuery === '' ||
      program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = filterCategory === 'all' || program.category === filterCategory
    const matchesStatus = filterStatus === 'all' || program.status === filterStatus

    return matchesSearch && matchesCategory && matchesStatus
  })

  if (isLoading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="inline-block animate-spin text-och-mint text-4xl mb-4">⏳</div>
          <p className="text-och-steel">Loading programs from database...</p>
          <p className="text-och-steel text-sm mt-2">Fetching from /api/v1/programs/</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-och-orange mb-2 font-semibold">❌ Error loading programs</p>
          <p className="text-och-steel mb-4">{error}</p>
          <p className="text-och-steel text-sm mb-4">
            Please check your connection and try again.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={reload}>
              🔄 Retry
            </Button>
            <Button variant="mint" onClick={() => {
              console.log('🔄 Manual reload triggered')
              reload()
            }}>
              Force Reload
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">View & Manage Programs</h2>
          <p className="text-och-steel">
            Browse, search, edit, and manage all programs in the system
          </p>
        </div>
        <Button variant="outline" onClick={reload} disabled={isLoading}>
          {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-white mb-2">
              Search Programs
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or description..."
              className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint transition-colors"
            >
              <option value="all">All Categories</option>
              <option value="technical">Technical</option>
              <option value="leadership">Leadership</option>
              <option value="mentorship">Mentorship</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint transition-colors"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-och-steel">
            Showing <strong className="text-white">{filteredPrograms.length}</strong> of <strong className="text-white">{programs.length}</strong> programs
          </div>
          {programs.length > 0 && (
            <div className="text-xs text-och-steel">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          )}
        </div>
      </Card>

      {/* Programs List */}
      {filteredPrograms.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-och-steel mb-2">
              {searchQuery || filterCategory !== 'all' || filterStatus !== 'all'
                ? 'No programs match your filters'
                : programs.length === 0
                ? 'No programs found in database'
                : 'No programs match your current filters'}
            </p>
            {programs.length === 0 ? (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-och-steel">
                  Total programs in database: {programs.length}
                </p>
                <Button
                  variant="mint"
                  onClick={() => {
                    console.log('🔄 Reloading programs...')
                    reload()
                  }}
                  className="mt-4"
                >
                  🔄 Reload Programs
                </Button>
              </div>
            ) : searchQuery || filterCategory !== 'all' || filterStatus !== 'all' ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setFilterCategory('all')
                  setFilterStatus('all')
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            ) : null}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPrograms.map((program) => (
            <Card
              key={program.id}
              className="border-och-steel/20 hover:border-och-defender/50 transition-colors"
            >
              {editingId === program.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Edit Program</h3>
                    <Badge variant="defender">Editing</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                      />
                    </div>

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
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Duration (months)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.duration_months || 6}
                        onChange={(e) =>
                          setFormData({ ...formData, duration_months: parseInt(e.target.value) })
                        }
                        className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Price</label>
                      <input
                        type="number"
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
                      <label className="block text-sm font-medium text-white mb-2">Currency</label>
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
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Status</label>
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

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="mint"
                      onClick={() => program.id && handleUpdate(program.id)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Saving...' : '💾 Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-xl font-semibold text-white">{program.name}</h4>
                        <Badge variant={program.status === 'active' ? 'mint' : 'defender'}>
                          {program.status}
                        </Badge>
                        <Badge variant="steel">{program.category}</Badge>
                      </div>
                      <p className="text-sm text-och-steel mb-3">{program.description}</p>
                      <div className="flex gap-6 text-sm text-och-steel">
                        <span>
                          <strong className="text-white">Duration:</strong> {program.duration_months}{' '}
                          months
                        </span>
                        <span>
                          <strong className="text-white">Price:</strong> {program.currency}{' '}
                          {formatPrice(program.default_price)}
                        </span>
                        <span>
                          <strong className="text-white">Created:</strong>{' '}
                          {program.created_at ? new Date(program.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                        <span>
                          <strong className="text-white">Updated:</strong>{' '}
                          {program.updated_at ? new Date(program.updated_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-och-steel/20">
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
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}


