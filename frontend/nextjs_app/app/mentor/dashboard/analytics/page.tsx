'use client'

import { TalentScopeView } from '@/components/mentor/TalentScopeView'
import { InfluenceAnalytics } from '@/components/mentor/InfluenceAnalytics'
import { Card } from '@/components/ui/Card'

export default function AnalyticsPage() {
  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-och-mint">Analytics & Performance</h1>
        <p className="text-och-steel text-sm max-w-3xl">
          Track mentee performance using TalentScope analytics, measure your influence on mentee growth, 
          and make evidence-based decisions to guide transformation. Access comprehensive data including 
          Core Readiness Scores, skill heatmaps, behavioral trends, and gap analysis.
        </p>
      </div>

      <div className="space-y-6">
        {/* Mentor Influence Index - Premium Tier Metric */}
        <Card>
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">Mentor Influence Index</h2>
              <p className="text-sm text-och-steel">
                Measure the correlation between your feedback, sessions, and mentee performance improvements. 
                This metric is specifically designed for Premium tier mentees and tracks your impact on mentee growth.
              </p>
            </div>
        <InfluenceAnalytics />
          </div>
        </Card>

        {/* TalentScope Mentor View */}
        <Card>
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">TalentScope Analytics</h2>
              <p className="text-sm text-och-steel">
                Comprehensive performance tracking with Core Readiness Score, skill heatmaps, behavioral trends, 
                and gap analysis. View readiness breakdown and Professional tier data including job fit scores 
                and hiring timeline predictions.
              </p>
            </div>
        <TalentScopeView />
          </div>
        </Card>
      </div>
    </div>
  )
}


