'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { motion } from 'framer-motion'
import { usePortfolio } from '@/hooks/usePortfolio'
import { useAuth } from '@/hooks/useAuth'

const COLORS = {
  approved: '#10b981',
  pending: '#f59e0b',
  rejected: '#ef4444',
  draft: '#64748b',
}

export function PortfolioCard() {
  const router = useRouter()
  const { user } = useAuth()
  const userId = user?.id?.toString()

  const { items, approvedItems, isLoading } = usePortfolio(userId)

  const pendingCount = items.filter(item => item.status === 'in_review' || item.status === 'submitted').length
  const draftCount = items.filter(item => item.status === 'draft').length

  const data = [
    { name: 'Approved', value: approvedItems.length, color: COLORS.approved },
    { name: 'Pending', value: pendingCount, color: COLORS.pending },
    { name: 'Draft', value: draftCount, color: COLORS.draft },
  ].filter(item => item.value > 0)

  const totalItems = items.length
  const approvedPercentage = totalItems > 0 ? Math.round((approvedItems.length / totalItems) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card 
        className="glass-card p-3 md:p-4 hover:glass-hover transition-all cursor-pointer"
        onClick={() => router.push('/dashboard/student/portfolio')}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-och-steel">Portfolio</h3>
          <span className="text-[10px] text-dashboard-accent font-medium">
            {approvedPercentage}%
          </span>
        </div>

        <div className="h-20 mb-2">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-och-steel text-xs">
              Loading...
            </div>
          ) : data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  wrapperStyle={{ fontSize: '10px' }}
                  iconType="circle"
                  formatter={(value) => value}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-och-steel text-xs">
              No portfolio items
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1 text-[10px]">
          <div className="text-center">
            <div className="text-white font-semibold">{approvedItems.length}</div>
            <div className="text-och-steel">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-white font-semibold">{pendingCount}</div>
            <div className="text-och-steel">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-white font-semibold">{totalItems}</div>
            <div className="text-och-steel">Total</div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

