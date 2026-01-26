'use client'

import Link from 'next/link'

interface ConnectionCardProps {
  title: string
  value: string
  subtitle: string
  icon: string
  action: string
  to?: string
  onClick?: () => void
  color: 'blue' | 'indigo' | 'emerald' | 'purple'
}

const colorClasses = {
  blue: {
    bg: 'bg-och-defender/20',
    border: 'border-och-defender/30',
    text: 'text-och-defender',
    button: 'bg-och-defender hover:bg-och-defender/80',
  },
  indigo: {
    bg: 'bg-och-defender/20',
    border: 'border-och-defender/30',
    text: 'text-och-defender',
    button: 'bg-och-defender hover:bg-och-defender/80',
  },
  emerald: {
    bg: 'bg-och-mint/20',
    border: 'border-och-mint/30',
    text: 'text-och-mint',
    button: 'bg-och-mint hover:bg-och-mint/80 text-och-midnight',
  },
  purple: {
    bg: 'bg-och-gold/20',
    border: 'border-och-gold/30',
    text: 'text-och-gold',
    button: 'bg-och-gold hover:bg-och-gold/80 text-och-midnight',
  },
}

function ConnectionCard({ title, value, subtitle, icon, action, to, onClick, color }: ConnectionCardProps) {
  const colors = colorClasses[color]
  const isLink = !!to
  const buttonProps = isLink ? { href: to! } : { onClick, type: 'button' as const }

  return (
    <div className={`p-4 md:p-6 rounded-xl border ${colors.border} ${colors.bg} transition-all hover:border-opacity-60`}>
      <div className="flex items-start justify-between mb-4">
        <div className="text-3xl">{icon}</div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.text} bg-och-midnight/50`}>
          {title}
        </div>
      </div>
      
      <h3 className="text-xl md:text-2xl font-bold text-white mb-1">{value}</h3>
      <p className="text-xs md:text-sm text-och-steel mb-3 md:mb-4">{subtitle}</p>
      
      {isLink ? (
        <Link
          href={to!}
          className={`w-full px-4 py-2 ${colors.button} rounded-lg font-semibold text-sm transition-colors block text-center`}
        >
          {action}
        </Link>
      ) : (
        <button
          onClick={onClick}
          type="button"
          className={`w-full px-4 py-2 ${colors.button} rounded-lg font-semibold text-sm transition-colors`}
        >
          {action}
        </button>
      )}
    </div>
  )
}

interface ConnectionsRowProps {
  employeesCount?: number
  employeesShared?: number
  directorName?: string
  directorTrack?: string
  financeTotal?: number
  financePending?: number
  teamMembers?: number
  teamAdmins?: number
}

export function ConnectionsRow({
  employeesCount = 47,
  employeesShared = 23,
  directorName = 'Jane Smith',
  directorTrack = 'Cyber Leadership',
  financeTotal = 75000,
  financePending = 3,
  teamMembers = 3,
  teamAdmins = 2,
}: ConnectionsRowProps) {
  const handleRequestDirectorReport = async () => {
    try {
      // TODO: Implement director report request API
      // await sponsorClient.requestDirectorReport({ request_type: 'graduate_breakdown' })
      window.location.href = '/dashboard/sponsor/reports'
    } catch (error) {
      console.error('Failed to request director report:', error)
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
      <ConnectionCard
        title="Employees"
        value={`${employeesCount} Active`}
        subtitle={`${employeesShared} profiles shared`}
        icon="👥"
        action="View Roster"
        to="/dashboard/sponsor/employees"
        color="blue"
      />
      <ConnectionCard
        title="Director"
        value={directorName}
        subtitle={directorTrack}
        icon="📊"
        action="Request Report"
        onClick={handleRequestDirectorReport}
        color="indigo"
      />
      <ConnectionCard
        title="Finance"
        value={`BWP ${(financeTotal / 1000).toFixed(0)}K`}
        subtitle={`${financePending} invoices pending`}
        icon="💰"
        action="Request Refund"
        to="/dashboard/sponsor/finance"
        color="emerald"
      />
      <ConnectionCard
        title="Team"
        value={`${teamMembers} Members`}
        subtitle={`${teamAdmins} admins, ${teamMembers - teamAdmins} viewer${teamMembers - teamAdmins !== 1 ? 's' : ''}`}
        icon="👥"
        action="Manage Team"
        to="/dashboard/sponsor/team"
        color="purple"
      />
    </div>
  )
}


