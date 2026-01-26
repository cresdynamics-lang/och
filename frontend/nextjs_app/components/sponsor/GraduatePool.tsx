'use client'

import { useState } from 'react'
import { sponsorClient } from '@/services/sponsorClient'

interface Graduate {
  user_id: string
  name?: string
  name_anonymized?: string
  readiness_score: number | null
  portfolio_health: number | null
  cohort_name?: string
  consent_employer_share: boolean
  contact_allowed: boolean
  cv_generated?: boolean
  avatar?: string
}

interface GraduatePoolProps {
  graduates: Graduate[]
  onRequestCV?: (userId: string) => void
  onRequestConsent?: (userId: string) => void
}

function ReadinessChip({ score }: { score: number | null }) {
  if (!score) return <span className="text-xs text-gray-400">N/A</span>
  
  const colorClass = score >= 80 ? 'bg-emerald-100 text-emerald-700' : score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      {score.toFixed(0)}% Ready
    </span>
  )
}

function GraduateCard({ graduate, onRequestCV, onRequestConsent }: { 
  graduate: Graduate
  onRequestCV?: (userId: string) => void
  onRequestConsent?: (userId: string) => void
}) {
  const displayName = graduate.name || graduate.name_anonymized || 'Graduate'
  
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-gray-200 hover:border-emerald-300 transition-all hover:shadow-md">
      {/* Avatar */}
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
        {displayName[0].toUpperCase()}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm sm:text-base text-gray-900 truncate">{displayName}</div>
        <div className="text-xs sm:text-sm text-gray-500">{graduate.cohort_name || 'Graduated'}</div>
      </div>
      
      {/* Readiness */}
      <ReadinessChip score={graduate.readiness_score} />
      
      {/* Actions */}
      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
        {graduate.consent_employer_share ? (
          <>
            {graduate.cv_generated && (
              <button
                onClick={() => onRequestCV?.(graduate.user_id)}
                className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-semibold flex-1 sm:flex-none"
              >
                View CV
              </button>
            )}
            {graduate.contact_allowed && (
              <button
                className="px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs font-semibold flex-1 sm:flex-none"
              >
                Contact
              </button>
            )}
          </>
        ) : (
          <button
            onClick={() => onRequestConsent?.(graduate.user_id)}
            className="w-full sm:w-auto px-2 sm:px-3 py-1 sm:py-1.5 border border-amber-300 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors text-xs font-semibold flex items-center justify-center gap-1"
          >
            🔒 Request Profile Sharing
          </button>
        )}
      </div>
    </div>
  )
}

export function GraduatePool({ graduates, onRequestCV, onRequestConsent }: GraduatePoolProps) {
  const [loading, setLoading] = useState(false)

  const handleRequestCV = async (userId: string) => {
    setLoading(true)
    try {
      await sponsorClient.requestGraduateCV(userId)
      onRequestCV?.(userId)
    } catch (error) {
      console.error('Failed to request CV:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestConsent = async (userId: string) => {
    setLoading(true)
    try {
      // TODO: Implement consent request API
      console.log('Request consent for:', userId)
      onRequestConsent?.(userId)
    } catch (error) {
      console.error('Failed to request consent:', error)
    } finally {
      setLoading(false)
    }
  }

  if (graduates.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🎓 Top Graduates Ready for Hiring</h3>
        <p className="text-gray-500 text-center py-8">No graduates available yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">🎓 Top Graduates Ready for Hiring</h3>
        <span className="text-sm text-gray-500">{graduates.length} available</span>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {graduates.map((graduate) => (
          <GraduateCard
            key={graduate.user_id}
            graduate={graduate}
            onRequestCV={handleRequestCV}
            onRequestConsent={handleRequestConsent}
          />
        ))}
      </div>
    </div>
  )
}


