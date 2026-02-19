'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function PaystackReturnPage() {
  const searchParams = useSearchParams()
  const [done, setDone] = useState(false)
  const reference = searchParams.get('reference')

  useEffect(() => {
    if (!reference) return
    if (typeof window === 'undefined') return
    if (window.opener) {
      window.opener.postMessage({ type: 'paystack_success', reference }, window.location.origin)
      setDone(true)
      window.close()
    } else {
      setDone(true)
    }
  }, [reference])

  if (!reference) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">No payment reference found.</p>
          <Link href="/dashboard/student/subscription" className="text-primary underline mt-2 inline-block">
            Back to subscription
          </Link>
        </div>
      </div>
    )
  }

  if (done && !window.opener) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center">
          <p className="text-foreground font-medium">Payment completed.</p>
          <p className="text-muted-foreground text-sm mt-1">You can close this window.</p>
          <Link
            href="/dashboard/student/subscription"
            className="mt-4 inline-block text-primary underline"
          >
            Back to subscription
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="text-center">
        <p className="text-muted-foreground">Completing payment...</p>
      </div>
    </div>
  )
}
