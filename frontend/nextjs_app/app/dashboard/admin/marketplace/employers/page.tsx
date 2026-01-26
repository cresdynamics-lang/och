'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { marketplaceClient, type Employer } from '@/services/marketplaceClient'
import Link from 'next/link'

const ITEMS_PER_PAGE = 20

export default function EmployersPage() {
  const [employers, setEmployers] = useState<Employer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedEmployer, setSelectedEmployer] = useState<Employer | null>(null)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [showAssignAdminModal, setShowAssignAdminModal] = useState(false)
  const [assignAdminEmail, setAssignAdminEmail] = useState('')
  const [suspendReason, setSuspendReason] = useState('')

  useEffect(() => {
    loadEmployers()
  }, [currentPage, searchQuery, countryFilter, sectorFilter])

  const loadEmployers = async () => {
    try {
      setLoading(true)
      setError(null)
      const params: any = {
        page: currentPage,
        page_size: ITEMS_PER_PAGE,
      }
      if (searchQuery) params.search = searchQuery
      if (countryFilter) params.country = countryFilter
      if (sectorFilter) params.sector = sectorFilter

      const response = await marketplaceClient.adminListEmployers(params)
      setEmployers(Array.isArray(response) ? response : response.results || [])
      setTotalCount(Array.isArray(response) ? response.length : response.count || 0)
    } catch (err: any) {
      setError(err?.message || 'Failed to load employers')
      console.error('Error loading employers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSuspend = async () => {
    if (!selectedEmployer) return
    try {
      await marketplaceClient.adminSuspendEmployer(selectedEmployer.id, suspendReason)
      setShowSuspendModal(false)
      setSelectedEmployer(null)
      setSuspendReason('')
      loadEmployers()
    } catch (err: any) {
      alert(err?.message || 'Failed to suspend employer')
    }
  }

  const handleUnsuspend = async (employerId: string) => {
    try {
      await marketplaceClient.adminUnsuspendEmployer(employerId)
      loadEmployers()
    } catch (err: any) {
      alert(err?.message || 'Failed to unsuspend employer')
    }
  }

  const handleAssignAdmin = async () => {
    if (!selectedEmployer || !assignAdminEmail) return
    try {
      await marketplaceClient.adminAssignEmployerAdmin(selectedEmployer.id, assignAdminEmail)
      setShowAssignAdminModal(false)
      setSelectedEmployer(null)
      setAssignAdminEmail('')
      alert('Employer admin role assigned successfully')
    } catch (err: any) {
      alert(err?.message || 'Failed to assign admin role')
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  // Get unique countries and sectors for filters
  const countries = useMemo(() => {
    const unique = new Set<string>()
    employers.forEach(e => {
      if (e.country) unique.add(e.country)
    })
    return Array.from(unique).sort()
  }, [employers])

  const sectors = useMemo(() => {
    const unique = new Set<string>()
    employers.forEach(e => {
      if (e.sector) unique.add(e.sector)
    })
    return Array.from(unique).sort()
  }, [employers])

  return (
    <RouteGuard>
      <AdminLayout>
        <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-och-gold">Employer Directory</h1>
                <p className="text-och-steel">Vet, onboard, and manage employer organizations</p>
              </div>
              <Link href="/dashboard/admin/marketplace">
                <Button variant="outline">← Back</Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <Card className="p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search employers..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="bg-och-midnight border-och-steel/20"
              />
              <select
                value={countryFilter}
                onChange={(e) => {
                  setCountryFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white"
              >
                <option value="">All Countries</option>
                {countries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={sectorFilter}
                onChange={(e) => {
                  setSectorFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white"
              >
                <option value="">All Sectors</option>
                {sectors.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <Button onClick={loadEmployers} variant="outline" className="w-full">
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
              <p className="text-och-steel text-center">Loading employers...</p>
            </Card>
          ) : employers.length === 0 ? (
            <Card className="p-8">
              <p className="text-och-steel text-center">No employers found</p>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 mb-6">
                {employers.map((employer) => (
                  <Card key={employer.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{employer.company_name}</h3>
                          {employer.user_id && (
                            <Badge variant="outline">ID: {employer.user_id.slice(0, 8)}...</Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-och-steel mb-4">
                          {employer.sector && <p>Sector: {employer.sector}</p>}
                          {employer.country && <p>Country: {employer.country}</p>}
                          {employer.website && (
                            <p>
                              Website:{' '}
                              <a href={employer.website} target="_blank" rel="noopener noreferrer" className="text-och-mint hover:underline">
                                {employer.website}
                              </a>
                            </p>
                          )}
                          {employer.description && (
                            <p className="mt-2 text-och-steel">{employer.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-och-steel">
                          <span>Created: {new Date(employer.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEmployer(employer)
                            setShowAssignAdminModal(true)
                          }}
                        >
                          Assign Admin
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEmployer(employer)
                            setShowSuspendModal(true)
                          }}
                        >
                          Suspend
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnsuspend(employer.id)}
                        >
                          Unsuspend
                        </Button>
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

          {/* Suspend Modal */}
          {showSuspendModal && selectedEmployer && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-white mb-4">Suspend Employer</h3>
                <p className="text-och-steel mb-4">
                  Are you sure you want to suspend {selectedEmployer.company_name}?
                </p>
                <Input
                  placeholder="Reason (optional)"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="mb-4 bg-och-midnight border-och-steel/20"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSuspend} variant="gold">Confirm</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSuspendModal(false)
                      setSelectedEmployer(null)
                      setSuspendReason('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Assign Admin Modal */}
          {showAssignAdminModal && selectedEmployer && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-white mb-4">Assign Employer Admin</h3>
                <p className="text-och-steel mb-4">
                  Assign employer admin role to a user for {selectedEmployer.company_name}
                </p>
                <Input
                  type="email"
                  placeholder="User email"
                  value={assignAdminEmail}
                  onChange={(e) => setAssignAdminEmail(e.target.value)}
                  className="mb-4 bg-och-midnight border-och-steel/20"
                />
                <div className="flex gap-2">
                  <Button onClick={handleAssignAdmin} variant="gold" disabled={!assignAdminEmail}>
                    Assign
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAssignAdminModal(false)
                      setSelectedEmployer(null)
                      setAssignAdminEmail('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}
