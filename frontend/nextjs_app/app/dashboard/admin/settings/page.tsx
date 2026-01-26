'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function SettingsPage() {
  return (
    <RouteGuard>
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-och-gold">Platform Settings</h1>
            <p className="text-och-steel">Configure system settings and integrations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">System Configuration</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    System Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Integration Management
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Subscription Rules
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Payment Gateway Settings
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Security & API</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    Security Policies
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Webhook Management
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    MFA Configuration
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Rate Limiting
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Content Management</h3>
                <p className="text-sm text-och-steel mb-4">
                  Manage curriculum, missions, tracks, and programs
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/dashboard/director/curriculum/structure" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start hover:bg-och-defender/20 hover:border-och-defender transition-colors">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Curriculum
                    </Button>
                  </Link>
                  <Link href="/dashboard/director/curriculum/missions" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start hover:bg-och-defender/20 hover:border-och-defender transition-colors">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Missions
                    </Button>
                  </Link>
                  <Link href="/dashboard/director/tracks" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start hover:bg-och-defender/20 hover:border-och-defender transition-colors">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Tracks
                    </Button>
                  </Link>
                  <Link href="/dashboard/director/programs" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start hover:bg-och-defender/20 hover:border-och-defender transition-colors">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Programs
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Notifications</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    Email Templates
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Notification Rules
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Alert Configuration
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}

