'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function CertificatesClient() {
  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-orange">Certificates</h1>
            <p className="text-och-steel">View and manage issued certificates.</p>
          </div>
          <Link href="/dashboard/director">
            <Button variant="outline">Back</Button>
          </Link>
        </div>

        <Card>
          <p className="text-och-steel">
            Certificate management interface coming soon. Certificates are automatically generated
            when students complete programs.
          </p>
        </Card>
      </div>
    </div>
  )
}












