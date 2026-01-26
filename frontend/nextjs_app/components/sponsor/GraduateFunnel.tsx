'use client'

interface GraduateFunnelProps {
  ready: number
  cohortSize: number
  gradient?: boolean
}

export function GraduateFunnel({ ready, cohortSize, gradient = true }: GraduateFunnelProps) {
  const percentage = cohortSize > 0 ? (ready / cohortSize) * 100 : 0
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">Graduates Ready</span>
        <span className="text-sm font-bold text-emerald-600">{ready} / {cohortSize}</span>
      </div>
      <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            gradient 
              ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600' 
              : 'bg-emerald-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% ready for hiring</p>
    </div>
  )
}

