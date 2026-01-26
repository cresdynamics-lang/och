'use client'

interface ProgressBarProps {
  value: number
  max?: number
  color?: 'success' | 'warning' | 'danger'
  label?: string
  height?: number
}

export function ProgressBar({ value, max = 100, color = 'success', label, height = 8 }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)
  
  const colorClasses = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  }
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full overflow-hidden" style={{ height: `${height}px` }}>
        <div
          className={`h-full transition-all ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {label && <span className="text-sm font-medium text-gray-900">{label}</span>}
    </div>
  )
}

