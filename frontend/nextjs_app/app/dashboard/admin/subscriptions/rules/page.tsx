'use client'

import { useState, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'

interface SubscriptionRule {
  id: string
  rule_name: string
  rule_type: 'upgrade' | 'downgrade' | 'grace_period' | 'enhanced_access'
  enabled: boolean
  value: Record<string, any>
  description: string
  created_at: string
  updated_at: string
}

interface PaymentSetting {
  id: string
  setting_key: string
  setting_value: Record<string, any>
  description: string
  updated_at: string
}

const RULE_TYPE_COLORS: Record<string, 'mint' | 'defender' | 'gold' | 'orange' | 'steel'> = {
  upgrade: 'mint',
  downgrade: 'orange',
  grace_period: 'gold',
  enhanced_access: 'defender',
}

const RULE_TYPE_ICONS: Record<string, string> = {
  upgrade: '⬆️',
  downgrade: '⬇️',
  grace_period: '⏱️',
  enhanced_access: '✨',
}

export default function SubscriptionRulesPage() {
  const [rules, setRules] = useState<SubscriptionRule[]>([])
  const [settings, setSettings] = useState<PaymentSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'rules' | 'settings'>('rules')
  const [editingRule, setEditingRule] = useState<SubscriptionRule | null>(null)
  const [editingSetting, setEditingSetting] = useState<PaymentSetting | null>(null)
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [showSettingModal, setShowSettingModal] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    try {
      setLoading(true)
      setError(null)
      const [rulesRes, settingsRes] = await Promise.all([
        apiGateway.get('/admin/rules/') as Promise<SubscriptionRule[] | { results: SubscriptionRule[] }>,
        apiGateway.get('/admin/settings/') as Promise<PaymentSetting[] | { results: PaymentSetting[] }>,
      ])
      setRules(Array.isArray(rulesRes) ? rulesRes : ((rulesRes as any).results || []))
      setSettings(Array.isArray(settingsRes) ? settingsRes : ((settingsRes as any).results || []))
    } catch (err: any) {
      setError(err.message || 'Failed to load rules and settings')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRule = async (rule: SubscriptionRule) => {
    try {
      await apiGateway.patch(`/admin/rules/${rule.id}/`, { enabled: !rule.enabled })
      await loadAll()
    } catch (err: any) {
      alert(err.message || 'Failed to toggle rule')
    }
  }

  const handleSaveRule = async (data: Partial<SubscriptionRule>) => {
    try {
      setSaving(true)
      if (editingRule?.id) {
        await apiGateway.put(`/admin/rules/${editingRule.id}/`, data)
      } else {
        await apiGateway.post('/admin/rules/', data)
      }
      await loadAll()
      setShowRuleModal(false)
      setEditingRule(null)
      alert('Rule saved!')
    } catch (err: any) {
      alert(err.message || 'Failed to save rule')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSetting = async (data: Partial<PaymentSetting>) => {
    try {
      setSaving(true)
      if (editingSetting?.id) {
        await apiGateway.patch(`/admin/settings/${editingSetting.id}/`, data)
      } else {
        await apiGateway.post('/admin/settings/', data)
      }
      await loadAll()
      setShowSettingModal(false)
      setEditingSetting(null)
      alert('Setting saved!')
    } catch (err: any) {
      alert(err.message || 'Failed to save setting')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <RouteGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-defender">Rules & Settings</h1>
            <p className="text-och-steel">Configure subscription rules, grace periods, and payment settings</p>
          </div>

          {error && (
            <Card className="p-4 bg-och-orange/20 border-och-orange">
              <p className="text-och-orange">{error}</p>
            </Card>
          )}

          {/* Tabs */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'rules' ? 'defender' : 'outline'}
              onClick={() => setActiveTab('rules')}
            >
              Subscription Rules ({rules.length})
            </Button>
            <Button
              variant={activeTab === 'settings' ? 'defender' : 'outline'}
              onClick={() => setActiveTab('settings')}
            >
              Payment Settings ({settings.length})
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
            </div>
          ) : activeTab === 'rules' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-och-steel text-sm">
                  Rules control upgrade/downgrade timing, grace periods, and enhanced access windows.
                </p>
                <Button variant="defender" size="sm" onClick={() => { setEditingRule(null); setShowRuleModal(true) }}>
                  + Add Rule
                </Button>
              </div>

              {rules.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-och-steel mb-2">No rules configured yet.</p>
                  <p className="text-och-steel text-sm mb-4">Default system rules apply (5-day grace, instant upgrade, end-cycle downgrade).</p>
                  <Button variant="defender" onClick={() => { setEditingRule(null); setShowRuleModal(true) }}>
                    Add First Rule
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rules.map(rule => (
                    <Card key={rule.id} className={`p-5 ${rule.enabled ? '' : 'opacity-60'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span>{RULE_TYPE_ICONS[rule.rule_type] || '⚙️'}</span>
                          <div>
                            <h3 className="text-white font-semibold">{rule.rule_name}</h3>
                            <Badge variant={RULE_TYPE_COLORS[rule.rule_type] || 'steel'}>
                              {rule.rule_type.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <Badge variant={rule.enabled ? 'mint' : 'steel'}>
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>

                      {rule.description && (
                        <p className="text-och-steel text-sm mb-3">{rule.description}</p>
                      )}

                      <div className="bg-och-midnight/50 rounded-lg p-3 mb-3">
                        <p className="text-xs text-och-steel mb-1">Configuration:</p>
                        <pre className="text-xs text-white whitespace-pre-wrap font-mono">
                          {JSON.stringify(rule.value, null, 2)}
                        </pre>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant={rule.enabled ? 'outline' : 'defender'}
                          size="sm"
                          onClick={() => handleToggleRule(rule)}
                        >
                          {rule.enabled ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setEditingRule(rule); setShowRuleModal(true) }}
                        >
                          Edit
                        </Button>
                      </div>

                      <p className="text-xs text-och-steel mt-3">Updated: {formatDate(rule.updated_at)}</p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-och-steel text-sm">
                  Global payment and subscription configuration values.
                </p>
                <Button variant="defender" size="sm" onClick={() => { setEditingSetting(null); setShowSettingModal(true) }}>
                  + Add Setting
                </Button>
              </div>

              {settings.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-och-steel mb-2">No custom settings configured yet.</p>
                  <p className="text-och-steel text-sm mb-4">System defaults are in use (grace period: 5 days, enhanced access: 180 days).</p>
                  <Button variant="defender" onClick={() => { setEditingSetting(null); setShowSettingModal(true) }}>
                    Add First Setting
                  </Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {settings.map(setting => (
                    <Card key={setting.id} className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 mr-4">
                          <h3 className="text-white font-semibold font-mono text-sm">{setting.setting_key}</h3>
                          {setting.description && (
                            <p className="text-och-steel text-sm mt-1">{setting.description}</p>
                          )}
                          <div className="bg-och-midnight/50 rounded-lg p-2 mt-2 inline-block">
                            <pre className="text-xs text-och-mint font-mono">
                              {JSON.stringify(setting.setting_value, null, 2)}
                            </pre>
                          </div>
                          <p className="text-xs text-och-steel mt-2">Updated: {formatDate(setting.updated_at)}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setEditingSetting(setting); setShowSettingModal(true) }}
                        >
                          Edit
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rule Modal */}
          {showRuleModal && (
            <RuleModal
              rule={editingRule}
              saving={saving}
              onSave={handleSaveRule}
              onClose={() => { setShowRuleModal(false); setEditingRule(null) }}
            />
          )}

          {/* Setting Modal */}
          {showSettingModal && (
            <SettingModal
              setting={editingSetting}
              saving={saving}
              onSave={handleSaveSetting}
              onClose={() => { setShowSettingModal(false); setEditingSetting(null) }}
            />
          )}
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}

function RuleModal({
  rule, saving, onSave, onClose
}: {
  rule: SubscriptionRule | null
  saving: boolean
  onSave: (data: Partial<SubscriptionRule>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    rule_name: rule?.rule_name || '',
    rule_type: rule?.rule_type || 'grace_period',
    enabled: rule?.enabled ?? true,
    value: rule?.value ? JSON.stringify(rule.value, null, 2) : '{\n  "days": 5\n}',
    description: rule?.description || '',
  })
  const [jsonError, setJsonError] = useState('')

  const handleSave = () => {
    try {
      const parsed = JSON.parse(form.value)
      onSave({ ...form, value: parsed })
      setJsonError('')
    } catch {
      setJsonError('Invalid JSON in configuration field')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">{rule ? 'Edit Rule' : 'Add Rule'}</h2>
            <button onClick={onClose} className="text-och-steel hover:text-white text-xl">✕</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-och-steel mb-1">Rule Name</label>
              <input
                type="text"
                value={form.rule_name}
                onChange={e => setForm({ ...form, rule_name: e.target.value })}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white"
                placeholder="e.g., grace_period_5_days"
              />
            </div>

            <div>
              <label className="block text-sm text-och-steel mb-1">Rule Type</label>
              <select
                value={form.rule_type}
                onChange={e => setForm({ ...form, rule_type: e.target.value as any })}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white"
              >
                <option value="upgrade">Upgrade</option>
                <option value="downgrade">Downgrade</option>
                <option value="grace_period">Grace Period</option>
                <option value="enhanced_access">Enhanced Access</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-och-steel mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white h-20 resize-none"
                placeholder="Describe what this rule does..."
              />
            </div>

            <div>
              <label className="block text-sm text-och-steel mb-1">Configuration (JSON)</label>
              <textarea
                value={form.value}
                onChange={e => { setForm({ ...form, value: e.target.value }); setJsonError('') }}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white font-mono text-sm h-28 resize-none"
                placeholder={'{\n  "days": 5\n}'}
              />
              {jsonError && <p className="text-och-orange text-xs mt-1">{jsonError}</p>}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={e => setForm({ ...form, enabled: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-white text-sm">Enabled</span>
            </label>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="defender" className="flex-1" disabled={saving} onClick={handleSave}>
              {saving ? 'Saving...' : 'Save Rule'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function SettingModal({
  setting, saving, onSave, onClose
}: {
  setting: PaymentSetting | null
  saving: boolean
  onSave: (data: Partial<PaymentSetting>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    setting_key: setting?.setting_key || '',
    setting_value: setting?.setting_value ? JSON.stringify(setting.setting_value, null, 2) : '{}',
    description: setting?.description || '',
  })
  const [jsonError, setJsonError] = useState('')

  const handleSave = () => {
    try {
      const parsed = JSON.parse(form.value)
      onSave({ ...form, setting_value: parsed })
      setJsonError('')
    } catch {
      setJsonError('Invalid JSON in value field')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">{setting ? 'Edit Setting' : 'Add Setting'}</h2>
            <button onClick={onClose} className="text-och-steel hover:text-white text-xl">✕</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-och-steel mb-1">Setting Key</label>
              <input
                type="text"
                value={form.setting_key}
                onChange={e => setForm({ ...form, setting_key: e.target.value })}
                disabled={!!setting}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white font-mono disabled:opacity-50"
                placeholder="e.g., grace_period_days"
              />
            </div>

            <div>
              <label className="block text-sm text-och-steel mb-1">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white"
                placeholder="What this setting controls..."
              />
            </div>

            <div>
              <label className="block text-sm text-och-steel mb-1">Value (JSON)</label>
              <textarea
                value={form.value}
                onChange={e => { setForm({ ...form, value: e.target.value }); setJsonError('') }}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white font-mono text-sm h-24 resize-none"
              />
              {jsonError && <p className="text-och-orange text-xs mt-1">{jsonError}</p>}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="defender" className="flex-1" disabled={saving} onClick={handleSave}>
              {saving ? 'Saving...' : 'Save Setting'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
