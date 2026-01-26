'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export function MentorSupportAndHelp() {
  return (
    <Card className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Support & Help</h2>
          <p className="text-sm text-och-steel">
            Get help, share feedback, and learn how to get the most from the mentor tools.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-och-midnight/60 p-4">
          <h3 className="text-sm font-semibold text-white">Quick Resources</h3>
          <ul className="mt-2 space-y-1 text-sm text-och-steel">
            <li>
              <Link href="/help" className="text-och-defender hover:text-och-mint">
                Mentor Help Center
              </Link>
            </li>
            <li>
              <Link href="/docs/mentor-guide" className="text-och-defender hover:text-och-mint">
                Mentor onboarding guide
              </Link>
            </li>
            <li>
              <Link href="/community" className="text-och-defender hover:text-och-mint">
                Community & discussion space
              </Link>
            </li>
          </ul>
        </div>

        <div className="rounded-lg bg-och-midnight/60 p-4">
          <h3 className="text-sm font-semibold text-white">Contact Support</h3>
          <p className="mt-2 text-sm text-och-steel">
            Stuck on something or noticed an issue? Reach out to the OCH team so we can help.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button
              variant="defender"
              size="sm"
              onClick={() => {
                // eslint-disable-next-line no-alert
                alert('This will open a support chat or email composer in a future release.')
              }}
            >
              Chat with support
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = 'mailto:support@och-platform.test?subject=Mentor%20support'
              }}
            >
              Email support
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}


