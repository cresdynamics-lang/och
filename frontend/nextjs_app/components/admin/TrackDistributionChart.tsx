'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface TrackData {
  name: string
  value: number
  percentage: number
  color: string
}

interface TrackDistributionChartProps {
  data: TrackData[]
}

const COLORS = {
  Builders: '#3B82F6', // Blue
  Leaders: '#10B981', // Green
  Entrepreneurs: '#8B5CF6', // Purple
  Educators: '#F59E0B', // Orange
  Researchers: '#EF4444', // Red
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-och-midnight border border-och-steel/20 rounded-lg p-3 shadow-lg">
        <p className="text-white font-semibold">{data.name}</p>
        <p className="text-och-steel text-sm">
          <span className="text-white font-medium">{data.value}</span> students
        </p>
        <p className="text-och-steel text-sm">
          <span className="text-white font-medium">{data.payload.percentage}%</span> of total
        </p>
      </div>
    )
  }
  return null
}

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  // Only show label if percentage is >= 5%
  if (percent < 0.05) return null

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function TrackDistributionChart({ data }: TrackDistributionChartProps) {
  const chartData = useMemo(() => {
    return data.map((track) => ({
      name: track.name,
      value: track.value,
      percentage: track.percentage,
      color: COLORS[track.name as keyof typeof COLORS] || '#9CA3AF',
    }))
  }, [data])

  const total = useMemo(() => {
    return data.reduce((sum, track) => sum + track.value, 0)
  }, [data])

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">Track Distribution</h3>
        <p className="text-sm text-och-steel">Student enrollment by track</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => (
              <span className="text-och-steel text-sm">
                {value}: {entry.payload.percentage}%
              </span>
            )}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
        {chartData.map((track) => (
          <div
            key={track.name}
            className="flex items-center gap-2 p-2 bg-och-midnight/50 rounded-lg"
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: track.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-medium truncate">{track.name}</p>
              <p className="text-xs text-och-steel">{track.value} students</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


