import React from 'react'

interface ChartProps {
  data: Array<{ label: string; value: number; color?: string }>
  title?: string
  type?: 'bar' | 'line' | 'pie'
}

export function SimpleChart({ data, title, type = 'bar' }: ChartProps) {
  const maxValue = Math.max(...data.map(d => d.value))

  if (type === 'bar') {
    return (
      <div className="space-y-4">
        {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-20 text-sm text-och-steel text-right">{item.label}</div>
              <div className="flex-1 bg-och-midnight/50 rounded-full h-6 relative">
                <div
                  className={`h-full rounded-full ${item.color || 'bg-och-defender'}`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
                <span className="absolute right-2 top-0 h-full flex items-center text-xs text-white">
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'line') {
    return (
      <div className="space-y-4">
        {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
        <div className="h-48 flex items-end justify-between gap-2 border-b border-och-steel/20 pb-2">
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center gap-2 flex-1">
              <div
                className={`w-full ${item.color || 'bg-och-defender'} rounded-t`}
                style={{ height: `${(item.value / maxValue) * 100}%` }}
              />
              <span className="text-xs text-och-steel text-center">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
      <div className="grid grid-cols-2 gap-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-och-midnight/30 rounded">
            <div className={`w-4 h-4 rounded-full ${item.color || 'bg-och-defender'}`} />
            <div>
              <p className="text-white font-medium">{item.label}</p>
              <p className="text-och-steel text-sm">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  color?: 'mint' | 'defender' | 'orange' | 'gold'
}

export function MetricCard({ title, value, change, color = 'defender' }: MetricCardProps) {
  const colorClasses = {
    mint: 'text-och-mint',
    defender: 'text-och-defender',
    orange: 'text-och-orange',
    gold: 'text-och-gold'
  }

  return (
    <div className="p-4 bg-och-midnight/30 rounded-lg">
      <p className="text-och-steel text-sm mb-1">{title}</p>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
      {change !== undefined && (
        <p className={`text-sm mt-1 ${change >= 0 ? 'text-och-mint' : 'text-och-orange'}`}>
          {change >= 0 ? '+' : ''}{change}%
        </p>
      )}
    </div>
  )
}