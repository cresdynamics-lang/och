'use client'

import { useState, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUsers } from '@/hooks/useUsers'

export default function MenteesPage() {
  const { users, isLoading } = useUsers({ page: 1, page_size: 100 })
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | 'student'>('all')

  const students = useMemo(() => {
    const filtered = users.filter((u) => 
      u.roles?.some((r: any) => r.role === 'mentee' || r.role === 'student')
    )
    
    if (selectedRoleFilter === 'all') return filtered
    return filtered.filter((u) => 
      u.roles?.some((r: any) => r.role === 'student')
    )
  }, [users, selectedRoleFilter])

  if (isLoading) {
    return (
      <RouteGuard>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
              <p className="text-och-steel">Loading students...</p>
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
              <h1 className="text-4xl font-bold mb-2 text-och-gold">Students</h1>
              <p className="text-och-steel">Manage students</p>
            </div>
            <Button variant="mint" size="sm">
              + Add Student
            </Button>
          </div>

          <Card>
            <div className="p-6">
              <div className="mb-4 flex items-center gap-4">
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value as 'all' | 'student')}
                  className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                >
                  <option value="all">All Students</option>
                  <option value="student">Students Only</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-och-steel/20">
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">User</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Email</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Cohort</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Status</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.slice(0, 50).map((u) => (
                      <tr key={u.id} className="border-b border-och-steel/10 hover:bg-och-midnight/50">
                        <td className="p-3">
                          <p className="text-white font-semibold">
                            {u.first_name} {u.last_name}
                          </p>
                        </td>
                        <td className="p-3 text-och-steel text-sm">{u.email}</td>
                        <td className="p-3 text-och-steel text-sm">{u.cohort_id || 'N/A'}</td>
                        <td className="p-3">
                          <Badge
                            variant={u.is_active && u.account_status === 'active' ? 'mint' : 'orange'}
                          >
                            {u.account_status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Reset Onboarding
                            </Button>
                            <Button variant="outline" size="sm">
                              View Profile
                            </Button>
                          </div>
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

