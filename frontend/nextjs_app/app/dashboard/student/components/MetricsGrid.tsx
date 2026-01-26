'use client'

import { memo } from 'react'
import { ReadinessCard } from './Cards/ReadinessCard'
import { CohortCard } from './Cards/CohortCard'
import { LearningCard } from './Cards/LearningCard'
import { PortfolioCard } from './Cards/PortfolioCard'
import { GamificationCard } from './Cards/GamificationCard'
import { MentorshipCard } from './Cards/MentorshipCard'
import '../styles/dashboard.css'

export const MetricsGrid = memo(function MetricsGrid() {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
      <ReadinessCard />
      <CohortCard />
      <LearningCard />
      <PortfolioCard />
      <GamificationCard />
      <MentorshipCard />
    </div>
  )
})

