import { create } from 'zustand'

export interface Mission {
  id: number
  mission_id?: number
  title: string
  description: string
  tier: 'entry' | 'intermediate' | 'advanced' | 'capstone'
  track: string
  status?: 'not_started' | 'in_progress' | 'completed' | 'blocked'
  deadline?: string | Date
  xp_value?: number
  difficulty_score?: number
  estimated_hours?: number
  subtasks?: Subtask[]
}

export interface Subtask {
  id: number
  title: string
  description?: string
  order_index: number
  is_required: boolean
  xp_value?: number
  status?: 'not_started' | 'in_progress' | 'completed'
}

export interface MissionProgress {
  id: number
  mission_id: number
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked'
  started_at?: string
  completed_at?: string
  time_spent_minutes?: number
  subtasks_progress?: Record<string, any>
}

interface MissionStoreState {
  currentMission: Mission | null
  currentSubtask: Subtask | null
  subtasks: Subtask[]
  currentProgress: MissionProgress | null
  subtasksProgress: Record<number, any>
  setCurrentMission: (mission: Mission | null) => void
  setCurrentSubtask: (subtask: Subtask | null) => void
  setSubtasks: (subtasks: Subtask[]) => void
  setCurrentProgress: (progress: MissionProgress | null) => void
  updateSubtaskProgress: (subtaskId: number, progress: any) => void
  clearMissionData: () => void
}

export const useMissionStore = create<MissionStoreState>((set) => ({
  currentMission: null,
  currentSubtask: null,
  subtasks: [],
  currentProgress: null,
  subtasksProgress: {},

  setCurrentMission: (mission) => set({ currentMission: mission }),

  setCurrentSubtask: (subtask) => set({ currentSubtask: subtask }),

  setSubtasks: (subtasks) => set({ subtasks }),

  setCurrentProgress: (progress) => set({
    currentProgress: progress,
    subtasksProgress: progress?.subtasks_progress || {}
  }),

  updateSubtaskProgress: (subtaskId, progress) => set((state) => ({
    subtasksProgress: {
      ...state.subtasksProgress,
      [subtaskId]: progress
    }
  })),

  clearMissionData: () => set({
    currentMission: null,
    currentSubtask: null,
    subtasks: [],
    currentProgress: null,
    subtasksProgress: {}
  })
}))
