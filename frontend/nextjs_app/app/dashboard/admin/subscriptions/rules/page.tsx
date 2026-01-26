'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'

export default function SubscriptionRulesPage() {
  return (
    <RouteGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-defender">Subscription Rules & Settings</h1>
            <p className="text-och-steel">Configure subscription rules and system settings</p>
          </div>
          <Card className="p-6">
            <p className="text-och-steel">Subscription rules management interface coming soon...</p>
            <p className="text-och-steel text-sm mt-2">
              Configure upgrade/downgrade rules, grace periods, enhanced access periods, and payment settings.
            </p>
          </Card>
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}















































































