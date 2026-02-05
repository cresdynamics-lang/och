'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  BookOpen, 
  AlertTriangle,
  Download,
  MessageSquare,
  Shield,
  BarChart3,
  Plus
} from 'lucide-react'
import { sponsorClient, type SponsorMetrics, type CohortReports, type SeatEntitlement } from '@/services/sponsorClient'

interface SponsorDashboardProps {
  sponsorSlug: string
}

export default function SponsorDashboard({ sponsorSlug }: SponsorDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // State for different dashboard sections
  const [seatMetrics, setSeatMetrics] = useState<SponsorMetrics | null>(null)
  const [completionMetrics, setCompletionMetrics] = useState<SponsorMetrics | null>(null)
  const [placementMetrics, setPlacementMetrics] = useState<SponsorMetrics | null>(null)
  const [roiMetrics, setRoiMetrics] = useState<SponsorMetrics | null>(null)
  const [entitlements, setEntitlements] = useState<SeatEntitlement[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('cohorts')

  useEffect(() => {
    loadDashboardData()
  }, [sponsorSlug])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load all dashboard data in parallel
      const [
        seatData,
        completionData,
        placementData,
        roiData,
        entitlementsData,
        invoicesData
      ] = await Promise.allSettled([
        sponsorClient.getMetrics('seat_utilization'),
        sponsorClient.getMetrics('completion_rates'),
        sponsorClient.getMetrics('placement_metrics'),
        sponsorClient.getMetrics('roi_analysis'),
        sponsorClient.getEntitlements(),
        sponsorClient.getInvoices()
      ])

      // Handle results
      if (seatData.status === 'fulfilled') setSeatMetrics(seatData.value)
      if (completionData.status === 'fulfilled') setCompletionMetrics(completionData.value)
      if (placementData.status === 'fulfilled') setPlacementMetrics(placementData.value)
      if (roiData.status === 'fulfilled') setRoiMetrics(roiData.value)
      if (entitlementsData.status === 'fulfilled') setEntitlements(entitlementsData.value.entitlements)
      if (invoicesData.status === 'fulfilled') setInvoices(invoicesData.value.invoices)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      const result = await sponsorClient.exportDashboardPDF()
      // Open PDF in new tab
      window.open(result.pdf_url, '_blank')
    } catch (err) {
      console.error('Failed to export PDF:', err)
    }
  }

  const handleSendMessage = async () => {
    // This would open a modal for composing messages
    console.log('Send message functionality would be implemented here')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Error loading dashboard: {error}</span>
            </div>
            <Button onClick={loadDashboardData} className="mt-4 w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sponsor Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your sponsored students and track ROI
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleSendMessage} variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" />
            Send Message
          </Button>
          <Button onClick={handleExportPDF} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Seat Utilization */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seat Utilization</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {seatMetrics?.data?.utilization_percentage?.toFixed(1) || '0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              {seatMetrics?.data?.used_seats || 0} of {seatMetrics?.data?.total_seats || 0} seats used
            </p>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completionMetrics?.data?.overall_completion_rate?.toFixed(1) || '0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              {completionMetrics?.data?.active_students || 0} active students
            </p>
          </CardContent>
        </Card>

        {/* Placement Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Placement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {placementMetrics?.data?.placement_rate?.toFixed(1) || '0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              {placementMetrics?.data?.hires_last_30d || 0} hires last 30 days
            </p>
          </CardContent>
        </Card>

        {/* ROI */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI Multiplier</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roiMetrics?.data?.roi_multiplier?.toFixed(1) || '1.0'}x
            </div>
            <p className="text-xs text-muted-foreground">
              Avg. Readiness: {roiMetrics?.data?.avg_readiness_score?.toFixed(0) || '0'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        {/* Cohorts Tab */}
        <TabsContent value="cohorts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Cohorts</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Cohort
            </Button>
          </div>
          
          <div className="grid gap-4">
            {entitlements.map((cohort) => (
              <Card key={cohort.cohort_id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{cohort.cohort_name}</CardTitle>
                    <Badge variant={cohort.status === 'active' ? 'defender' : 'steel'}>
                      {cohort.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Track</p>
                      <p className="font-medium capitalize">{cohort.track_slug}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Seats Used</p>
                      <p className="font-medium">{cohort.seats_used} / {cohort.seats_allocated}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Utilization</p>
                      <p className="font-medium">{cohort.utilization_percentage.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Available</p>
                      <p className="font-medium">{cohort.seats_available} seats</p>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      Add Students
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Billing & Invoices</h2>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length > 0 ? (
                <div className="space-y-4">
                  {invoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.invoice_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{invoice.cohort_name}</p>
                        <p className="text-sm text-muted-foreground">{invoice.billing_month}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">KES {invoice.net_amount_kes.toLocaleString()}</p>
                        <Badge variant={invoice.payment_status === 'paid' ? 'defender' : invoice.payment_status === 'overdue' ? 'orange' : 'steel'}>
                          {invoice.payment_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No invoices available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Analytics & Insights</h2>
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Advanced Analytics
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Placement Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Hires:</span>
                    <span className="font-medium">{placementMetrics?.data?.total_hires || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. Salary (KES):</span>
                    <span className="font-medium">{placementMetrics?.data?.avg_salary_kes?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recent Hires (30d):</span>
                    <span className="font-medium">{placementMetrics?.data?.hires_last_30d || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ROI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>ROI Multiplier:</span>
                    <span className="font-medium">{roiMetrics?.data?.roi_multiplier?.toFixed(2) || '1.00'}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. Readiness Score:</span>
                    <span className="font-medium">{roiMetrics?.data?.avg_readiness_score?.toFixed(0) || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span className="font-medium text-sm">
                      {roiMetrics?.last_updated ? new Date(roiMetrics.last_updated).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Privacy & Consent</h2>
            <Button variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Consent Report
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>GDPR Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Employer Profile Sharing</p>
                    <p className="text-sm text-muted-foreground">Students who consent to share profiles with employers</p>
                  </div>
                  <Badge variant="defender">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Portfolio Public Access</p>
                    <p className="text-sm text-muted-foreground">Students with public portfolio access enabled</p>
                  </div>
                  <Badge variant="defender">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Placement Tracking</p>
                    <p className="text-sm text-muted-foreground">Consent for tracking placement outcomes</p>
                  </div>
                  <Badge variant="defender">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
