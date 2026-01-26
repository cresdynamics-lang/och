'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'

export default function TransactionsPage() {
  return (
    <RouteGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-defender">Payment Transactions</h1>
            <p className="text-och-steel">View and monitor payment transactions</p>
          </div>
          <Card className="p-6">
            <p className="text-och-steel">Transaction management interface coming soon...</p>
            <p className="text-och-steel text-sm mt-2">
              Monitor payment transactions, refunds, and payment status across all gateways.
            </p>
          </Card>
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}















































































