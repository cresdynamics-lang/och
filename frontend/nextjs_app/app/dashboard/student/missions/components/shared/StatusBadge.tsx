/**
 * Status Badge Component
 * Displays mission/subtask status with color coding
 */
'use client'

import { Badge } from '@/components/ui/Badge'
import { CheckCircle2, Clock, Lock, XCircle } from 'lucide-react'

interface StatusBadgeProps {
  status: 'locked' | 'available' | 'in_progress' | 'completed' | 'failed'
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusConfig = {
    locked: {
      label: 'Locked',
      variant: 'steel' as const,
      icon: Lock,
      color: 'text-slate-500',
    },
    available: {
      label: 'Available',
      variant: 'mint' as const,
      icon: Clock,
      color: 'text-blue-500',
    },
    in_progress: {
      label: 'In Progress',
      variant: 'orange' as const,
      icon: Clock,
      color: 'text-yellow-500',
    },
    completed: {
      label: 'Completed',
      variant: 'mint' as const,
      icon: CheckCircle2,
      color: 'text-green-500',
    },
    failed: {
      label: 'Failed',
      variant: 'defender' as const,
      icon: XCircle,
      color: 'text-red-500',
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${className}`}>
      <Icon className={`w-3 h-3 ${config.color}`} />
      <span>{config.label}</span>
    </Badge>
  )
}

