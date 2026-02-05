'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Plus, Target, Clock, Star } from 'lucide-react'

interface Mission {
  id: string
  title: string
  description: string
  difficulty: number
  mission_type: string
  estimated_duration_min: number
  is_active: boolean
  created_at: string
}

export default function MissionsPage() {
  const router = useRouter()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMissions()
  }, [])

  const fetchMissions = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/missions/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMissions(data.results || [])
      }
    } catch (err) {
      console.error('Failed to fetch missions:', err)
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: number) => {
    const colors = {
      1: 'text-green-400',
      2: 'text-blue-400', 
      3: 'text-yellow-400',
      4: 'text-orange-400',
      5: 'text-red-400'
    }
    return colors[difficulty as keyof typeof colors] || 'text-och-steel'
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Missions</h1>
              <p className="text-och-steel">Manage curriculum missions</p>
            </div>
            <Button
              onClick={() => router.push('/dashboard/director/missions/new')}
              variant="defender"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Mission
            </Button>
          </div>

          {loading ? (
            <Card className="p-8 text-center">
              <p className="text-och-steel">Loading missions...</p>
            </Card>
          ) : missions.length === 0 ? (
            <Card className="p-8 text-center">
              <Target className="w-12 h-12 text-och-steel mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No missions yet</h3>
              <p className="text-och-steel mb-4">Create your first mission to get started</p>
              <Button
                onClick={() => router.push('/dashboard/director/missions/new')}
                variant="defender"
              >
                Create Mission
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {missions.map((mission) => (
                <Card key={mission.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{mission.title}</h3>
                        <div className="flex items-center gap-1">
                          {[...Array(mission.difficulty)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${getDifficultyColor(mission.difficulty)}`} />
                          ))}
                        </div>
                        <span className="px-2 py-1 bg-och-steel/20 text-och-steel text-xs rounded">
                          {mission.mission_type}
                        </span>
                      </div>
                      <p className="text-och-steel text-sm mb-3 line-clamp-2">{mission.description}</p>
                      <div className="flex items-center gap-4 text-xs text-och-steel">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {mission.estimated_duration_min} min
                        </div>
                        <div className={`px-2 py-1 rounded ${mission.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {mission.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}