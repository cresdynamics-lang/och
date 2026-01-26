'use client'

interface SparklineProps {
  data: number[]
  color?: 'success' | 'warning' | 'danger'
  height?: number
}

export function Sparkline({ data, color = 'success', height = 24 }: SparklineProps) {
  if (!data || data.length === 0) return null
  
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((value - min) / range) * 100
    return `${x},${y}`
  }).join(' ')
  
  const colorClasses = {
    success: 'stroke-emerald-500',
    warning: 'stroke-amber-500',
    danger: 'stroke-red-500',
  }
  
  return (
    <svg width="100" height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        strokeWidth="2"
        className={colorClasses[color]}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

