'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare
} from 'lucide-react'
import { sponsorClient, type CohortReports } from '@/services/sponsorClient'

interface CohortManagementProps {
  sponsorSlug: string
}

interface CohortData {
  cohort_id: string
  name: string
  track_slug: string
  target_size: number
  students_enrolled: number
  completion_rate: number
  start_date: string | null
  expected_graduation_date: string | null
  budget_allocated: number
  placement_goal: number
  status: 'draft' | 'active' | 'graduated' | 'archived'
}

export default function CohortManagement({ sponsorSlug }: CohortManagementProps) {
  const [cohorts, setCohorts] = useState<CohortData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null)
  const [cohortReports, setCohortReports] = useState<Record<string, CohortReports>>({})

  // Form states
  const [newCohort, setNewCohort] = useState({
    name: '',
    track_slug: 'defender',
    target_size: 50,
    start_date: '',
    expected_graduation_date: '',
    budget_allocated: 2500000,
    placement_goal: 40
  })

  const [enrollmentData, setEnrollmentData] = useState({
    student_emails: ''
  })

  const trackOptions = [
    { value: 'defender', label: 'Defender Track' },
    { value: 'grc', label: 'GRC Track' },
    { value: 'innovation', label: 'Innovation Track' },
    { value: 'leadership', label: 'Leadership Track' },
    { value: 'offensive', label: 'Offensive Track' }
  ]

  useEffect(() => {
    loadCohorts()
  }, [sponsorSlug])

  const loadCohorts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get entitlements which contain cohort information
      const entitlementsData = await sponsorClient.getEntitlements()
      
      // Transform entitlements to cohort format
      const cohortsData: CohortData[] = entitlementsData.entitlements.map(ent => ({
        cohort_id: ent.cohort_id,
        name: ent.cohort_name,
        track_slug: ent.track_slug,
        target_size: ent.seats_allocated,
        students_enrolled: ent.seats_used,
        completion_rate: 0, // Would need to be calculated
        start_date: null,
        expected_graduation_date: null,
        budget_allocated: 0,
        placement_goal: 0,
        status: ent.status as any || 'active'
      }))
      
      setCohorts(cohortsData)

      // Load reports for each cohort
      const reports: Record<string, CohortReports> = {}
      for (const cohort of cohortsData) {
        try {
          const report = await sponsorClient.getCohortReports(cohort.cohort_id)
          reports[cohort.cohort_id] = report
        } catch (err) {
          console.warn(`Failed to load report for cohort ${cohort.cohort_id}:`, err)
        }
      }
      setCohortReports(reports)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cohorts')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCohort = async () => {
    try {
      const result = await sponsorClient.createCohort({
        ...newCohort,
        sponsor_slug: sponsorSlug
      })
      
      console.log('Cohort created:', result)
      setShowCreateModal(false)
      setNewCohort({
        name: '',
        track_slug: 'defender',
        target_size: 50,
        start_date: '',
        expected_graduation_date: '',
        budget_allocated: 2500000,
        placement_goal: 40
      })
      
      // Reload cohorts
      await loadCohorts()
      
    } catch (err) {
      console.error('Failed to create cohort:', err)
      alert('Failed to create cohort. Please try again.')
    }
  }

  const handleEnrollStudents = async () => {
    if (!selectedCohort) return

    try {
      const emails = enrollmentData.student_emails
        .split('\n')
        .map(email => email.trim())
        .filter(email => email.length > 0)

      const result = await sponsorClient.enrollStudents(selectedCohort, {
        student_emails: emails
      })
      
      console.log('Students enrolled:', result)
      setShowEnrollModal(false)
      setEnrollmentData({ student_emails: '' })
      setSelectedCohort(null)
      
      // Reload cohorts
      await loadCohorts()
      
    } catch (err) {
      console.error('Failed to enroll students:', err)
      alert('Failed to enroll students. Please try again.')
    }
  }

  const handleSendMessage = async (cohortId: string) => {
    try {
      const result = await sponsorClient.sendMessage({
        recipient_type: 'cohort',
        cohort_id: cohortId,
        subject: 'Message from Sponsor',
        message: 'This is a test message to the cohort students.'
      })
      
      console.log('Message sent:', result)
      alert(`Message sent to ${result.recipients_count} students`)
      
    } catch (err) {
      console.error('Failed to send message:', err)
      alert('Failed to send message. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'draft': return 'secondary'
      case 'graduated': return 'outline'
      case 'archived': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'draft': return <Clock className="h-4 w-4" />
      case 'graduated': return <TrendingUp className="h-4 w-4" />
      case 'archived': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
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
              <span>Error: {error}</span>
            </div>
            <Button onClick={loadCohorts} className="mt-4 w-full">
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
          <h1 className="text-3xl font-bold tracking-tight">Cohort Management</h1>
          <p className="text-muted-foreground">
            Manage your sponsored training cohorts and student enrollments
          </p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Cohort
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Cohort</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Cohort Name</Label>
                  <Input
                    id="name"
                    value={newCohort.name}
                    onChange={(e) => setNewCohort({...newCohort, name: e.target.value})}
                    placeholder="e.g., Cybersecurity Bootcamp 2024"
                  />
                </div>
                <div>
                  <Label htmlFor="track">Track</Label>
                  <Select value={newCohort.track_slug} onValueChange={(value) => setNewCohort({...newCohort, track_slug: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {trackOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target_size">Target Size</Label>
                  <Input
                    id="target_size"
                    type="number"
                    value={newCohort.target_size}
                    onChange={(e) => setNewCohort({...newCohort, target_size: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="placement_goal">Placement Goal</Label>
                  <Input
                    id="placement_goal"
                    type="number"
                    value={newCohort.placement_goal}
                    onChange={(e) => setNewCohort({...newCohort, placement_goal: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newCohort.start_date}
                    onChange={(e) => setNewCohort({...newCohort, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">Expected Graduation</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={newCohort.expected_graduation_date}
                    onChange={(e) => setNewCohort({...newCohort, expected_graduation_date: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="budget">Budget Allocated (KES)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={newCohort.budget_allocated}
                  onChange={(e) => setNewCohort({...newCohort, budget_allocated: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCohort}>
                Create Cohort
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cohorts Grid */}
      <div className="grid gap-6">
        {cohorts.map((cohort) => {
          const report = cohortReports[cohort.cohort_id]
          
          return (
            <Card key={cohort.cohort_id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <CardTitle className="text-xl">{cohort.name}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">
                        {cohort.track_slug} Track
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusColor(cohort.status)} className="flex items-center space-x-1">
                      {getStatusIcon(cohort.status)}
                      <span className="capitalize">{cohort.status}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div className="flex items-center space-x-3">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Enrollment</p>
                      <p className="text-lg font-semibold">
                        {cohort.students_enrolled} / {cohort.target_size}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Completion</p>
                      <p className="text-lg font-semibold">
                        {report?.completion_metrics?.completion_rate?.toFixed(1) || '0'}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-8 w-8 text-yellow-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="text-lg font-semibold">
                        KES {(cohort.budget_allocated / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Target className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Placement Goal</p>
                      <p className="text-lg font-semibold">{cohort.placement_goal}</p>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                {report && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium mb-2">Financial Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Cost</p>
                        <p className="font-medium">KES {report.financial_summary.total_cost_kes.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Revenue Share</p>
                        <p className="font-medium text-green-600">KES {report.financial_summary.total_revenue_kes.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Net Cost</p>
                        <p className="font-medium">KES {report.financial_summary.net_cost_kes.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Budget Used</p>
                        <p className="font-medium">{report.financial_summary.budget_utilization_pct.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Dialog open={showEnrollModal && selectedCohort === cohort.cohort_id} onOpenChange={(open) => {
                    setShowEnrollModal(open)
                    if (!open) setSelectedCohort(null)
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedCohort(cohort.cohort_id)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Add Students
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Enroll Students in {cohort.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="emails">Student Email Addresses</Label>
                          <Textarea
                            id="emails"
                            placeholder="Enter email addresses, one per line"
                            value={enrollmentData.student_emails}
                            onChange={(e) => setEnrollmentData({student_emails: e.target.value})}
                            rows={6}
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Enter one email address per line
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => {
                          setShowEnrollModal(false)
                          setSelectedCohort(null)
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={handleEnrollStudents}>
                          Enroll Students
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSendMessage(cohort.cohort_id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Schedule
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {cohorts.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Cohorts Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first sponsored cohort to get started
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Cohort
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
