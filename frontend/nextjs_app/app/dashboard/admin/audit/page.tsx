'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'

interface AuditLog {
  id: number
  action: string
  resource_type: string
  resource_id: string | null
  result: string
  timestamp: string
  actor_identifier: string
}

export default function AuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [range, setRange] = useState<'week' | 'month' | 'all'>('week')

  useEffect(() => {
    loadAuditLogs()
  }, [range])

  const loadAuditLogs = async () => {
    try {
      setIsLoading(true)
      const data = await apiGateway.get<{ results: AuditLog[] } | AuditLog[]>('/audit-logs/', {
        params: { range, page_size: 100 }
      })
      const logsArray = Array.isArray(data) ? data : (data?.results || [])
      setAuditLogs(logsArray)
    } catch (error) {
      console.error('Failed to load audit logs:', error)
      setAuditLogs([])
    } finally {
      setIsLoading(false)
    }
  }

  const auditStats = useMemo(() => {
    const success = auditLogs.filter((log) => log.result === 'success').length
    const failure = auditLogs.filter((log) => log.result === 'failure').length
    const today = auditLogs.filter((log) => {
      const logDate = new Date(log.timestamp)
      const today = new Date()
      return logDate.toDateString() === today.toDateString()
    }).length

    return { total: auditLogs.length, success, failure, today }
  }, [auditLogs])

  if (isLoading) {
    return (
      <RouteGuard>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
              <p className="text-och-steel">Loading audit logs...</p>
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
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-och-gold">Audit Logs & Compliance</h1>
            <p className="text-och-steel">Monitor system activity and compliance</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Total Logs</p>
                <p className="text-2xl font-bold text-white">{auditStats.total}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Success</p>
                <p className="text-2xl font-bold text-och-mint">{auditStats.success}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Failures</p>
                <p className="text-2xl font-bold text-och-orange">{auditStats.failure}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Today</p>
                <p className="text-2xl font-bold text-och-defender">{auditStats.today}</p>
              </div>
            </Card>
          </div>

          <Card>
            <div className="p-6">
              <div className="mb-4 flex items-center gap-4">
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value as 'week' | 'month' | 'all')}
                  className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                >
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-och-midnight">
                    <tr className="border-b border-och-steel/20">
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Timestamp</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Action</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Actor</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Resource</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="border-b border-och-steel/10 hover:bg-och-midnight/50">
                        <td className="p-3 text-och-steel text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <Badge variant="steel" className="text-xs">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="p-3 text-och-steel text-sm">{log.actor_identifier}</td>
                        <td className="p-3 text-och-steel text-sm">
                          {log.resource_type} {log.resource_id ? `#${log.resource_id}` : ''}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={log.result === 'success' ? 'mint' : 'orange'}
                            className="text-xs"
                          >
                            {log.result}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}

