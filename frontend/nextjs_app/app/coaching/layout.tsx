/**
 * Coaching OS Layout
 * Wrapper for persistent sidebar and main content
 */
import { ReactNode } from 'react'

export default function CoachingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="coaching-os-layout">
      {children}
    </div>
  )
}

