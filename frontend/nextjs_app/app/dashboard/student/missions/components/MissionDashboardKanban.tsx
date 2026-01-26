/**
 * Mission Dashboard Kanban Component
 * Drag-drop kanban board for mission management
 */
'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { apiGateway } from '@/services/apiGateway'
import { useMissionStore } from '@/lib/stores/missionStore'
import { MissionCardEnhanced } from './MissionCardEnhanced'
import { MissionBlockerBanner } from '@/components/ui/coaching/MissionBlockerBanner'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Mission } from '../types'

interface MissionDashboardKanbanProps {
  track?: string
  tier?: string
}

const columns = [
  { 
    id: 'locked', 
    label: '🔒 Locked', 
    color: 'steel', 
    bgColor: 'bg-dashboard-card/50', 
    borderColor: 'border-och-steel/30',
    accentColor: 'text-och-steel',
    glowColor: 'rgba(168, 176, 184, 0.2)'
  },
  { 
    id: 'available', 
    label: '▶️ Available', 
    color: 'primary', 
    bgColor: 'bg-dashboard-card/60', 
    borderColor: 'border-mission-primary/40',
    accentColor: 'text-mission-primary',
    glowColor: 'rgba(59, 130, 246, 0.3)'
  },
  { 
    id: 'in_progress', 
    label: '⚡ In Progress', 
    color: 'warning', 
    bgColor: 'bg-dashboard-card/60', 
    borderColor: 'border-mission-warning/40',
    accentColor: 'text-mission-warning',
    glowColor: 'rgba(245, 158, 11, 0.3)'
  },
  { 
    id: 'completed', 
    label: '✅ Completed', 
    color: 'success', 
    bgColor: 'bg-dashboard-card/60', 
    borderColor: 'border-mission-success/40',
    accentColor: 'text-mission-success',
    glowColor: 'rgba(16, 185, 129, 0.3)'
  },
]

