'use client'

import { useState, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'

interface APIKey {
  id: number
  name: string
  key_prefix: string
  key_type: string
  is_active: boolean
  created_at: string
}

export default function APIKeysPage() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadApiKeys()
  }, [])

  const loadApiKeys = async () => {
    try {
      setIsLoading(true)
      const data = await apiGateway.get<APIKey[]>('/api-keys/')
      setApiKeys(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load API keys:', error)
      setApiKeys([])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <RouteGuard>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
              <p className="text-och-steel">Loading API keys...</p>
            </div>
          </div>
        </AdminLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-och-gold">API Keys</h1>
              <p className="text-och-steel">Manage API keys and access tokens</p>
            </div>
            <Button variant="defender" size="sm">
              + Create API Key
            </Button>
          </div>

          <Card>
            <div className="p-6">
              {apiKeys.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-och-steel mb-4">No API keys found</p>
                  <Button variant="defender" size="sm">
                    Create Your First API Key
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-och-steel/20">
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Name</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Key Prefix</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Type</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Status</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Created</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiKeys.map((key) => (
                        <tr key={key.id} className="border-b border-och-steel/10 hover:bg-och-midnight/50">
                          <td className="p-3 text-white font-semibold">{key.name}</td>
                          <td className="p-3 text-och-steel text-sm font-mono">{key.key_prefix}...</td>
                          <td className="p-3">
                            <Badge variant="steel" className="text-xs">
                              {key.key_type}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant={key.is_active ? 'mint' : 'orange'}>
                              {key.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="p-3 text-och-steel text-sm">
                            {new Date(key.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <Button variant="outline" size="sm">
                              Revoke
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}

