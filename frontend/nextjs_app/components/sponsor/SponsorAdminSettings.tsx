'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Wallet,
  CreditCard,
  Users,
  FileText,
  Settings,
  CheckCircle2,
  AlertCircle,
  Download,
  ExternalLink,
  BarChart3,
  UserPlus,
  ClipboardList,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { sponsorClient } from '@/services/sponsorClient'
import type {
  SponsorProfile,
  BillingCatalog,
  SponsorInvoice,
  SeatEntitlement,
  SponsorCohort,
  StudentConsent,
  SponsorDashboardSummary,
} from '@/services/sponsorClient'

type SponsorSettingsSection =
  | 'organization'
  | 'budget'
  | 'program'
  | 'users'
  | 'reporting'

const SECTIONS: { id: SponsorSettingsSection; label: string; icon: typeof Building2 }[] = [
  { id: 'organization', label: 'Organization & Wallet', icon: Building2 },
  { id: 'budget', label: 'Budget & Finance', icon: CreditCard },
  { id: 'program', label: 'Program Sponsorship', icon: ClipboardList },
  { id: 'users', label: 'User & Role Management', icon: Users },
  { id: 'reporting', label: 'Reporting & Compliance', icon: BarChart3 },
]

export function SponsorAdminSettings() {
  const [activeSection, setActiveSection] = useState<SponsorSettingsSection>('organization')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null)

  const [profile, setProfile] = useState<SponsorProfile | null>(null)
  const [catalog, setCatalog] = useState<BillingCatalog | null>(null)
  const [invoices, setInvoices] = useState<SponsorInvoice[]>([])
  const [entitlements, setEntitlements] = useState<SeatEntitlement[]>([])
  const [cohorts, setCohorts] = useState<SponsorCohort[]>([])
  const [consents, setConsents] = useState<StudentConsent[]>([])
  const [summary, setSummary] = useState<SponsorDashboardSummary | null>(null)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [
        profileRes,
        catalogRes,
        invoicesRes,
        entitlementsRes,
        cohortsRes,
        consentsRes,
        summaryRes,
      ] = await Promise.allSettled([
        sponsorClient.getProfile(),
        sponsorClient.getBillingCatalog(),
        sponsorClient.getInvoices(),
        sponsorClient.getEntitlements(),
        sponsorClient.getCohorts({ limit: 100 }),
        sponsorClient.getSponsorConsents(),
        sponsorClient.getSummary(),
      ])
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value)
      if (catalogRes.status === 'fulfilled') setCatalog(catalogRes.value)
      if (invoicesRes.status === 'fulfilled') setInvoices(invoicesRes.value.invoices ?? [])
      if (entitlementsRes.status === 'fulfilled') setEntitlements(entitlementsRes.value.entitlements ?? [])
      if (cohortsRes.status === 'fulfilled') setCohorts(cohortsRes.value.results ?? [])
      if (consentsRes.status === 'fulfilled') setConsents(consentsRes.value.consents ?? [])
      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'KSh') =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: currency === 'BWP' ? 'BWP' : 'KES', minimumFractionDigits: 0 }).format(amount)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-och-mint border-t-transparent rounded-full animate-spin" />
          <p className="text-och-steel font-medium">Loading sponsor settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-och-gold/10 border border-och-gold/20 flex items-center justify-center">
            <Settings className="w-6 h-6 text-och-gold" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Sponsor Admin Settings</h1>
            <p className="text-och-steel text-sm">
              Control financial commitments, seat allocations, and compliance visibility
            </p>
          </div>
        </div>
        {saveStatus && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
              saveStatus === 'success' ? 'bg-och-mint/10 border border-och-mint/30 text-och-mint' : 'bg-och-orange/10 border border-och-orange/30 text-och-orange'
            }`}
          >
            {saveStatus === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {saveStatus === 'success' ? 'Settings saved' : 'Something went wrong'}
          </motion.div>
        )}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-och-orange/10 border border-och-orange/30 text-och-orange flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setError(null)}>Dismiss</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3">
          <Card className="p-3">
            <nav className="space-y-1">
              {SECTIONS.map(({ id, label, icon: Icon }) => {
                const isActive = activeSection === id
                return (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                      isActive ? 'bg-och-mint/10 border border-och-mint/30 text-och-mint' : 'text-och-steel hover:bg-och-midnight/50 hover:text-white border border-transparent'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="font-medium text-sm">{label}</span>
                    {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-och-mint" />}
                  </button>
                )
              })}
            </nav>
          </Card>
        </aside>

        <main className="lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
            >
              {activeSection === 'organization' && (
                <OrganizationSection
                  profile={profile}
                  summary={summary}
                  entitlements={entitlements}
                  formatCurrency={formatCurrency}
                />
              )}
              {activeSection === 'budget' && (
                <BudgetSection
                  catalog={catalog}
                  invoices={invoices}
                  entitlements={entitlements}
                  formatCurrency={formatCurrency}
                />
              )}
              {activeSection === 'program' && (
                <ProgramSection cohorts={cohorts} entitlements={entitlements} />
              )}
              {activeSection === 'users' && <UsersSection />}
              {activeSection === 'reporting' && (
                <ReportingSection summary={summary} consents={consents} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

function OrganizationSection({
  profile,
  summary,
  entitlements,
  formatCurrency,
}: {
  profile: SponsorProfile | null
  summary: SponsorDashboardSummary | null
  entitlements: SeatEntitlement[]
  formatCurrency: (n: number, c?: string) => string
}) {
  const orgs = profile?.sponsor_organizations ?? []
  const primary = orgs[0]
  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-och-mint" />
          Organization & Wallet
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-och-steel uppercase tracking-wider mb-2">Org Profile</h3>
            <div className="rounded-lg bg-och-midnight/50 border border-och-steel/20 p-4">
              {primary ? (
                <ul className="space-y-1 text-sm text-white">
                  <li><span className="text-och-steel">Name:</span> {primary.name}</li>
                  <li><span className="text-och-steel">Slug:</span> {primary.slug}</li>
                  <li><span className="text-och-steel">Your role:</span> {primary.role}</li>
                </ul>
              ) : (
                <p className="text-och-steel text-sm">No sponsor organization linked. Contact support.</p>
              )}
              <p className="text-och-steel text-xs mt-2">Billing address and contact info are managed by your org admin.</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-och-steel uppercase tracking-wider mb-2">Wallet Management</h3>
            <div className="rounded-lg bg-och-midnight/50 border border-och-steel/20 p-4 flex items-center gap-4">
              <Wallet className="w-10 h-10 text-och-gold" />
              <div>
                <p className="text-och-steel text-sm">Balance / spend (KSh, primary currency)</p>
                <p className="text-xl font-bold text-white">
                  {summary != null
                    ? `${formatCurrency(Number(summary.budget_used ?? 0))} of ${formatCurrency(Number(summary.budget_total ?? 0))}`
                    : '—'}
                </p>
                <p className="text-xs text-och-steel mt-1">Top-up and refunds via Finance & Billing.</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-och-steel uppercase tracking-wider mb-2">Top-up / Refunds</h3>
            <p className="text-och-steel text-sm mb-3">Add funds or request refunds via billing.</p>
            <div className="flex gap-2">
              <Link href="/dashboard/sponsor/finance">
                <Button variant="mint" size="sm">Finance & Billing</Button>
              </Link>
              <Link href="/dashboard/sponsor/cohorts">
                <Button variant="outline" size="sm">Cohorts</Button>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-och-steel uppercase tracking-wider mb-2">Sponsored Seats</h3>
            <p className="text-och-steel text-sm mb-2">Allocation per program/cohort.</p>
            {entitlements.length === 0 ? (
              <p className="text-och-steel text-sm">No entitlements yet. Purchase or assign seats from Cohorts.</p>
            ) : (
              <ul className="space-y-2">
                {entitlements.slice(0, 10).map((e) => (
                  <li key={e.cohort_id} className="flex items-center justify-between rounded-lg bg-och-midnight/50 border border-och-steel/20 px-3 py-2 text-sm">
                    <span className="text-white font-medium">{e.cohort_name || e.cohort_id}</span>
                    <Badge variant="mint" className="text-xs">{e.seats_used} / {e.seats_allocated} used</Badge>
                  </li>
                ))}
                {entitlements.length > 10 && (
                  <li className="text-och-steel text-xs">+{entitlements.length - 10} more</li>
                )}
              </ul>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

function BudgetSection({
  catalog,
  invoices,
  entitlements,
  formatCurrency,
}: {
  catalog: BillingCatalog | null
  invoices: SponsorInvoice[]
  entitlements: SeatEntitlement[]
  formatCurrency: (n: number, c?: string) => string
}) {
  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-och-mint" />
          Budget & Finance
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-och-steel uppercase tracking-wider mb-2">Budget Limits</h3>
            <p className="text-och-steel text-sm">Define maximum spend per program/cohort. Configure in Finance or with your account manager.</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-och-steel uppercase tracking-wider mb-2">Currency Settings</h3>
            <p className="text-och-steel text-sm mb-2">Default currency: <strong className="text-white">KES (KSh)</strong>. BWP supported where applicable (e.g. Botswana).</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-och-steel uppercase tracking-wider mb-2">Invoice Access</h3>
            <p className="text-och-steel text-sm mb-2">View and download invoices (GET /api/v1/billing/invoices).</p>
            {invoices.length === 0 ? (
              <p className="text-och-steel text-sm">No invoices yet.</p>
            ) : (
              <ul className="space-y-2">
                {invoices.slice(0, 5).map((inv) => (
                  <li key={inv.invoice_id} className="flex items-center justify-between rounded-lg bg-och-midnight/50 border border-och-steel/20 px-3 py-2 text-sm">
                    <span className="text-white">{inv.cohort_name} — {inv.billing_month}</span>
                    <span className="text-och-steel">{formatCurrency(inv.net_amount_kes)} · {inv.payment_status}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/dashboard/sponsor/finance" className="inline-flex items-center gap-1 mt-2 text-och-mint text-sm font-medium hover:underline">
              <Download className="w-4 h-4" /> View all invoices
            </Link>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-och-steel uppercase tracking-wider mb-2">Entitlements</h3>
            <p className="text-och-steel text-sm mb-2">Validate seat/payment entitlements (GET /api/v1/billing/entitlements).</p>
            {entitlements.length === 0 ? (
              <p className="text-och-steel text-sm">No entitlements.</p>
            ) : (
              <p className="text-och-steel text-sm">{entitlements.length} cohort(s) with seat entitlements.</p>
            )}
          </div>

          {catalog && catalog.pricing_models?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-och-steel uppercase tracking-wider mb-2">Billing Catalog</h3>
              <p className="text-och-steel text-sm mb-2">Products, prices, seat caps (GET /api/v1/billing/catalog).</p>
              <ul className="space-y-1 text-sm text-white">
                {catalog.pricing_models.slice(0, 5).map((m, i) => (
                  <li key={i}>{m.name} — {m.billing_cycle}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function ProgramSection({
  cohorts,
  entitlements,
}: {
  cohorts: SponsorCohort[]
  entitlements: SeatEntitlement[]
}) {
  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-och-mint" />
          Program Sponsorship
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-och-steel uppercase tracking-wider mb-2">Seat Pools</h3>
            <p className="text-och-steel text-sm">Configure paid, scholarship, and sponsored seats per cohort. Managed via Cohorts and Billing.</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-och-steel uppercase tracking-wider mb-2">Program Enrollment Rules</h3>
            <p className="text-och-steel text-sm">Define who can use sponsored seats (e.g. linked students, eligibility). Configure in cohort enrollment.</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-och-steel uppercase tracking-wider mb-2">Cohort Sponsorship</h3>
            <p className="text-och-steel text-sm mb-2">Assign sponsorship to specific cohorts.</p>
            <ul className="space-y-2">
              {cohorts.length === 0 ? (
                <li className="text-och-steel text-sm">No cohorts yet.</li>
              ) : (
                cohorts.slice(0, 10).map((c) => (
                  <li key={c.cohort_id} className="flex items-center justify-between rounded-lg bg-och-midnight/50 border border-och-steel/20 px-3 py-2 text-sm">
                    <span className="text-white font-medium">{c.name}</span>
                    <Badge variant="defender" className="text-xs">{c.status}</Badge>
                  </li>
                ))
              )}
            </ul>
            <Link href="/dashboard/sponsor/cohorts" className="inline-flex items-center gap-1 mt-2 text-och-mint text-sm font-medium hover:underline">
              <ExternalLink className="w-4 h-4" /> Manage cohorts
            </Link>
          </div>

          <div className="rounded-lg bg-och-mint/5 border border-och-mint/20 p-3 text-sm text-och-steel">
            <strong className="text-och-mint">Key APIs:</strong> POST /api/v1/programs/cohorts/&#123;id&#125;/enrollments — Enroll sponsored students. GET /api/v1/programs/cohorts/&#123;id&#125;/enrollments — List sponsored enrollments.
          </div>
        </div>
      </Card>
    </div>
  )
}

function UsersSection() {
  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-och-mint" />
          User & Role Management
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-och-steel uppercase tracking-wider mb-2">Sponsor Admin Role</h3>
            <p className="text-och-steel text-sm">Full access to finance, seat allocation, and reporting.</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-och-steel uppercase tracking-wider mb-2">Sponsor Staff Role</h3>
            <p className="text-och-steel text-sm">Limited access (e.g. view only, no refunds).</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-och-steel uppercase tracking-wider mb-2">Delegation</h3>
            <p className="text-och-steel text-sm mb-3">Add or remove sponsor staff accounts. Managed by your organization admin.</p>
            <Link href="/dashboard/sponsor/team">
              <Button variant="outline" size="sm" className="inline-flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Team
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}

function ReportingSection({
  summary,
  consents,
}: {
  summary: SponsorDashboardSummary | null
  consents: StudentConsent[]
}) {
  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-och-mint" />
          Reporting & Compliance
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-och-steel uppercase tracking-wider mb-2">Usage Reports</h3>
            <p className="text-och-steel text-sm mb-2">Track seat utilization, budget spend, completion rates.</p>
            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg bg-och-midnight/50 border border-och-steel/20 p-3 text-center">
                  <p className="text-2xl font-bold text-white">{summary.seats_used} / {summary.seats_total}</p>
                  <p className="text-xs text-och-steel">Seats</p>
                </div>
                <div className="rounded-lg bg-och-midnight/50 border border-och-steel/20 p-3 text-center">
                  <p className="text-2xl font-bold text-white">{Number(summary.budget_used_pct ?? 0).toFixed(0)}%</p>
                  <p className="text-xs text-och-steel">Budget used</p>
                </div>
                <div className="rounded-lg bg-och-midnight/50 border border-och-steel/20 p-3 text-center">
                  <p className="text-2xl font-bold text-white">{Number(summary.avg_completion_pct ?? 0).toFixed(0)}%</p>
                  <p className="text-xs text-och-steel">Avg completion</p>
                </div>
                <div className="rounded-lg bg-och-midnight/50 border border-och-steel/20 p-3 text-center">
                  <p className="text-2xl font-bold text-white">{summary.graduates_count ?? 0}</p>
                  <p className="text-xs text-och-steel">Graduates</p>
                </div>
              </div>
            )}
            <Link href="/dashboard/sponsor/reports" className="inline-flex items-center gap-1 mt-2 text-och-mint text-sm font-medium hover:underline">
              <FileText className="w-4 h-4" /> Request detailed report from director
            </Link>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-och-steel uppercase tracking-wider mb-2">Audit Logs</h3>
            <p className="text-och-steel text-sm">Record sponsorship actions (seat assignment, refunds). Available in your org audit trail.</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-och-steel uppercase tracking-wider mb-2">Consent Visibility</h3>
            <p className="text-och-steel text-sm mb-2">Ensure sponsored students have proper consents (e.g. employer_share).</p>
            {consents.length === 0 ? (
              <p className="text-och-steel text-sm">No consent records loaded.</p>
            ) : (
              <p className="text-och-steel text-sm">{consents.length} student(s) with consent records. View in Employees or Cohorts.</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
