'use client'

import { useState, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { marketplaceClient, type EmployerInterestLog } from '@/services/marketplaceClient'
import Link from 'next/link'

const ITEMS_PER_PAGE = 20

export default function AuditPage() {
  const [logs, setLogs] = useState<EmployerInterestLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionFilter, setActionFilter] = useState<string>('')
  const [employerFilter, setEmployerFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [allLogsForStats, setAllLogsForStats] = useState<EmployerInterestLog[]>([])

  useEffect(() => {
    loadAllLogsForStats()
  }, [actionFilter, employerFilter, dateFrom, dateTo])

  useEffect(() => {
    loadLogs()
  }, [currentPage, actionFilter, employerFilter, dateFrom, dateTo])

  const loadLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      const params: any = {
        page: currentPage,
        page_size: ITEMS_PER_PAGE,
      }
      if (actionFilter) params.action = actionFilter
      if (employerFilter) params.employer_id = employerFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo

      const response = await marketplaceClient.adminListInterestLogs(params)
      setLogs(Array.isArray(response) ? response : response.results || [])
      setTotalCount(Array.isArray(response) ? response.length : response.count || 0)
    } catch (err: any) {
      setError(err?.message || 'Failed to load interest logs')
      console.error('Error loading logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadAllLogsForStats = async () => {
    try {
      // Load all logs (without pagination) to calculate accurate stats
      const params: any = {
        page: 1,
        page_size: 10000, // Large number to get all results
      }
      // Don't filter by action here - we want all actions to calculate accurate counts
      if (employerFilter) params.employer_id = employerFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo

      const response = await marketplaceClient.adminListInterestLogs(params)
      const allLogs = Array.isArray(response) ? response : response.results || []
      setAllLogsForStats(allLogs)
    } catch (err: any) {
      console.error('Error loading all logs for stats:', err)
      setAllLogsForStats([])
    }
  }

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'view': return 'outline'
      case 'favorite': return 'gold'
      case 'shortlist': return 'mint'
      case 'contact_request': return 'defender'
      default: return 'steel'
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <RouteGuard>
      <AdminLayout>
        <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-och-gold">Marketplace Audit View</h1>
                <p className="text-och-steel">Monitor employer interactions with talent profiles</p>
              </div>
              <Link href="/dashboard/admin/marketplace">
                <Button variant="outline">← Back</Button>
              </Link>
            </div>
          </div>

          {/* Statistics Cards */}
          {(() => {
            // Calculate counts from actual logs data (respecting all filters except action filter)
            const actionCounts: Record<string, number> = {
              view: 0,
              favorite: 0,
              shortlist: 0,
              contact_request: 0,
            }
            
            allLogsForStats.forEach((log) => {
              if (log.action in actionCounts) {
                actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
              }
            })
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4">
                  <p className="text-sm text-och-steel mb-1">Contact Request</p>
                  <p className="text-2xl font-bold text-white">{actionCounts.contact_request || 0}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-och-steel mb-1">Shortlist</p>
                  <p className="text-2xl font-bold text-white">{actionCounts.shortlist || 0}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-och-steel mb-1">Favorite</p>
                  <p className="text-2xl font-bold text-white">{actionCounts.favorite || 0}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-och-steel mb-1">View</p>
                  <p className="text-2xl font-bold text-white">{actionCounts.view || 0}</p>
                </Card>
              </div>
            )
          })()}

          {/* Filters */}
          <Card className="p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white"
              >
                <option value="">All Actions</option>
                <option value="view">View</option>
                <option value="favorite">Favorite</option>
                <option value="shortlist">Shortlist</option>
                <option value="contact_request">Contact Request</option>
              </select>
              <Input
                type="text"
                placeholder="Employer ID"
                value={employerFilter}
                onChange={(e) => {
                  setEmployerFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="bg-och-midnight border-och-steel/20"
              />
              <Input
                type="date"
                placeholder="Date From"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setCurrentPage(1)
                }}
                className="bg-och-midnight border-och-steel/20"
              />
              <Input
                type="date"
                placeholder="Date To"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setCurrentPage(1)
                }}
                className="bg-och-midnight border-och-steel/20"
              />
              <Button onClick={() => {
                loadAllLogsForStats()
                loadLogs()
              }} variant="outline" className="w-full">
                Refresh
              </Button>
            </div>
          </Card>

          {error && (
            <Card className="p-4 mb-6 bg-red-500/10 border-red-500/20">
              <p className="text-red-400">{error}</p>
            </Card>
          )}

          {loading ? (
            <Card className="p-8">
              <p className="text-och-steel text-center">Loading interest logs...</p>
            </Card>
          ) : logs.length === 0 ? (
            <Card className="p-8">
              <p className="text-och-steel text-center">No interest logs found</p>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 mb-6">
                {logs.map((log) => (
                  <Card key={log.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-sm text-och-steel">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-och-steel">
                          <p>
                            <span className="font-semibold">Employer:</span>{' '}
                            {typeof log.employer === 'object' && log.employer
                              ? log.employer.company_name
                              : log.employer_id}
                          </p>
                          <p>
                            <span className="font-semibold">Profile:</span>{' '}
                            {typeof log.profile === 'object' && log.profile
                              ? log.profile.mentee_name || log.profile.mentee_id
                              : log.profile_id}
                          </p>
                          {log.message && (
                            <div className="mt-2 p-2 bg-och-midnight/50 rounded">
                              <p className="text-xs text-och-steel mb-1">Message:</p>
                              <p className="text-white text-sm">{log.message}</p>
                            </div>
                          )}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="mt-2 p-2 bg-och-midnight/50 rounded">
                              <p className="text-xs text-och-steel mb-1">Metadata:</p>
                              <pre className="text-xs text-och-steel overflow-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-och-steel text-sm">
                    Page {currentPage} of {totalPages} ({totalCount} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}
