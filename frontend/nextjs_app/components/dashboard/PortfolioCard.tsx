'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { usePortfolio } from '@/hooks/usePortfolio'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

export function PortfolioCard() {
  const { user } = useAuth()
  const menteeId = user?.id?.toString()
  const { items, healthMetrics, isLoading, error, createItem } = usePortfolio(menteeId)
  const latestItem = Array.isArray(items) && items.length > 0 ? items[0] : null
  const [showAddModal, setShowAddModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills: '',
    mission_id: '',
    file: null as File | null,
  })

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setAdding(true)
    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean)
      await createItem({
        title: formData.title,
        description: formData.description,
        skills: skillsArray,
        mission_id: formData.mission_id || undefined,
        file: formData.file || undefined,
      })
      setShowAddModal(false)
      setFormData({
        title: '',
        description: '',
        skills: '',
        mission_id: '',
        file: null,
      })
    } catch (err: any) {
      alert(err.message || 'Failed to add portfolio item')
    } finally {
      setAdding(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-och-steel/20 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-och-steel/20 rounded w-full"></div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="mb-6">
        <div className="text-och-orange">Error loading portfolio: {error}</div>
      </Card>
    )
  }

  return (
    <>
      <Card className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Portfolio</h2>
          <Button
            variant="defender"
            size="sm"
            onClick={() => setShowAddModal(true)}
          >
            Add Item
          </Button>
        </div>

        {/* Latest Item */}
        {latestItem ? (
          <div className="p-4 bg-och-midnight/50 rounded-lg mb-4">
            <h3 className="font-semibold text-white mb-2">{latestItem.title}</h3>
            <p className="text-sm text-och-steel mb-3">{latestItem.description}</p>
            {Array.isArray(latestItem.skills) && latestItem.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {latestItem.skills.map((skill: string, idx: number) => (
                  <Badge key={idx} variant="defender" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
            {latestItem.mission_id && (
              <Link href={`/dashboard/student/missions/${latestItem.mission_id}`}>
                <Button variant="outline" size="sm">View Mission</Button>
              </Link>
            )}
            <p className="text-xs text-och-steel mt-3">
              Added {latestItem.created_at ? new Date(latestItem.created_at).toLocaleDateString() : 'Recently'}
            </p>
          </div>
        ) : (
          <div className="text-center py-8 text-och-steel">
            <p>No portfolio items yet. Add your first item to get started!</p>
          </div>
        )}

        {/* Counts */}
        {items.length > 0 && (
          <div className="text-sm text-och-steel">
            Total Items: {items.length}
          </div>
        )}
      </Card>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-och-midnight border border-och-steel/20 rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-2xl font-bold text-white mb-4">Add Portfolio Item</h3>
          <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-och-steel mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                  required
                  disabled={adding}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-och-steel mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender min-h-[100px]"
                  disabled={adding}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-och-steel mb-1">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="e.g., Python, Security, Networking"
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                  disabled={adding}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-och-steel mb-1">
                  Mission ID (optional)
                </label>
                <input
                  type="text"
                  value={formData.mission_id}
                  onChange={(e) => setFormData({ ...formData, mission_id: e.target.value })}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                  disabled={adding}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-och-steel mb-1">
                  File (optional)
                </label>
                <input
                  type="file"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                  disabled={adding}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                  disabled={adding}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="defender"
                  className="flex-1"
                  disabled={adding || !formData.title.trim()}
                >
                  {adding ? 'Adding...' : 'Add Item'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
