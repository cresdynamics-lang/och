'use client'

interface MetricCardProps {
  title: string
  value: string | number
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  status?: 'good' | 'warning' | 'danger'
  color?: 'blue' | 'green' | 'amber' | 'red'
}

const statusColors = {
  good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
}

const statusIcons = {
  good: '🟢',
  warning: '🟡',
  danger: '🔴',
}

const statusLabels = {
  good: 'On Track',
  warning: 'Monitor',
  danger: 'Action',
}

function TrendChip({ delta, direction }: { delta: number; direction: 'up' | 'down' | 'neutral' }) {
  const isPositive = direction === 'up'
  const colorClass = isPositive ? 'text-emerald-600' : direction === 'down' ? 'text-red-600' : 'text-gray-600'
  const icon = isPositive ? '↑' : direction === 'down' ? '↓' : '→'
  
  return (
    <div className={`flex items-center gap-1 text-sm font-medium mt-2 ${colorClass}`}>
      <span>{icon}</span>
      <span>{Math.abs(delta).toFixed(1)}%</span>
    </div>
  )
}

export function MetricCard({ title, value, trend, status = 'good', color = 'blue' }: MetricCardProps) {
  return (
    <div className="group p-6 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-200 bg-gradient-to-br from-white/80 backdrop-blur-sm shadow-sm hover:shadow-md animate-pulse-once">
      <style jsx>{`
        @keyframes pulse-once {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.95; }
        }
        .animate-pulse-once {
          animation: pulse-once 2s ease-in-out;
        }
      `}</style>
      <div className="flex items-center justify-between mb-2">
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[status]}`}>
          {statusIcons[status]} {statusLabels[status]}
        </span>
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">{value}</p>
      {trend && (
        <TrendChip delta={trend.value} direction={trend.direction} />
      )}
    </div>
  )
}

