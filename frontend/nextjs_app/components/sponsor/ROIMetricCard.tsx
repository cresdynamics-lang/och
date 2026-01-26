'use client'

interface ROIMetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
    label?: string
  }
  roiColor?: {
    bg: string
  }
  icon: string
}

function TrendChip({ delta, direction, label, size = 'md' }: { 
  delta: number
  direction: 'up' | 'down' | 'neutral'
  label?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const isPositive = direction === 'up'
  const colorClass = isPositive 
    ? 'text-och-mint bg-och-mint/20' 
    : direction === 'down' 
    ? 'text-och-orange bg-och-orange/20' 
    : 'text-och-steel bg-och-steel/20'
  const icon = isPositive ? '↑' : direction === 'down' ? '↓' : '→'
  const sizeClass = size === 'lg' ? 'px-4 py-2 text-sm' : size === 'md' ? 'px-3 py-1.5 text-xs' : 'px-2 py-1 text-xs'
  
  return (
    <div className={`flex items-center gap-1.5 ${colorClass} ${sizeClass} rounded-full font-semibold`}>
      <span>{icon}</span>
      <span>{Math.abs(delta).toFixed(1)}%</span>
      {label && <span className="text-xs opacity-75">{label}</span>}
    </div>
  )
}

export function ROIMetricCard({ title, value, subtitle, trend, roiColor = { bg: 'bg-och-mint/20' }, icon }: ROIMetricCardProps) {
  return (
    <div className="group relative p-8 rounded-xl border border-och-steel/20 hover:border-och-steel/40 bg-och-midnight transition-all duration-300 overflow-hidden">
      {/* Gradient Badge */}
      <div className={`absolute top-0 right-0 w-24 h-24 ${roiColor.bg} opacity-20 rotate-12`} />
      
      <div className="relative z-10 flex items-start justify-between mb-4">
        <div className="p-3 bg-och-midnight border border-och-steel/20 rounded-lg">
          <div className="text-2xl">{icon}</div>
        </div>
        {trend && (
          <TrendChip 
            delta={trend.value} 
            direction={trend.direction}
            label={trend.label}
            size="lg"
          />
        )}
      </div>

      <h3 className="text-sm font-semibold text-och-steel uppercase tracking-wide mb-1">{title}</h3>
      <p className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-1">
        {value}
      </p>
      {subtitle && <p className="text-sm text-och-steel">{subtitle}</p>}
    </div>
  )
}

