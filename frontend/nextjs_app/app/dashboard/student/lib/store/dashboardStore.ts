import { create } from 'zustand';

interface NextAction {
  id: string;
  type: 'mission' | 'coaching' | 'curriculum' | 'mentorship';
  title: string;
  urgency: 'low' | 'medium' | 'high';
  dueDate?: Date;
}

interface StudentDashboardState {
  nextActions: NextAction[];
  isLoading: boolean;
  isSidebarCollapsed: boolean;
  setNextActions: (actions: NextAction[]) => void;
  setLoading: (loading: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  addNextAction: (action: NextAction) => void;
  removeNextAction: (id: string) => void;
}

export const useDashboardStore = create<StudentDashboardState>((set) => ({
  nextActions: [],
  isLoading: false,
  isSidebarCollapsed: false,
  setNextActions: (actions) => set({ nextActions: actions }),
  setLoading: (loading) => set({ isLoading: loading }),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  addNextAction: (action) => set((state) => ({ 
    nextActions: [...state.nextActions, action] 
  })),
  removeNextAction: (id) => set((state) => ({ 
    nextActions: state.nextActions.filter(action => action.id !== id) 
  })),
}));