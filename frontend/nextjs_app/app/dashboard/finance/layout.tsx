'use client'

import { MFARequiredGuard } from '@/components/auth/MFARequiredGuard'

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MFARequiredGuard>
      {children}
    </MFARequiredGuard>
  )
}

