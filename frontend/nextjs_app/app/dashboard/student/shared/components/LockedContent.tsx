'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useEntitlements } from '../hooks/useEntitlements'
import Link from 'next/link'

interface LockedContentProps {
  contentType: 'mission' | 'module' | 'lesson'
  requiredTier: number
  children?: React.ReactNode
}

export function LockedContent({ contentType, requiredTier, children }: LockedContentProps) {
  const { data: entitlements } = useEntitlements()
  
  if (!entitlements || entitlements.tier >= requiredTier) {
    return <>{children}</>
  }
  
  return (
    <Card className="bg-och-midnight/50 border border-och-steel/20 relative">
      <div className="absolute inset-0 bg-och-midnight/80 backdrop-blur-sm z-10 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-2xl mb-2">🔒</div>
          <h3 className="text-xl font-bold text-white mb-2">Content Locked</h3>
          <p className="text-och-steel mb-4">
            This {contentType} requires {requiredTier === 7 ? 'Professional' : `Tier ${requiredTier}`} subscription
          </p>
          <Link href="/dashboard/student/subscription">
            <Button variant="defender">Upgrade Now</Button>
          </Link>
        </div>
      </div>
      {children}
    </Card>
  )
}

