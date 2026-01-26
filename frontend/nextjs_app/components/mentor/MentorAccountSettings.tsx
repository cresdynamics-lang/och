'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export function MentorAccountSettings() {
  const { logout } = useAuth()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [sessionReminders, setSessionReminders] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [language, setLanguage] = useState('en')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setStatus(null)
    try {
      await new Promise((resolve) => setTimeout(resolve, 400))
      // eslint-disable-next-line no-console
      console.log('Mentor account settings updated', {
        emailNotifications,
        sessionReminders,
        darkMode,
        language,
      })
      setStatus('Settings saved for this session.')
      setTimeout(() => setStatus(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <Card className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Account & Settings</h2>
          <p className="text-sm text-och-steel">
            Control notifications, appearance, and account actions.
          </p>
        </div>
      </div>

      {status && (
        <div className="mb-4 rounded-lg border border-och-defender/40 bg-och-defender/15 px-3 py-2 text-sm text-och-mint">
          {status}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-och-steel">Notifications</h3>
          <label className="flex cursor-pointer items-center justify-between rounded-lg bg-och-midnight/60 px-3 py-2 text-sm text-white">
            <span>Email updates about mentee activity</span>
            <input
              type="checkbox"
              className="h-4 w-4 accent-och-defender"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between rounded-lg bg-och-midnight/60 px-3 py-2 text-sm text-white">
            <span>Session reminders</span>
            <input
              type="checkbox"
              className="h-4 w-4 accent-och-defender"
              checked={sessionReminders}
              onChange={(e) => setSessionReminders(e.target.checked)}
            />
          </label>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-och-steel">Preferences</h3>
          <label className="flex cursor-pointer items-center justify-between rounded-lg bg-och-midnight/60 px-3 py-2 text-sm text-white">
            <span>Dark theme</span>
            <input
              type="checkbox"
              className="h-4 w-4 accent-och-defender"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
            />
          </label>
          <div className="rounded-lg bg-och-midnight/60 px-3 py-2 text-sm text-white">
            <div className="mb-1 text-xs text-och-steel">Language</div>
            <select
              className="w-full rounded-md bg-och-midnight border border-och-steel/30 px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="sw">Kiswahili</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-och-steel/20 pt-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1 text-xs text-och-steel">
          <div>These settings are stored locally for now and will sync with your account later.</div>
          <div>Use Log out to securely end your mentoring session.</div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
          <Button
            variant="orange"
            size="sm"
            onClick={handleLogout}
          >
            Log out
          </Button>
        </div>
      </div>
    </Card>
  )
}


