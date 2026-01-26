/**
 * Finance Profile Page
 * Manage personal information, account settings, and preferences
 */

'use client'

import { useState } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { FinanceNavigation } from '@/components/navigation/FinanceNavigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { getUserRoleDisplay } from '@/utils/formatRole'
import { 
  User,
  Mail,
  Shield,
  Bell,
  Globe,
  Key,
  Save,
  Upload,
  Camera,
  LogOut
} from 'lucide-react'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const userRole = getUserRoleDisplay(user)
  const [isEditing, setIsEditing] = useState(false)

  return (
    <RouteGuard>
      <div className="min-h-screen bg-och-midnight flex">
        <FinanceNavigation />
        <div className="flex-1 lg:ml-64">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-h1 font-bold text-white">Profile Settings</h1>
              <p className="mt-1 body-m text-och-steel">
                Manage your personal information, account settings, and security preferences
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Profile Overview */}
              <div className="lg:col-span-1">
                <Card className="p-6 bg-och-midnight border border-och-steel/20">
                  {/* Profile Picture */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full bg-och-defender flex items-center justify-center text-white text-3xl font-semibold mb-4">
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                      </div>
                      <button className="absolute bottom-0 right-0 p-2 bg-och-midnight border border-och-steel/20 rounded-full hover:bg-och-steel/20 transition-colors">
                        <Camera className="h-4 w-4 text-och-mint" />
                      </button>
                    </div>
                    <h2 className="text-h2 font-semibold text-white">
                      {user?.first_name} {user?.last_name}
                    </h2>
                    <p className="body-m text-och-steel mt-1">{user?.email}</p>
                    <Badge variant="outline" className="mt-3">
                      {userRole}
                    </Badge>
                  </div>

                  {/* Account Status */}
                  <div className="space-y-4 pt-6 border-t border-och-steel/20">
                    <div className="flex items-center justify-between">
                      <span className="body-m text-och-steel">Account Status</span>
                      <Badge variant="mint">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="body-m text-och-steel">Email Verified</span>
                      {user?.email_verified ? (
                        <Badge variant="mint">Verified</Badge>
                      ) : (
                        <Badge variant="orange">Unverified</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="body-m text-och-steel">MFA Enabled</span>
                      {user?.mfa_enabled ? (
                        <Badge variant="mint">Enabled</Badge>
                      ) : (
                        <Badge variant="orange">Required</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column - Profile Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Personal Information */}
                <Card className="p-6 bg-och-midnight border border-och-steel/20">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-och-defender" />
                      <h2 className="text-h2 font-semibold text-white">Personal Information</h2>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block body-s font-medium text-och-steel mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        defaultValue={user?.first_name || ''}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block body-s font-medium text-och-steel mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        defaultValue={user?.last_name || ''}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block body-s font-medium text-och-steel mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-och-steel" />
                        <input
                          type="email"
                          defaultValue={user?.email || ''}
                          disabled
                          className="w-full pl-10 pr-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-och-steel cursor-not-allowed"
                        />
                      </div>
                      <p className="body-s text-och-steel/70 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="block body-s font-medium text-och-steel mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        defaultValue={user?.phone_number || ''}
                        disabled={!isEditing}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block body-s font-medium text-och-steel mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        defaultValue={user?.country || ''}
                        disabled={!isEditing}
                        placeholder="Select country"
                        className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-6 flex justify-end">
                      <Button>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  )}
                </Card>

                {/* Security Settings */}
                <Card className="p-6 bg-och-midnight border border-och-steel/20">
                  <div className="flex items-center gap-3 mb-6">
                    <Shield className="h-5 w-5 text-och-orange" />
                    <h2 className="text-h2 font-semibold text-white">Security Settings</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-och-midnight/50 border border-och-steel/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Key className="h-5 w-5 text-och-defender" />
                        <div>
                          <p className="font-medium text-white">Multi-Factor Authentication</p>
                          <p className="body-s text-och-steel">MFA is mandatory for Finance users</p>
                        </div>
                      </div>
                      {user?.mfa_enabled ? (
                        <Badge variant="mint">Enabled</Badge>
                      ) : (
                        <Button size="sm">Enable MFA</Button>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-och-midnight/50 border border-och-steel/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Key className="h-5 w-5 text-och-steel" />
                        <div>
                          <p className="font-medium text-white">Change Password</p>
                          <p className="body-s text-och-steel">Update your account password</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Change</Button>
                    </div>
                  </div>
                </Card>

                {/* Preferences */}
                <Card className="p-6 bg-och-midnight border border-och-steel/20">
                  <div className="flex items-center gap-3 mb-6">
                    <Bell className="h-5 w-5 text-och-gold" />
                    <h2 className="text-h2 font-semibold text-white">Preferences</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block body-s font-medium text-och-steel mb-2">
                        Timezone
                      </label>
                      <select
                        defaultValue={user?.timezone || 'UTC'}
                        className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                      >
                        <option value="UTC">UTC</option>
                        <option value="Africa/Gaborone">Africa/Gaborone (BWA)</option>
                        <option value="Africa/Johannesburg">Africa/Johannesburg (ZAF)</option>
                        <option value="Africa/Nairobi">Africa/Nairobi (KEN)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block body-s font-medium text-och-steel mb-2">
                        Language
                      </label>
                      <select
                        defaultValue={user?.language || 'en'}
                        className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                      >
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button>
                        <Save className="h-4 w-4 mr-2" />
                        Save Preferences
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Logout Section */}
                <Card className="p-6 bg-och-midnight border border-och-orange/30">
                  <div className="flex items-center gap-3 mb-6">
                    <LogOut className="h-5 w-5 text-och-orange" />
                    <h2 className="text-h2 font-semibold text-white">Sign Out</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-och-midnight/50 border border-och-steel/20 rounded-lg">
                      <p className="body-m text-och-steel mb-4">
                        Sign out of your current session. You will need to log in again to access your account.
                      </p>
                      <Button
                        variant="orange"
                        className="w-full sm:w-auto"
                        onClick={async () => {
                          if (confirm('Are you sure you want to logout?')) {
                            await logout()
                          }
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}

