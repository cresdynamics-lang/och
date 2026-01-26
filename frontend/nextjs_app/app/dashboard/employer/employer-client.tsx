'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const mockKPIs = [
  { label: 'Talent Profiles', value: '1,234', change: '+89' },
  { label: 'Active Listings', value: '24', change: '+3' },
  { label: 'Matches Found', value: '156', change: '+12' },
  { label: 'Response Rate', value: '78%', change: '+5%' },
]

const mockActions = [
  { label: 'Browse Talent', href: '/dashboard/employer/talent', icon: '🔍' },
  { label: 'Filter Talent', href: '/dashboard/employer/talent', icon: '👥' },
  { label: 'Post Role', href: '/dashboard/employer/jobs', icon: '📝' },
  { label: 'My Contacts', href: '/dashboard/employer/contacts', icon: '💼' },
]

const mockTalent = [
  { name: 'Alex Johnson', skills: ['Python', 'Security'], readiness: 'High', tier: 'Professional' },
  { name: 'Sam Williams', skills: ['Cloud', 'DevOps'], readiness: 'Medium', tier: 'Professional' },
  { name: 'Jordan Lee', skills: ['ML', 'AI'], readiness: 'High', tier: 'Starter' },
]

export default function EmployerClient() {
  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-gold">Employer Dashboard</h1>
          <p className="text-och-steel">Discover and connect with top cybersecurity talent.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {mockKPIs.map((kpi) => (
            <Card key={kpi.label} gradient="leadership">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-och-steel text-sm mb-1">{kpi.label}</p>
                  <p className="text-3xl font-bold text-white">{kpi.value}</p>
                </div>
                <Badge variant="gold">{kpi.change}</Badge>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4 text-white">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {mockActions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center gap-2 h-24 w-full"
                  >
                    <span className="text-2xl">{action.icon}</span>
                    <span className="text-xs text-center">{action.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Featured Talent</h2>
            <div className="space-y-4">
              {mockTalent.map((talent) => (
                <div key={talent.name} className="p-3 bg-och-midnight/50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold text-white">{talent.name}</span>
                    <Badge variant={talent.tier === 'Professional' ? 'mint' : 'steel'}>
                      {talent.tier}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {talent.skills.map((skill) => (
                      <Badge key={skill} variant="defender" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-och-steel">Readiness: {talent.readiness}</span>
                    {talent.tier === 'Professional' && (
                      <Link href={`/dashboard/employer/talent/${talent.name.toLowerCase().replace(' ', '-')}`}>
                        <Button variant="outline" className="text-xs h-6 px-2">
                          Contact
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-och-defender/20">
              <Link href="/dashboard/employer/talent">
                <Button variant="outline" className="w-full text-sm">
                  Browse All Talent →
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Active Job Postings</h2>
            <div className="space-y-3">
              {['Senior Security Engineer', 'Cloud Security Architect', 'Penetration Tester'].map((job) => (
                <div key={job} className="flex items-center justify-between p-3 bg-och-midnight/50 rounded-lg">
                  <span className="text-och-steel">{job}</span>
                  <Badge variant="mint">Active</Badge>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-och-defender/20">
              <Link href="/dashboard/employer/jobs">
                <Button variant="outline" className="w-full text-sm">
                  Manage Postings →
                </Button>
              </Link>
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Search Filters</h2>
            <div className="space-y-3">
              <div className="p-3 bg-och-midnight/50 rounded-lg">
                <p className="text-sm text-och-steel mb-2">Filter by Skill</p>
                <div className="flex flex-wrap gap-2">
                  {['Python', 'Security', 'Cloud', 'DevOps'].map((skill) => (
                    <Badge key={skill} variant="defender" className="text-xs cursor-pointer">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-och-midnight/50 rounded-lg">
                <p className="text-sm text-och-steel mb-2">Filter by Readiness</p>
                <div className="flex flex-wrap gap-2">
                  {['High', 'Medium', 'Low'].map((level) => (
                    <Badge key={level} variant="steel" className="text-xs cursor-pointer">
                      {level}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-och-midnight/50 rounded-lg">
                <p className="text-sm text-och-steel mb-2">Filter by Portfolio Depth</p>
                <div className="flex flex-wrap gap-2">
                  {['Deep', 'Moderate', 'Basic'].map((depth) => (
                    <Badge key={depth} variant="gold" className="text-xs cursor-pointer">
                      {depth}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8 flex justify-end">
          <Link href="/dashboard/employer/talent">
            <Button variant="gold">Explore Talent</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

