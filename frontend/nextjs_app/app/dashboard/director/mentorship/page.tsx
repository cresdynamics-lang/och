'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

export default function MentorshipPage() {
  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-och-defender">Mentorship Management</h1>
            <p className="text-och-steel">Assign mentors, configure cycles, and manage mentorship operations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Link href="/dashboard/director/mentors">
              <Card className="hover:border-och-defender/50 transition-colors cursor-pointer">
                <div className="p-6 text-center">
                  <span className="text-4xl mb-3 block">👥</span>
                  <h3 className="text-lg font-semibold text-white mb-2">Assign Mentors</h3>
                  <p className="text-sm text-och-steel">Assign mentors to cohorts or tracks</p>
                </div>
              </Card>
            </Link>

            <Link href="/dashboard/director/mentorship/matching">
              <Card className="hover:border-och-defender/50 transition-colors cursor-pointer">
                <div className="p-6 text-center">
                  <span className="text-4xl mb-3 block">🔀</span>
                  <h3 className="text-lg font-semibold text-white mb-2">Auto-Matching</h3>
                  <p className="text-sm text-och-steel">Auto-generate optimal mentor–mentee matches</p>
                </div>
              </Card>
            </Link>

            <Link href="/dashboard/director/mentorship/reviews">
              <Card className="hover:border-och-defender/50 transition-colors cursor-pointer">
                <div className="p-6 text-center">
                  <span className="text-4xl mb-3 block">⭐</span>
                  <h3 className="text-lg font-semibold text-white mb-2">Mentor Reviews</h3>
                  <p className="text-sm text-och-steel">Manage and approve mentor reviews</p>
                </div>
              </Card>
            </Link>

            <Link href="/dashboard/director/mentorship/cycles">
              <Card className="hover:border-och-defender/50 transition-colors cursor-pointer">
                <div className="p-6 text-center">
                  <span className="text-4xl mb-3 block">🔄</span>
                  <h3 className="text-lg font-semibold text-white mb-2">Cycle Configuration</h3>
                  <p className="text-sm text-och-steel">Define milestones and goals for cycles</p>
                </div>
              </Card>
            </Link>
          </div>

          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Mentorship Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-och-midnight/50 rounded-lg">
                  <p className="text-och-steel text-sm mb-1">Active Mentors</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
                <div className="p-4 bg-och-midnight/50 rounded-lg">
                  <p className="text-och-steel text-sm mb-1">Active Mentees</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
                <div className="p-4 bg-och-midnight/50 rounded-lg">
                  <p className="text-och-steel text-sm mb-1">Session Completion Rate</p>
                  <p className="text-2xl font-bold text-och-mint">0%</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}

