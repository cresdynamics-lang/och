#!/bin/bash
# Script to create missing files on server

cd ~/ongozacyberhub/frontend/nextjs_app/app/dashboard/student

# Create lib directory structure
mkdir -p lib/store lib/hooks

# Create dashboardStore.ts
cat > lib/store/dashboardStore.ts << 'EOF'
import { create } from 'zustand'

interface DashboardStore {
  isSidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  isSidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
}))
EOF

# Create useDashboardCoordination.ts
cat > lib/hooks/useDashboardCoordination.ts << 'EOF'
export function useDashboardCoordination() {
  return { isLoading: false }
}
EOF

# Create useKeyboardShortcuts.ts
cat > lib/hooks/useKeyboardShortcuts.ts << 'EOF'
export function useKeyboardShortcuts() {
  // Keyboard shortcuts implementation
}
EOF

echo "Missing files created"

