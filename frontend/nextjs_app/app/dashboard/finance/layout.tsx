'use client'

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Navigation is included in each page component for better control
  return <>{children}</>
}

