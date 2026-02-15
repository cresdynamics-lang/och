'use client'

import { useState, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'

interface PaymentGateway {
  id: string
  name: string
  gateway_type: string
  enabled: boolean
  is_test_mode: boolean
  supported_currencies: string[]
  priority: number
  created_at: string
  updated_at: string
}

const GATEWAY_ICONS: Record<string, string> = {
  stripe: '💳',
  paystack: '🟢',
  flutterwave: '🦋',
  mpesa: '📱',
  orange_money: '🟠',
  airtel_money: '🔴',
  visa_mastercard: '💳',
}

export default function PaymentGatewaysPage() {
  const [gateways, setGateways] = useState<PaymentGateway[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadGateways()
  }, [])

  const loadGateways = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await apiGateway.get('/admin/gateways/') as PaymentGateway[] | { results: PaymentGateway[] }
      setGateways(Array.isArray(res) ? res : (res.results || []))
    } catch (err: any) {
      setError(err.message || 'Failed to load gateways')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (gateway: PaymentGateway) => {
    try {
      setTogglingId(gateway.id)
      await apiGateway.post(`/admin/gateways/${gateway.id}/toggle_enabled/`)
      await loadGateways()
    } catch (err: any) {
      alert(err.message || 'Failed to toggle gateway')
    } finally {
      setTogglingId(null)
    }
  }

  const handleSave = async (data: Partial<PaymentGateway>) => {
    try {
      setSaving(true)
      if (editingGateway?.id) {
        await apiGateway.put(`/admin/gateways/${editingGateway.id}/`, data)
      } else {
        await apiGateway.post('/admin/gateways/', data)
      }
      await loadGateways()
      setShowCreateModal(false)
      setEditingGateway(null)
      alert('Gateway saved successfully!')
    } catch (err: any) {
      alert(err.message || 'Failed to save gateway')
    } finally {
      setSaving(false)
    }
  }

  return (
    <RouteGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-och-defender">Payment Gateways</h1>
              <p className="text-och-steel">Enable and configure payment methods for subscription billing</p>
            </div>
            <Button variant="defender" onClick={() => { setEditingGateway(null); setShowCreateModal(true) }}>
              + Add Gateway
            </Button>
          </div>

          {error && (
            <Card className="p-4 bg-och-orange/20 border-och-orange">
              <p className="text-och-orange">{error}</p>
            </Card>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
            </div>
          ) : gateways.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-och-steel text-lg mb-2">No payment gateways configured</p>
              <p className="text-och-steel text-sm mb-4">
                Add Stripe, Paystack, Flutterwave, M-Pesa, or other gateways to accept payments.
              </p>
              <Button variant="defender" onClick={() => { setEditingGateway(null); setShowCreateModal(true) }}>
                Add First Gateway
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gateways.map(gw => (
                <Card key={gw.id} className={`p-6 ${gw.enabled ? 'border-och-mint/30' : 'border-och-steel/20'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{GATEWAY_ICONS[gw.gateway_type] || '💳'}</span>
                      <div>
                        <h3 className="text-white font-bold text-lg">{gw.name}</h3>
                        <p className="text-xs text-och-steel capitalize">{gw.gateway_type?.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <Badge variant={gw.enabled ? 'mint' : 'steel'}>
                      {gw.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-och-steel">Mode:</span>
                      <Badge variant={gw.is_test_mode ? 'gold' : 'mint'}>
                        {gw.is_test_mode ? 'Test' : 'Live'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-och-steel">Priority:</span>
                      <span className="text-white">{gw.priority}</span>
                    </div>
                    {gw.supported_currencies?.length > 0 && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-och-steel shrink-0">Currencies:</span>
                        <span className="text-white text-right">{gw.supported_currencies.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant={gw.enabled ? 'outline' : 'defender'}
                      size="sm"
                      onClick={() => handleToggle(gw)}
                      disabled={togglingId === gw.id}
                      className="flex-1"
                    >
                      {togglingId === gw.id ? '...' : gw.enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditingGateway(gw); setShowCreateModal(true) }}
                    >
                      Edit
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {showCreateModal && (
            <GatewayModal
              gateway={editingGateway}
              saving={saving}
              onSave={handleSave}
              onClose={() => { setShowCreateModal(false); setEditingGateway(null) }}
            />
          )}
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}

function GatewayModal({
  gateway,
  saving,
  onSave,
  onClose,
}: {
  gateway: PaymentGateway | null
  saving: boolean
  onSave: (data: Partial<PaymentGateway>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    name: gateway?.name || '',
    gateway_type: gateway?.gateway_type || 'stripe',
    enabled: gateway?.enabled ?? true,
    is_test_mode: gateway?.is_test_mode ?? true,
    supported_currencies: gateway?.supported_currencies?.join(', ') || 'USD',
    priority: gateway?.priority ?? 1,
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">{gateway ? 'Edit Gateway' : 'Add Gateway'}</h2>
            <button onClick={onClose} className="text-och-steel hover:text-white text-xl">✕</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-och-steel mb-1">Display Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white"
                placeholder="e.g., Stripe USD"
              />
            </div>

            <div>
              <label className="block text-sm text-och-steel mb-1">Gateway Type</label>
              <select
                value={form.gateway_type}
                onChange={e => setForm({ ...form, gateway_type: e.target.value })}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white"
              >
                <option value="stripe">Stripe</option>
                <option value="paystack">Paystack</option>
                <option value="flutterwave">Flutterwave</option>
                <option value="mpesa">M-Pesa</option>
                <option value="orange_money">Orange Money</option>
                <option value="airtel_money">Airtel Money</option>
                <option value="visa_mastercard">Visa / Mastercard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-och-steel mb-1">Supported Currencies (comma-separated)</label>
              <input
                type="text"
                value={form.supported_currencies}
                onChange={e => setForm({ ...form, supported_currencies: e.target.value })}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white"
                placeholder="USD, KES, NGN"
              />
            </div>

            <div>
              <label className="block text-sm text-och-steel mb-1">Priority (lower = tried first)</label>
              <input
                type="number"
                value={form.priority}
                onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white"
              />
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={e => setForm({ ...form, enabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-white text-sm">Enabled</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_test_mode}
                  onChange={e => setForm({ ...form, is_test_mode: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-white text-sm">Test Mode</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="defender"
              className="flex-1"
              disabled={saving}
              onClick={() => onSave({
                ...form,
                supported_currencies: form.supported_currencies.split(',').map(c => c.trim()).filter(Boolean),
              })}
            >
              {saving ? 'Saving...' : 'Save Gateway'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
