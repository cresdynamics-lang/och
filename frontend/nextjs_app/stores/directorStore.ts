/**
 * Zustand store for Program Director state management
 */
import { create } from 'zustand'

interface DirectorState {
  selectedCohorts: string[]
  filters: {
    risk: 'all' | 'high' | 'medium' | 'low'
    track: string
    status: string
    search: string
  }
  setSelected: (cohortId: string, checked: boolean) => void
  clearSelection: () => void
  setFilter: (key: keyof DirectorState['filters'], value: any) => void
  bulkAction: (action: string, cohortIds: string[]) => Promise<void>
}

export const useDirectorStore = create<DirectorState>((set, get) => ({
  selectedCohorts: [],
  filters: {
    risk: 'all',
    track: 'all',
    status: 'running',
    search: '',
  },
  
  setSelected: (cohortId, checked) => {
    set((state) => ({
      selectedCohorts: checked
        ? [...state.selectedCohorts, cohortId]
        : state.selectedCohorts.filter((id) => id !== cohortId),
    }))
  },
  
  clearSelection: () => {
    set({ selectedCohorts: [] })
  },
  
  setFilter: (key, value) => {
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    }))
  },
  
  bulkAction: async (action, cohortIds) => {
    // TODO: Implement bulk actions API calls
    console.log(`Bulk action: ${action} on cohorts:`, cohortIds)
    // Optimistic update + toast notification
    set({ selectedCohorts: [] })
  },
}))

