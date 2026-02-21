'use client'

import { Card } from '@/components/ui/Card'
import { CardContent } from '@/components/ui/card-enhanced'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { LifeBuoy, Shield, Hash, Ticket } from 'lucide-react'

export default function SupportSettingsPage() {
  return (
    <RouteGuard requiredRoles={['support']}>
      <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Support settings</h1>
          <p className="text-sm text-slate-400">
            Internal support role: you were added by a Program Director.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Ticket className="w-6 h-6 text-och-defender" aria-hidden />
                <h2 className="text-lg font-semibold text-white">Tickets</h2>
              </div>
              <p className="text-sm text-slate-300">
                Create and manage support tickets. Assign to yourself or other support agents. Use problem codes for reporting and SLA.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Hash className="w-6 h-6 text-och-defender" aria-hidden />
                <h2 className="text-lg font-semibold text-white">Problem codes</h2>
              </div>
              <p className="text-sm text-slate-300">
                Problem tracking codes (e.g. AUTH-001, BILL-002) are defined by directors or admins. You can view and attach them to tickets.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 md:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-och-defender" aria-hidden />
                <h2 className="text-lg font-semibold text-white">Role & access</h2>
              </div>
              <p className="text-sm text-slate-300 mb-4">
                Support is an internal role. Only Program Directors and Admins can assign the support role to users. You have access to the support dashboard, tickets, and problem codes.
              </p>
              <div className="flex items-center gap-2 text-och-steel text-sm">
                <LifeBuoy className="w-4 h-4 shrink-0" aria-hidden />
                <span>To add or remove support users, ask a Program Director to go to Director Dashboard → Support Team.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RouteGuard>
  )
}
