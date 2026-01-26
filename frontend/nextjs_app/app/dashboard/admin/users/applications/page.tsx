'use client'

import { useState, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'

export default function ApplicationsPage() {
  return (
    <RouteGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">User Applications</h1>
            <p className="text-slate-400">Manage user applications and approvals</p>
          </div>

          <Card className="p-6">
            <p className="text-slate-300">User applications management coming soon...</p>
          </Card>
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}
