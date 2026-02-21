"use client"

import { Card } from '@/components/ui/Card'
import { CardContent, CardHeader } from '@/components/ui/card-enhanced'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Shield, CreditCard, Key, Lock } from 'lucide-react'

export default function FinanceAccountPage() {
  return (
    <RouteGuard requiredRoles={['finance']}>
      <div className="w-full max-w-4xl py-6 px-4 sm:px-6 lg:px-8 mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Account & Payment Configuration</h1>

        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              What Finance Sees
            </h2>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300 text-sm">
            <p>Finance dashboards show:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-white">Payment method type</strong> — e.g. card, sponsor wallet, bank transfer (no raw credentials)</li>
              <li><strong className="text-white">Linked invoices and subscriptions</strong> — which transactions map to which records</li>
              <li><strong className="text-white">Refund status</strong> — processed back to the original method per gateway rules</li>
            </ul>
            <p className="text-slate-400 pt-2">API keys and secrets are not configured or visible to Finance — only Admins and Gateway Admins manage those.</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-cyan-400" />
              Checkout & Billing Integration
            </h2>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300 text-sm">
            <p>Payment methods (cards, wallets, transfers) are abstracted through <code className="bg-slate-900 px-1 rounded">/checkout/sessions</code>. Refunds are processed back to the original method and enforced by gateway and webhook rules. Sensitive payment data is tokenized; only metadata is exposed to Finance for compliance (e.g. PCI-DSS/GDPR).</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-cyan-400" />
              API Keys & Secrets
            </h2>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300 text-sm">
            <p>Managed through the Identity and API Gateway & Integration Layer (AGIL). Keys are issued to service accounts, partners, or orgs with scoped privileges, stored hashed (e.g. Argon2id) and rotated regularly via Vault/KMS. Finance role does not configure or view API keys.</p>
            <p className="text-slate-400">Rotation policies allow keys to overlap briefly during rotation; audit logs track every key issue, revoke, and usage event.</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-400" />
              Security & Compliance
            </h2>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300 text-sm">
            <p>All secrets are encrypted at rest (KMS/Vault). PCI-DSS/GDPR compliance is maintained by tokenizing sensitive payment data and exposing only metadata to Finance.</p>
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  )
}
