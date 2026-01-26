'use client'

import { useTheme } from '../lib/hooks/useTheme'
import { Button } from '@/components/ui/Button'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      className="fixed top-4 right-4 z-50"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </Button>
  )
}

