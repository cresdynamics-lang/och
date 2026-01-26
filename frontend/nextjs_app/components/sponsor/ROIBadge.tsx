'use client'

interface ROIBadgeProps {
  score: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

export function ROIBadge({ score, max = 10, size = 'md', showTooltip = true }: ROIBadgeProps) {
  const percentage = (score / max) * 100
  const colorClass = percentage >= 80 ? 'text-emerald-600' : percentage >= 60 ? 'text-amber-600' : 'text-red-600'
  const bgClass = percentage >= 80 ? 'bg-emerald-50' : percentage >= 60 ? 'bg-amber-50' : 'bg-red-50'
  const icon = percentage >= 80 ? '🟢' : percentage >= 60 ? '🟡' : '🔴'
  
  const sizeClass = size === 'lg' ? 'text-2xl font-black' : size === 'md' ? 'text-xl font-bold' : 'text-lg font-semibold'
  
  return (
    <div className="group relative">
      <div className={`${sizeClass} ${colorClass} flex items-center gap-2`}>
        <span>{icon}</span>
        <span>{score.toFixed(1)}</span>
      </div>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {score.toFixed(1)}/{max} = {percentage.toFixed(0)}% graduate rate vs 85% avg
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  )
}

export function ROIHeatmap({ score, max = 10, size = 'lg' }: { score: number; max?: number; size?: 'sm' | 'md' | 'lg' }) {
  const percentage = (score / max) * 100
  const width = size === 'lg' ? 'w-20' : size === 'md' ? 'w-16' : 'w-12'
  const height = size === 'lg' ? 'h-3' : size === 'md' ? 'h-2.5' : 'h-2'
  
  const colorClass = percentage >= 80 ? 'bg-emerald-500' : percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'
  
  return (
    <div className={`${width} ${height} bg-gray-200 rounded-full overflow-hidden`}>
      <div
        className={`${colorClass} h-full transition-all duration-500`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  )
}

