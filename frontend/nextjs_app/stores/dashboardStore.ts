import { create } from 'zustand';

interface NextAction {
  id: string;
  type: 'mission' | 'coaching' | 'curriculum' | 'mentorship';
  title: string;
  urgency: 'low' | 'medium' | 'high';
  dueDate?: Date;
}

interface DashboardState {
  nextActions: NextAction[];
  isLoading: boolean;
  setNextActions: (actions: NextAction[]) => void;
  setLoading: (loading: boolean) => void;
  addNextAction: (action: NextAction) => void;
  removeNextAction: (id: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  nextActions: [],
  isLoading: false,
  setNextActions: (actions) => set({ nextActions: actions }),
  setLoading: (loading) => set({ isLoading: loading }),
  addNextAction: (action) => set((state) => ({ 
    nextActions: [...state.nextActions, action] 
  })),
  removeNextAction: (id) => set((state) => ({ 
    nextActions: state.nextActions.filter(action => action.id !== id) 
  })),
}));