'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { apiGateway } from '@/services/apiGateway'

export default function MissionsDebugPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [error, setError] = useState<any>(null)
  const [profileData, setProfileData] = useState<any>(null)

  useEffect(() => {
    if (!isAuthenticated || isLoading) return

    const fetchData = async () => {
      try {
        // Test profile API
        const profile = await apiGateway.get('/student/profile')
        setProfileData(profile)

        // Test missions API
        const response = await apiGateway.get('/student/missions', {
          params: { page: 1, page_size: 10 }
        })
        setApiResponse(response)
      } catch (err: any) {
        console.error('API Error:', err)
        setError({
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        })
      }
    }

    fetchData()
  }, [isAuthenticated, isLoading])

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Missions API Debug Page</h1>

      <div className="space-y-6">
        {/* Auth Status */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Authentication Status</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(
              {
                isAuthenticated,
                isLoading,
                user: user ? { id: user.id, email: user.email, username: user.username } : null
              },
              null,
              2
            )}
          </pre>
        </div>

        {/* Profile Data */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Profile API Response</h2>
          <pre className="text-sm overflow-auto max-h-96">
            {profileData ? JSON.stringify(profileData, null, 2) : 'Loading...'}
          </pre>
        </div>

        {/* API Response */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Missions API Response</h2>
          <pre className="text-sm overflow-auto max-h-96">
            {error
              ? JSON.stringify(error, null, 2)
              : apiResponse
              ? JSON.stringify(apiResponse, null, 2)
              : 'Loading...'}
          </pre>
        </div>

        {/* Quick Stats */}
        {apiResponse && (
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Quick Stats</h2>
            <ul className="space-y-2">
              <li>Total Missions: {apiResponse.total || apiResponse.count || 0}</li>
              <li>Results Returned: {apiResponse.results?.length || 0}</li>
              <li>Current Page: {apiResponse.page || 1}</li>
              <li>Has Next: {apiResponse.has_next ? 'Yes' : 'No'}</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
