'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function useMissionNavigation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const navigateToMission = (missionId: string) => {
    router.push(`/dashboard/student/missions?mission=${missionId}`)
  }
  
  const getSelectedMissionId = () => {
    return searchParams.get('mission')
  }
  
  return { navigateToMission, getSelectedMissionId }
}

