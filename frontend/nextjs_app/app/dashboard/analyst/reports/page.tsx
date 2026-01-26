'use client'

import { useState } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function ReportsPage() {
  const [isLoading] = useState(false)
  const reports: any[] = []

  return (
    <RouteGuard>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-mint">Reports</h1>
            <p className="text-och-steel">Generate and manage analytical reports.</p>
          </div>
          <Button variant="mint">Generate New Report</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                  <div className="text-sm text-och-steel">Total Reports</div>
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
                  <div className="text-sm text-och-steel">Completed</div>
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
                  <div className="text-sm text-och-steel">In Progress</div>
                </>
              )}
            </div>
          </Card>
        </div>

        <Card>
          <h2 className="text-2xl font-bold mb-4 text-white">Recent Reports</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse p-4 bg-och-midnight/50 rounded-lg">
                  <div className="h-5 bg-och-steel/20 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-och-steel/20 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-och-steel mb-4">No reports available</p>
              <p className="text-sm text-och-steel">Generate your first report to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 bg-och-midnight/50 rounded-lg hover:bg-och-midnight/70 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{report.name}</h3>
                      <Badge variant={report.status === 'completed' ? 'mint' : 'steel'}>
                        {report.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-och-steel">
                      <span>Type: {report.type}</span>
                      <span>Generated: {report.generatedAt}</span>
                      {report.size !== '-' && <span>Size: {report.size}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.status === 'completed' && (
                      <>
                        <Button variant="outline" size="sm">Download</Button>
                        <Button variant="outline" size="sm">View</Button>
                      </>
                    )}
                    {report.status === 'generating' && (
                      <span className="text-sm text-och-steel">Generating...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </RouteGuard>
  )
}
