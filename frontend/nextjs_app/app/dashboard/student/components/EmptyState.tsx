'use client'

import { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}

export function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <Card className="glass-card p-6 text-center">
      {icon && <div className="mb-4 text-4xl">{icon}</div>}
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      {description && <p className="text-och-steel mb-4">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="mint" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Card>
  )
}

