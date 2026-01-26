'use client'

interface MetricCardProps {
  title: string
  value: string | number
  trend?: string
  color: 'blue' | 'green' | 'amber' | 'red'
}

const colorClasses = {
  blue: 'border-blue-500 bg-blue-500/10 text-blue-700',
  green: 'border-emerald-500 bg-emerald-500/10 text-emerald-700',
  amber: 'border-amber-500 bg-amber-500/10 text-amber-700',
  red: 'border-red-500 bg-red-500/10 text-red-700',
}

function MetricCard({ title, value, trend, color }: MetricCardProps) {
  return (
    <div className={`p-6 rounded-xl border-l-4 ${colorClasses[color]} bg-gradient-to-r from-white/50 to-transparent dark:from-och-slate-800/50 dark:to-transparent`}>
      <p className="text-sm font-medium opacity-75 mb-1">{title}</p>
      <p className="text-3xl font-bold mb-1">{value}</p>
      {trend && (
        <p className={`text-xs ${trend.startsWith('+') ? 'text-emerald-600' : trend.startsWith('-') ? 'text-red-600' : 'text-och-steel'}`}>
          {trend}
        </p>
      )}
    </div>
  )
}

interface HeroMetricsProps {
  hero: {
    active_programs: number
    active_cohorts: number
    seats_used: string
    avg_readiness: number
    completion_rate: string
  }
}

export function HeroMetrics({ hero }: HeroMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <MetricCard
        title="Active Cohorts"
        value={hero.active_cohorts}
        trend="+2"
        color="blue"
      />
      <MetricCard
        title="Seats Filled"
        value={hero.seats_used}
        trend="94%"
        color="green"
      />
      <MetricCard
        title="Avg Readiness"
        value={hero.avg_readiness.toFixed(1)}
        trend="+3.2%"
        color="amber"
      />
      <MetricCard
        title="Completion Rate"
        value={hero.completion_rate}
        trend="-1.2%"
        color="red"
      />
    </div>
  )
}

