'use client'

import { useState } from 'react'
import { CardContent, CardHeader } from "@/components/ui/card-enhanced"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { DashboardHeader } from '@/components/navigation/DashboardHeader'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Shield, User, Mail, Phone, Building, Save, Award, TrendingUp, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

function FinanceProfileContent() {
  const { user, logout } = useAuth()

  const [profile, setProfile] = useState({
    firstName: user?.first_name || 'John',
    lastName: user?.last_name || 'Finance',
    email: user?.email || 'john.finance@ongozacyberhub.com',
    phone: '+254 700 000 000',
    department: 'Finance',
    role: 'Finance Director',
    employeeId: 'FIN-001'
  })

  const [stats] = useState({
    reportsGenerated: 47,
    invoicesProcessed: 156,
    paymentsTracked: 89,
    roiCalculated: '4.2x'
  })

  const handleSignOut = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-cyan-950/20">
      {/* OCH Finance Profile Header */}
      <div className="bg-och-midnight/95 backdrop-blur-sm border-b border-och-steel/20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-och-defender" />
                <div>
                  <h1 className="text-xl font-bold text-white">Ongoza CyberHub</h1>
                  <p className="text-sm text-och-steel">Finance Profile • SOC Analyst Operations</p>
                </div>
              </div>
            </div>
            <DashboardHeader />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Finance Director Profile</h2>
          <p className="text-och-steel">Manage your profile information and view your performance metrics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-och-midnight/50 border-och-steel/20">
              <CardHeader>
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                  <User className="w-5 h-5 text-och-defender" />
                  Personal Information
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">First Name</Label>
                    <Input
                      value={profile.firstName}
                      onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                      className="bg-och-midnight/50 border-och-steel/50 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Last Name</Label>
                    <Input
                      value={profile.lastName}
                      onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                      className="bg-och-midnight/50 border-och-steel/50 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Email Address</Label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    className="bg-och-midnight/50 border-och-steel/50 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Phone Number</Label>
                  <Input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    className="bg-och-midnight/50 border-och-steel/50 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-och-midnight/50 border-och-steel/20">
              <CardHeader>
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                  <Building className="w-5 h-5 text-och-defender" />
                  Professional Information
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Department</Label>
                    <Input
                      value={profile.department}
                      readOnly
                      className="bg-och-midnight/30 border-och-steel/30 text-och-steel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Role</Label>
                    <Input
                      value={profile.role}
                      readOnly
                      className="bg-och-midnight/30 border-och-steel/30 text-och-steel"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Employee ID</Label>
                  <Input
                    value={profile.employeeId}
                    readOnly
                    className="bg-och-midnight/30 border-och-steel/30 text-och-steel"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats and Achievements */}
          <div className="space-y-6">
            <Card className="bg-och-midnight/50 border-och-steel/20">
              <CardHeader>
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                  <TrendingUp className="w-5 h-5 text-och-defender" />
                  Performance Stats
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-och-steel">Reports Generated</span>
                    <span className="font-bold text-och-mint">{stats.reportsGenerated}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-och-steel">Invoices Processed</span>
                    <span className="font-bold text-och-mint">{stats.invoicesProcessed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-och-steel">Payments Tracked</span>
                    <span className="font-bold text-och-mint">{stats.paymentsTracked}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-och-steel">ROI Calculated</span>
                    <span className="font-bold text-och-mint">{stats.roiCalculated}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-och-midnight/50 border-och-steel/20">
              <CardHeader>
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                  <Award className="w-5 h-5 text-och-defender" />
                  Achievements
                </h2>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-och-mint rounded-full"></div>
                  <span className="text-sm text-och-steel">Top Performer Q4 2025</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-och-mint rounded-full"></div>
                  <span className="text-sm text-och-steel">ROI Excellence Award</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-och-mint rounded-full"></div>
                  <span className="text-sm text-och-steel">100+ Reports Milestone</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
          <Button className="bg-och-defender hover:bg-och-defender/80 text-white px-6 py-2">
            <Save className="w-4 h-4 mr-2" />
            Save Profile
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function FinanceProfile({ params }: { params: { userId: string } }) {
  return (
    <RouteGuard requiredRoles={['finance']}>
      <FinanceProfileContent />
    </RouteGuard>
  )
}
