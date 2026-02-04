'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
      <div className=\"flex items-center justify-center min-h-screen\">
        <div className=\"animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600\"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className=\"flex items-center justify-center min-h-screen\">
        <Card className=\"w-full max-w-md\">
          <CardContent className=\"pt-6\">
            <div className=\"flex items-center space-x-2 text-red-600\">
              <AlertTriangle className=\"h-5 w-5\" />
              <span>Error loading dashboard: {error}</span>
            </div>
            <Button onClick={loadDashboardData} className=\"mt-4 w-full\">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className=\"space-y-6 p-6\">
      {/* Header */}\n      <div className=\"flex items-center justify-between\">\n        <div>\n          <h1 className=\"text-3xl font-bold tracking-tight\">Sponsor Dashboard</h1>\n          <p className=\"text-muted-foreground\">\n            Monitor your sponsored students and track ROI\n          </p>\n        </div>\n        <div className=\"flex space-x-2\">\n          <Button onClick={handleSendMessage} variant=\"outline\">\n            <MessageSquare className=\"h-4 w-4 mr-2\" />\n            Send Message\n          </Button>\n          <Button onClick={handleExportPDF} variant=\"outline\">\n            <Download className=\"h-4 w-4 mr-2\" />\n            Export PDF\n          </Button>\n        </div>\n      </div>

      {/* Key Metrics Cards */}\n      <div className=\"grid gap-4 md:grid-cols-2 lg:grid-cols-4\">\n        {/* Seat Utilization */}\n        <Card>\n          <CardHeader className=\"flex flex-row items-center justify-between space-y-0 pb-2\">\n            <CardTitle className=\"text-sm font-medium\">Seat Utilization</CardTitle>\n            <Users className=\"h-4 w-4 text-muted-foreground\" />\n          </CardHeader>\n          <CardContent>\n            <div className=\"text-2xl font-bold\">\n              {seatMetrics?.data?.utilization_percentage?.toFixed(1) || '0'}%\n            </div>\n            <p className=\"text-xs text-muted-foreground\">\n              {seatMetrics?.data?.used_seats || 0} of {seatMetrics?.data?.total_seats || 0} seats used\n            </p>\n          </CardContent>\n        </Card>

        {/* Completion Rate */}\n        <Card>\n          <CardHeader className=\"flex flex-row items-center justify-between space-y-0 pb-2\">\n            <CardTitle className=\"text-sm font-medium\">Completion Rate</CardTitle>\n            <BookOpen className=\"h-4 w-4 text-muted-foreground\" />\n          </CardHeader>\n          <CardContent>\n            <div className=\"text-2xl font-bold\">\n              {completionMetrics?.data?.overall_completion_rate?.toFixed(1) || '0'}%\n            </div>\n            <p className=\"text-xs text-muted-foreground\">\n              {completionMetrics?.data?.active_students || 0} active students\n            </p>\n          </CardContent>\n        </Card>

        {/* Placement Rate */}\n        <Card>\n          <CardHeader className=\"flex flex-row items-center justify-between space-y-0 pb-2\">\n            <CardTitle className=\"text-sm font-medium\">Placement Rate</CardTitle>\n            <TrendingUp className=\"h-4 w-4 text-muted-foreground\" />\n          </CardHeader>\n          <CardContent>\n            <div className=\"text-2xl font-bold\">\n              {placementMetrics?.data?.placement_rate?.toFixed(1) || '0'}%\n            </div>\n            <p className=\"text-xs text-muted-foreground\">\n              {placementMetrics?.data?.hires_last_30d || 0} hires last 30 days\n            </p>\n          </CardContent>\n        </Card>

        {/* ROI */}\n        <Card>\n          <CardHeader className=\"flex flex-row items-center justify-between space-y-0 pb-2\">\n            <CardTitle className=\"text-sm font-medium\">ROI Multiplier</CardTitle>\n            <DollarSign className=\"h-4 w-4 text-muted-foreground\" />\n          </CardHeader>\n          <CardContent>\n            <div className=\"text-2xl font-bold\">\n              {roiMetrics?.data?.roi_multiplier?.toFixed(1) || '1.0'}x\n            </div>\n            <p className=\"text-xs text-muted-foreground\">\n              Avg. Readiness: {roiMetrics?.data?.avg_readiness_score?.toFixed(0) || '0'}\n            </p>\n          </CardContent>\n        </Card>\n      </div>

      {/* Main Content Tabs */}\n      <Tabs defaultValue=\"cohorts\" className=\"space-y-4\">\n        <TabsList>\n          <TabsTrigger value=\"cohorts\">Cohorts</TabsTrigger>\n          <TabsTrigger value=\"billing\">Billing</TabsTrigger>\n          <TabsTrigger value=\"analytics\">Analytics</TabsTrigger>\n          <TabsTrigger value=\"privacy\">Privacy</TabsTrigger>\n        </TabsList>\n\n        {/* Cohorts Tab */}\n        <TabsContent value=\"cohorts\" className=\"space-y-4\">\n          <div className=\"flex items-center justify-between\">\n            <h2 className=\"text-xl font-semibold\">Your Cohorts</h2>\n            <Button>\n              <Plus className=\"h-4 w-4 mr-2\" />\n              New Cohort\n            </Button>\n          </div>\n          \n          <div className=\"grid gap-4\">\n            {entitlements.map((cohort) => (\n              <Card key={cohort.cohort_id}>\n                <CardHeader>\n                  <div className=\"flex items-center justify-between\">\n                    <CardTitle className=\"text-lg\">{cohort.cohort_name}</CardTitle>\n                    <Badge variant={cohort.status === 'active' ? 'default' : 'secondary'}>\n                      {cohort.status}\n                    </Badge>\n                  </div>\n                </CardHeader>\n                <CardContent>\n                  <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4\">\n                    <div>\n                      <p className=\"text-sm text-muted-foreground\">Track</p>\n                      <p className=\"font-medium capitalize\">{cohort.track_slug}</p>\n                    </div>\n                    <div>\n                      <p className=\"text-sm text-muted-foreground\">Seats Used</p>\n                      <p className=\"font-medium\">{cohort.seats_used} / {cohort.seats_allocated}</p>\n                    </div>\n                    <div>\n                      <p className=\"text-sm text-muted-foreground\">Utilization</p>\n                      <p className=\"font-medium\">{cohort.utilization_percentage.toFixed(1)}%</p>\n                    </div>\n                    <div>\n                      <p className=\"text-sm text-muted-foreground\">Available</p>\n                      <p className=\"font-medium\">{cohort.seats_available} seats</p>\n                    </div>\n                  </div>\n                  <div className=\"mt-4 flex space-x-2\">\n                    <Button variant=\"outline\" size=\"sm\">\n                      View Details\n                    </Button>\n                    <Button variant=\"outline\" size=\"sm\">\n                      Add Students\n                    </Button>\n                  </div>\n                </CardContent>\n              </Card>\n            ))}\n          </div>\n        </TabsContent>\n\n        {/* Billing Tab */}\n        <TabsContent value=\"billing\" className=\"space-y-4\">\n          <div className=\"flex items-center justify-between\">\n            <h2 className=\"text-xl font-semibold\">Billing & Invoices</h2>\n            <Button variant=\"outline\">\n              <Download className=\"h-4 w-4 mr-2\" />\n              Download All\n            </Button>\n          </div>\n          \n          <Card>\n            <CardHeader>\n              <CardTitle>Recent Invoices</CardTitle>\n            </CardHeader>\n            <CardContent>\n              {invoices.length > 0 ? (\n                <div className=\"space-y-4\">\n                  {invoices.slice(0, 5).map((invoice) => (\n                    <div key={invoice.invoice_id} className=\"flex items-center justify-between p-4 border rounded-lg\">\n                      <div>\n                        <p className=\"font-medium\">{invoice.cohort_name}</p>\n                        <p className=\"text-sm text-muted-foreground\">{invoice.billing_month}</p>\n                      </div>\n                      <div className=\"text-right\">\n                        <p className=\"font-medium\">KES {invoice.net_amount_kes.toLocaleString()}</p>\n                        <Badge variant={invoice.payment_status === 'paid' ? 'default' : invoice.payment_status === 'overdue' ? 'destructive' : 'secondary'}>\n                          {invoice.payment_status}\n                        </Badge>\n                      </div>\n                    </div>\n                  ))}\n                </div>\n              ) : (\n                <p className=\"text-muted-foreground\">No invoices available</p>\n              )}\n            </CardContent>\n          </Card>\n        </TabsContent>\n\n        {/* Analytics Tab */}\n        <TabsContent value=\"analytics\" className=\"space-y-4\">\n          <div className=\"flex items-center justify-between\">\n            <h2 className=\"text-xl font-semibold\">Analytics & Insights</h2>\n            <Button variant=\"outline\">\n              <BarChart3 className=\"h-4 w-4 mr-2\" />\n              Advanced Analytics\n            </Button>\n          </div>\n          \n          <div className=\"grid gap-4 md:grid-cols-2\">\n            <Card>\n              <CardHeader>\n                <CardTitle>Placement Metrics</CardTitle>\n              </CardHeader>\n              <CardContent>\n                <div className=\"space-y-2\">\n                  <div className=\"flex justify-between\">\n                    <span>Total Hires:</span>\n                    <span className=\"font-medium\">{placementMetrics?.data?.total_hires || 0}</span>\n                  </div>\n                  <div className=\"flex justify-between\">\n                    <span>Avg. Salary (KES):</span>\n                    <span className=\"font-medium\">{placementMetrics?.data?.avg_salary_kes?.toLocaleString() || 'N/A'}</span>\n                  </div>\n                  <div className=\"flex justify-between\">\n                    <span>Recent Hires (30d):</span>\n                    <span className=\"font-medium\">{placementMetrics?.data?.hires_last_30d || 0}</span>\n                  </div>\n                </div>\n              </CardContent>\n            </Card>\n\n            <Card>\n              <CardHeader>\n                <CardTitle>ROI Analysis</CardTitle>\n              </CardHeader>\n              <CardContent>\n                <div className=\"space-y-2\">\n                  <div className=\"flex justify-between\">\n                    <span>ROI Multiplier:</span>\n                    <span className=\"font-medium\">{roiMetrics?.data?.roi_multiplier?.toFixed(2) || '1.00'}x</span>\n                  </div>\n                  <div className=\"flex justify-between\">\n                    <span>Avg. Readiness Score:</span>\n                    <span className=\"font-medium\">{roiMetrics?.data?.avg_readiness_score?.toFixed(0) || '0'}</span>\n                  </div>\n                  <div className=\"flex justify-between\">\n                    <span>Last Updated:</span>\n                    <span className=\"font-medium text-sm\">\n                      {roiMetrics?.last_updated ? new Date(roiMetrics.last_updated).toLocaleDateString() : 'N/A'}\n                    </span>\n                  </div>\n                </div>\n              </CardContent>\n            </Card>\n          </div>\n        </TabsContent>\n\n        {/* Privacy Tab */}\n        <TabsContent value=\"privacy\" className=\"space-y-4\">\n          <div className=\"flex items-center justify-between\">\n            <h2 className=\"text-xl font-semibold\">Privacy & Consent</h2>\n            <Button variant=\"outline\">\n              <Shield className=\"h-4 w-4 mr-2\" />\n              Consent Report\n            </Button>\n          </div>\n          \n          <Card>\n            <CardHeader>\n              <CardTitle>GDPR Compliance</CardTitle>\n            </CardHeader>\n            <CardContent>\n              <div className=\"space-y-4\">\n                <div className=\"flex items-center justify-between p-4 border rounded-lg\">\n                  <div>\n                    <p className=\"font-medium\">Employer Profile Sharing</p>\n                    <p className=\"text-sm text-muted-foreground\">Students who consent to share profiles with employers</p>\n                  </div>\n                  <Badge variant=\"default\">Active</Badge>\n                </div>\n                <div className=\"flex items-center justify-between p-4 border rounded-lg\">\n                  <div>\n                    <p className=\"font-medium\">Portfolio Public Access</p>\n                    <p className=\"text-sm text-muted-foreground\">Students with public portfolio access enabled</p>\n                  </div>\n                  <Badge variant=\"default\">Active</Badge>\n                </div>\n                <div className=\"flex items-center justify-between p-4 border rounded-lg\">\n                  <div>\n                    <p className=\"font-medium\">Placement Tracking</p>\n                    <p className=\"text-sm text-muted-foreground\">Consent for tracking placement outcomes</p>\n                  </div>\n                  <Badge variant=\"default\">Active</Badge>\n                </div>\n              </div>\n            </CardContent>\n          </Card>\n        </TabsContent>\n      </Tabs>\n    </div>\n  )\n}