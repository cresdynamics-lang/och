'use client'

import { useState } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function DataSourcesPage() {
  const [isLoading] = useState(false)
  const dataSources: any[] = []

  return (
    <RouteGuard>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-mint">Data Sources</h1>
            <p className="text-och-steel">Manage and monitor data source connections.</p>
          </div>
          <Button variant="mint">Add Data Source</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-center">
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-och-steel/20 rounded w-16 mx-auto mb-2"></div>
                  <div className="h-4 bg-och-steel/20 rounded w-24 mx-auto"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-och-steel mb-1">0</div>
                  <div className="text-sm text-och-steel">Total Sources</div>
                </>
              )}
            </div>
          </Card>
          <Card>
            <div className="text-center">
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-och-steel/20 rounded w-16 mx-auto mb-2"></div>
                  <div className="h-4 bg-och-steel/20 rounded w-24 mx-auto"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-och-steel mb-1">0</div>
                  <div className="text-sm text-och-steel">Active</div>
                </>
              )}
            </div>
          </Card>
          <Card>
            <div className="text-center">
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-och-steel/20 rounded w-16 mx-auto mb-2"></div>
                  <div className="h-4 bg-och-steel/20 rounded w-24 mx-auto"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-och-steel mb-1">0</div>
                  <div className="text-sm text-och-steel">Syncing</div>
                </>
              )}
            </div>
          </Card>
          <Card>
            <div className="text-center">
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-och-steel/20 rounded w-24 mx-auto mb-2"></div>
                  <div className="h-4 bg-och-steel/20 rounded w-28 mx-auto"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-och-steel mb-1">0</div>
                  <div className="text-sm text-och-steel">Total Records</div>
                </>
              )}
            </div>
          </Card>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <div className="animate-pulse p-4">
                  <div className="h-6 bg-och-steel/20 rounded w-1/3 mb-3"></div>
                  <div className="h-4 bg-och-steel/20 rounded w-2/3 mb-4"></div>
                  <div className="h-4 bg-och-steel/20 rounded w-1/2"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : dataSources.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-och-steel mb-4">No data sources configured</p>
              <p className="text-sm text-och-steel">Add a data source to start collecting analytics</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {dataSources.map((source) => (
              <Card key={source.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{source.name}</h3>
                      <Badge variant={source.status === 'active' ? 'mint' : 'steel'}>
                        {source.status}
                      </Badge>
                      <Badge variant="steel">{source.type}</Badge>
                    </div>
                    <p className="text-sm text-och-steel mb-3">{source.description}</p>
                    <div className="flex items-center gap-4 text-sm text-och-steel">
                      <span>Records: {source.recordCount}</span>
                      <span>Last Sync: {source.lastSync}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">Sync Now</Button>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RouteGuard>
  )
}
