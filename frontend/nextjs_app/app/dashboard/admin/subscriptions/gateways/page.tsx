'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'

export default function PaymentGatewaysPage() {
  return (
    <RouteGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-defender">Payment Gateways</h1>
            <p className="text-och-steel">Configure and manage payment gateways</p>
          </div>
          <Card className="p-6">
            <p className="text-och-steel">Payment gateway management interface coming soon...</p>
            <p className="text-och-steel text-sm mt-2">
              Configure Stripe, Paystack, Flutterwave, M-Pesa, Orange Money, Airtel Money, and Visa/Mastercard.
            </p>
          </Card>
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}
