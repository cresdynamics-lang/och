'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useCohorts } from '@/hooks/usePrograms'
import { programsClient } from '@/services/programsClient'
import Link from 'next/link'

export default function ReportsClient() {
  const { cohorts } = useCohorts()
  const [selectedCohortId, setSelectedCohortId] = useState<string>('')
  const [exporting, setExporting] = useState(false)

  const handleExport = async (format: 'csv' | 'json') => {
    if (!selectedCohortId) return
    
    setExporting(true)
    try {
      const blob = await programsClient.exportCohortReport(selectedCohortId, format)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cohort-report-${selectedCohortId}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-orange">Reports & Exports</h1>
            <p className="text-och-steel">Export cohort data to CSV or JSON format.</p>
          </div>
          <Link href="/dashboard/director">
            <Button variant="outline">Back</Button>
          </Link>
        </div>

        <Card>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Select Cohort</label>
              <select
                value={selectedCohortId}
                onChange={(e) => setSelectedCohortId(e.target.value)}
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender rounded-lg text-white"
              >
                <option value="">Select a cohort</option>
                {cohorts?.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.name} {cohort.track_name && `(${cohort.track_name})`}
                  </option>
                ))}
              </select>
            </div>

            {selectedCohortId && (
              <div className="flex gap-4">
                <Button
                  variant="orange"
                  onClick={() => handleExport('json')}
                  disabled={exporting}
                >
                  {exporting ? 'Exporting...' : 'Export JSON'}
                </Button>
                <Button
                  variant="defender"
                  onClick={() => handleExport('csv')}
                  disabled={exporting}
                >
                  {exporting ? 'Exporting...' : 'Export CSV'}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}