export function MissionDashboardKanban({ track = 'defender', tier = 'beginner' }: MissionDashboardKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [missionsByColumn, setMissionsByColumn] = useState<Record<string, Mission[]>>({
    locked: [],
    available: [],
    in_progress: [],
    completed: [],
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ['mission-dashboard', track, tier],
    queryFn: async () => {
      try {
        const response = await apiGateway.get<{
          available_missions: Mission[]
          locked_missions?: Array<{ mission: Mission; gates: any[]; warnings: any[] }>
          in_progress_missions: Array<{ id: string; mission: Mission; status: string }>
          completed_missions: Array<{ id: string; mission: Mission; final_status: string }>
          coaching_eligibility?: any
        }>(`/missions/dashboard?track=${track}&tier=${tier}`)
        return response
      } catch (error: any) {
        console.error('Failed to load missions:', error)
        // Return empty structure on error to prevent white screen
        return {
          available_missions: [],
          in_progress_missions: [],
          completed_missions: [],
        }
      }
    },
    retry: 1,
    staleTime: 30000,
  })

  useEffect(() => {
    if (data) {
      const lockedMissions = (data.locked_missions || []).map((item: any) => ({
        ...item.mission,
        status: 'locked' as const,
        gates: item.gates,
        warnings: item.warnings,
      }))
      setMissionsByColumn({
        locked: lockedMissions,
        available: data.available_missions.map((m) => ({ ...m, status: 'available' as const })),
        in_progress: data.in_progress_missions.map((p: any) => ({
          ...p.mission,
          status: 'in_progress' as const,
        })),
        completed: data.completed_missions.map((p: any) => ({
          ...p.mission,
          status: 'completed' as const,
        })),
      })
    }
  }, [data])

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    try {
      const activeColumn = Object.keys(missionsByColumn).find((col) =>
        missionsByColumn[col].some((m: Mission) => m.id === active.id)
      )
      const overColumn = over.id as string

      if (!activeColumn) return

      if (activeColumn === overColumn) {
        // Reorder within same column
        const columnMissions = missionsByColumn[activeColumn]
        const oldIndex = columnMissions.findIndex((m: Mission) => m.id === active.id)
        const newIndex = columnMissions.findIndex((m: Mission) => m.id === over.id)

        if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1) {
          setMissionsByColumn({
            ...missionsByColumn,
            [activeColumn]: arrayMove(columnMissions, oldIndex, newIndex),
          })
        }
      } else {
        // Move to different column
        const sourceColumn = missionsByColumn[activeColumn]
        const destinationColumn = missionsByColumn[overColumn] || []
        const mission = sourceColumn.find((m: Mission) => m.id === active.id)

        if (mission) {
          setMissionsByColumn({
            ...missionsByColumn,
            [activeColumn]: sourceColumn.filter((m: Mission) => m.id !== active.id),
            [overColumn]: [...destinationColumn, { ...mission, status: overColumn as any }],
          })

          // TODO: Update mission status via API
          // apiGateway.patch(`/missions/${mission.id}`, { status: overColumn })
        }
      }
    } catch (error) {
      console.error('Error handling drag end:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {columns.map((col) => (
          <div key={col.id} className="h-[400px] bg-dashboard-card/30 rounded-xl animate-pulse border border-och-steel/20" />
        ))}
      </div>
    )
  }

  if (queryError) {
    return (
      <div className="p-6">
        <Card className="p-6 text-center border-och-error/30">
          <h3 className="text-lg font-bold text-och-error mb-2">Error Loading Dashboard</h3>
          <p className="text-och-steel mb-4">
            {queryError instanceof Error ? queryError.message : 'Failed to load mission dashboard'}
          </p>
          <Button variant="defender" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <Card className="p-6 text-center glass-card border-och-steel/30">
          <p className="text-och-steel">No mission data available</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dashboard-bg p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-black bg-gradient-to-r from-och-mint via-dashboard-accent to-och-mint bg-clip-text text-transparent mb-2">
          Mission Control Center
        </h1>
        <p className="text-och-steel">
          Track: <span className="font-semibold text-och-mint capitalize">{track}</span> • Tier: <span className="font-semibold text-och-mint capitalize">{tier}</span>
        </p>
      </div>

      {/* Coaching Eligibility Banner */}
      {data?.coaching_eligibility && (
        <div className="mb-6">
          <MissionBlockerBanner eligibility={data.coaching_eligibility} />
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map((column) => {
            const missions = missionsByColumn[column.id] || []
            return (
              <div
                key={column.id}
                className={`p-4 rounded-xl border-2 ${column.borderColor} ${column.bgColor} min-h-[400px] backdrop-blur-sm glass-card`}
                style={{
                  boxShadow: `0 4px 20px ${column.glowColor}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                }}
                role="region"
                aria-label={`${column.label} missions`}
              >
                <h3 className={`text-lg font-bold mb-4 flex items-center ${column.accentColor}`}>
                  <span 
                    className={`w-3 h-3 rounded-full mr-2`}
                    style={{ 
                      backgroundColor: column.id === 'locked' ? '#A8B0B8' : 
                                      column.id === 'available' ? '#3B82F6' :
                                      column.id === 'in_progress' ? '#F59E0B' : '#10B981',
                      boxShadow: `0 0 8px ${column.glowColor}`
                    }}
                  />
                  {column.label}
                  <Badge variant="steel" className="ml-2 bg-och-midnight/50 text-och-steel border-och-steel/30">
                    {missions.length}
                  </Badge>
                </h3>

                {missions.length > 0 ? (
                  <SortableContext
                    items={missions.map((m: Mission) => m.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      <AnimatePresence>
                        {missions.map((mission: Mission) => (
                          <motion.div
                            key={mission.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                          >
                            <MissionCardEnhanced 
                              mission={mission}
                              isDragging={activeId === mission.id}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </SortableContext>
                ) : (
                  <div className="text-center text-och-steel/50 py-8">
                    <p className="text-sm">No missions</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="opacity-90">
              {Object.values(missionsByColumn)
                .flat()
                .find((m: Mission) => m.id === activeId) && (
                <MissionCardEnhanced
                  mission={Object.values(missionsByColumn)
                    .flat()
                    .find((m: Mission) => m.id === activeId)!}
                  isDragging
                />
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

