'use client'

import { Card } from '@/components/ui/Card'

export function DashboardSkeleton() {
  return (
    <div className="w-full py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="h-8 w-48 bg-och-steel/20 rounded skeleton mb-2" />
        <div className="h-4 w-64 bg-och-steel/20 rounded skeleton" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card className="h-[200px] skeleton"><div /></Card>
        </div>
        <div>
          <Card className="h-[200px] skeleton"><div /></Card>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="h-[160px] skeleton"><div /></Card>
        ))}
      </div>

      <div className="mb-6">
        <div className="h-6 w-32 bg-och-steel/20 rounded skeleton mb-4" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="w-64 h-32 skeleton flex-shrink-0"><div /></Card>
          ))}
        </div>
      </div>
    </div>
  )
}

