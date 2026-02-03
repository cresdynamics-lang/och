'use client'

import { useState } from 'react'
import { CardContent, CardHeader } from "@/components/ui/card-enhanced"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
// import { Switch } from "@/components/ui/Switch"
import { DashboardHeader } from '@/components/navigation/DashboardHeader'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { useAuth } from '@/hooks/useAuth'
import { Shield, Bell, Lock, User, Save, Camera, Upload, Award, TrendingUp } from 'lucide-react'

function FinanceSettingsContent() {
  const { user } = useAuth()

  const [profile, setProfile] = useState({
    firstName: user?.first_name || 'John',
    lastName: user?.last_name || 'Finance',
    email: user?.email || 'john.finance@ongozacyberhub.com',
    phone: '+254 700 000 000',
    bio: 'Finance Director at Ongoza CyberHub, specializing in SOC analyst operations and financial reporting.',
    location: 'Nairobi, Kenya'
  })

  const [notifications, setNotifications] = useState({
    emailReports: true,
    paymentReminders: true,
    cohortAlerts: false,
    budgetAlerts: true
  })

  const [security, setSecurity] = useState({
    twoFactor: true,
    sessionTimeout: '30',
    loginAlerts: true
  })

  const [profileImage, setProfileImage] = useState<string | null>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-cyan-950/20">
      {/* OCH Finance Settings Header */}
      <div className="bg-och-midnight/95 backdrop-blur-sm border-b border-och-steel/20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-och-defender" />
                <div>
                  <h1 className="text-xl font-bold text-white">Ongoza CyberHub</h1>
                  <p className="text-sm text-och-steel">Profile & Settings • SOC Analyst Operations</p>
                </div>
              </div>
            </div>
            <DashboardHeader />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Profile & Settings</h2>
          <p className="text-och-steel">Manage your profile, preferences, and security settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Profile Picture & Basic Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-och-midnight/50 border-och-steel/20">
              <CardHeader>
                <h2 className="text-xl font-bold text-white text-center">Profile Picture</h2>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-och-defender flex items-center justify-center overflow-hidden">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-16 h-16 text-white" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-och-defender rounded-full p-2 cursor-pointer hover:bg-och-defender/80 transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white">{profile.firstName} {profile.lastName}</h3>
                  <p className="text-och-steel">{profile.location}</p>
                </div>
                <Button variant="outline" className="w-full border-och-steel/50 text-och-steel hover:bg-och-steel/10">
                  <Upload className="w-4 h-4 mr-2" />
                  Change Picture
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-och-midnight/50 border-och-steel/20">
              <CardHeader>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-och-defender" />
                  Performance
                </h2>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-och-steel">Reports Generated</span>
                  <span className="font-bold text-och-mint">47</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-och-steel">Invoices Processed</span>
                  <span className="font-bold text-och-mint">156</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-och-steel">ROI Calculated</span>
                  <span className="font-bold text-och-mint">4.2x</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="bg-och-midnight/50 border-och-steel/20">
              <CardHeader>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
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
                <div className="space-y-2">
                  <Label className="text-white">Location</Label>
                  <Input
                    value={profile.location}
                    onChange={(e) => setProfile({...profile, location: e.target.value})}
                    className="bg-och-midnight/50 border-och-steel/50 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Bio</Label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                    rows={3}
                    className="w-full bg-och-midnight/50 border border-och-steel/50 rounded-md px-3 py-2 text-white placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-defender"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card className="bg-och-midnight/50 border-och-steel/20">
              <CardHeader>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-och-defender" />
                  Notification Preferences
                </h2>
              </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Email Reports</Label>
                <p className="text-sm text-och-steel">Receive weekly financial reports via email</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.emailReports}
                onChange={(e) => setNotifications({...notifications, emailReports: e.target.checked})}
                className="w-4 h-4 text-och-defender bg-och-midnight border-och-steel rounded focus:ring-och-defender"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Payment Reminders</Label>
                <p className="text-sm text-och-steel">Get notified about upcoming payment deadlines</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.paymentReminders}
                onChange={(e) => setNotifications({...notifications, paymentReminders: e.target.checked})}
                className="w-4 h-4 text-och-defender bg-och-midnight border-och-steel rounded focus:ring-och-defender"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Cohort Alerts</Label>
                <p className="text-sm text-och-steel">Notifications about cohort performance changes</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.cohortAlerts}
                onChange={(e) => setNotifications({...notifications, cohortAlerts: e.target.checked})}
                className="w-4 h-4 text-och-defender bg-och-midnight border-och-steel rounded focus:ring-och-defender"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Budget Alerts</Label>
                <p className="text-sm text-och-steel">Alerts when budget thresholds are reached</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.budgetAlerts}
                onChange={(e) => setNotifications({...notifications, budgetAlerts: e.target.checked})}
                className="w-4 h-4 text-och-defender bg-och-midnight border-och-steel rounded focus:ring-och-defender"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-och-midnight/50 border-och-steel/20">
          <CardHeader>
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <Lock className="w-5 h-5 text-och-defender" />
              Security Settings
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Two-Factor Authentication</Label>
                <p className="text-sm text-och-steel">Enhanced security for your account</p>
              </div>
              <input
                type="checkbox"
                checked={security.twoFactor}
                onChange={(e) => setSecurity({...security, twoFactor: e.target.checked})}
                className="w-4 h-4 text-och-defender bg-och-midnight border-och-steel rounded focus:ring-och-defender"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Session Timeout (minutes)</Label>
              <Input
                type="number"
                value={security.sessionTimeout}
                onChange={(e) => setSecurity({...security, sessionTimeout: e.target.value})}
                className="bg-och-midnight/50 border-och-steel/50 text-white"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Login Alerts</Label>
                <p className="text-sm text-och-steel">Get notified of new login attempts</p>
              </div>
              <input
                type="checkbox"
                checked={security.loginAlerts}
                onChange={(e) => setSecurity({...security, loginAlerts: e.target.checked})}
                className="w-4 h-4 text-och-defender bg-och-midnight border-och-steel rounded focus:ring-och-defender"
              />
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card className="bg-och-midnight/50 border-och-steel/20">
          <CardHeader>
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <User className="w-5 h-5 text-och-defender" />
              Profile Information
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">First Name</Label>
                <Input
                  placeholder="Enter first name"
                  className="bg-och-midnight/50 border-och-steel/50 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Last Name</Label>
                <Input
                  placeholder="Enter last name"
                  className="bg-och-midnight/50 border-och-steel/50 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Email Address</Label>
              <Input
                type="email"
                placeholder="Enter email address"
                className="bg-och-midnight/50 border-och-steel/50 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Phone Number</Label>
              <Input
                type="tel"
                placeholder="Enter phone number"
                className="bg-och-midnight/50 border-och-steel/50 text-white"
              />
            </div>
          </CardContent>
        </Card>

            {/* Save Button */}
            <div className="flex justify-end pt-6">
              <Button className="bg-och-defender hover:bg-och-defender/80 text-white px-6 py-2">
                <Save className="w-4 h-4 mr-2" />
                Save All Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FinanceSettings({ params }: { params: { userId: string } }) {
  return (
    <RouteGuard requiredRoles={['finance']}>
      <FinanceSettingsContent />
    </RouteGuard>
  )
}
