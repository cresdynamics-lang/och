/**
 * Zustand store for MXP Mission state management
 */
import { create } from 'zustand'
import type { Mission, MissionProgress, Subtask } from '../../types'

interface MissionState {
  // Current mission
  currentMission: Mission | null
  currentProgress: MissionProgress | null
  
  // Dashboard data
  availableMissions: Mission[]
  inProgressMissions: MissionProgress[]
  completedMissions: MissionProgress[]
  
  // Subtask state
  currentSubtask: number
  subtasks: Subtask[]
  subtasksProgress: Record<number, { completed: boolean; evidence: string[]; notes: string }>
  
  // Recipe recommendations
  availableRecipes: any[]
  
  // Feedback
  aiFeedback: any | null
  mentorFeedback: any | null
  
  // Subscription
  userTier: 'free' | '$3-starter' | '$7-premium'
  tierLock: boolean
  
  // UI state
  canSubmit: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  setCurrentMission: (mission: Mission | null) => void
  setCurrentProgress: (progress: MissionProgress | null) => void
  setAvailableMissions: (missions: Mission[]) => void
  setInProgressMissions: (progress: MissionProgress[]) => void
  setCompletedMissions: (progress: MissionProgress[]) => void
  setCurrentSubtask: (subtask: number) => void
  setSubtasks: (subtasks: Subtask[]) => void
  updateSubtaskProgress: (subtaskNumber: number, progress: { completed: boolean; evidence: string[]; notes: string }) => void
  setAvailableRecipes: (recipes: any[]) => void
  setAIFeedback: (feedback: any | null) => void
  setMentorFeedback: (feedback: any | null) => void
  setUserTier: (tier: 'free' | '$3-starter' | '$7-premium') => void
  setTierLock: (lock: boolean) => void
  setCanSubmit: (can: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  currentMission: null,
  currentProgress: null,
  availableMissions: [],
  inProgressMissions: [],
  completedMissions: [],
  currentSubtask: 1,
  subtasks: [],
  subtasksProgress: {},
  availableRecipes: [],
  aiFeedback: null,
  mentorFeedback: null,
  userTier: 'free' as const,
  tierLock: false,
  canSubmit: false,
  isLoading: false,
  error: null,
}

export const useMissionStore = create<MissionState>((set) => ({
  ...initialState,
  
  setCurrentMission: (mission) => set({ currentMission: mission }),
  setCurrentProgress: (progress) => set({ currentProgress: progress }),
  setAvailableMissions: (missions) => set({ availableMissions: missions }),
  setInProgressMissions: (progress) => set({ inProgressMissions: progress }),
  setCompletedMissions: (progress) => set({ completedMissions: progress }),
  setCurrentSubtask: (subtask) => set({ currentSubtask: subtask }),
  setSubtasks: (subtasks) => set({ subtasks }),
  updateSubtaskProgress: (subtaskNumber, progress) =>
    set((state) => ({
      subtasksProgress: {
        ...state.subtasksProgress,
        [subtaskNumber]: progress,
      },
    })),
  setAvailableRecipes: (recipes) => set({ availableRecipes: recipes }),
  setAIFeedback: (feedback) => set({ aiFeedback: feedback }),
  setMentorFeedback: (feedback) => set({ mentorFeedback: feedback }),
  setUserTier: (tier) => set({ userTier: tier }),
  setTierLock: (lock) => set({ tierLock: lock }),
  setCanSubmit: (can) => set({ canSubmit: can }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}))

