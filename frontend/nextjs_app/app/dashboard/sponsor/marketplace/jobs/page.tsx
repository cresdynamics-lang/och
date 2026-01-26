'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { marketplaceClient, type JobPosting, type JobApplication } from '@/services/marketplaceClient'
import { Plus, Edit, Trash2, Calendar, MapPin, DollarSign, Users, MessageSquare, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function JobPostingsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Ensure jobs is always an array
  const safeJobs = Array.isArray(jobs) ? jobs : []
  const [showForm, setShowForm] = useState(false)
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    job_type: 'full_time' as 'full_time' | 'part_time' | 'contract' | 'internship',
    required_skills: [] as string[],
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    application_deadline: '',
  })
  const [skillInput, setSkillInput] = useState('')
  
  // Applications state
  const [selectedJobForApplications, setSelectedJobForApplications] = useState<JobPosting | null>(null)
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [showApplicationsModal, setShowApplicationsModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null)
  const [showApplicationDetailModal, setShowApplicationDetailModal] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [applicationNotes, setApplicationNotes] = useState('')

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await marketplaceClient.getJobPostings()
      console.log('Jobs API response:', data)
      // Ensure data is an array
      if (Array.isArray(data)) {
        setJobs(data)
      } else if (data && Array.isArray(data.results)) {
        // Handle paginated response
        setJobs(data.results)
      } else if (data && typeof data === 'object') {
        // Handle object response - try to extract array
        const jobsArray = Object.values(data).find((val: any) => Array.isArray(val)) as JobPosting[] | undefined
        setJobs(jobsArray || [])
      } else {
        setJobs([])
      }
    } catch (err: any) {
      console.error('Failed to load jobs:', err)
      setError(err.message || 'Failed to load job postings')
      setJobs([]) // Ensure jobs is always an array
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        job_type: formData.job_type,
        required_skills: formData.required_skills,
      }
      if (formData.location) payload.location = formData.location
      if (formData.salary_min) payload.salary_min = parseFloat(formData.salary_min)
      if (formData.salary_max) payload.salary_max = parseFloat(formData.salary_max)
      if (formData.salary_currency) payload.salary_currency = formData.salary_currency
      if (formData.application_deadline) payload.application_deadline = formData.application_deadline

      if (editingJob) {
        await marketplaceClient.updateJobPosting(editingJob.id, payload)
      } else {
        await marketplaceClient.createJobPosting(payload)
      }

      setShowForm(false)
      setEditingJob(null)
      resetForm()
      loadJobs()
    } catch (err: any) {
      console.error('Failed to save job:', err)
      alert(err.message || 'Failed to save job posting')
    }
  }

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return
    try {
      await marketplaceClient.deleteJobPosting(jobId)
      loadJobs()
    } catch (err: any) {
      console.error('Failed to delete job:', err)
      alert(err.message || 'Failed to delete job posting')
    }
  }

  const handleEdit = (job: JobPosting) => {
    setEditingJob(job)
    setFormData({
      title: job.title,
      description: job.description,
      location: job.location || '',
      job_type: job.job_type,
      required_skills: job.required_skills || [],
      salary_min: job.salary_min?.toString() || '',
      salary_max: job.salary_max?.toString() || '',
      salary_currency: job.salary_currency || 'USD',
      application_deadline: job.application_deadline || '',
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      job_type: 'full_time',
      required_skills: [],
      salary_min: '',
      salary_max: '',
      salary_currency: 'USD',
      application_deadline: '',
    })
    setSkillInput('')
  }

  const addSkill = () => {
    if (skillInput.trim() && !formData.required_skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        required_skills: [...prev.required_skills, skillInput.trim()],
      }))
      setSkillInput('')
    }
  }

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills.filter(s => s !== skill),
    }))
  }

  const loadJobApplications = async (jobId: string) => {
    try {
      setApplicationsLoading(true)
      console.log('Loading applications for job:', jobId)
      const apps = await marketplaceClient.getJobApplications(jobId)
      console.log('Applications API response:', apps)
      // Handle both array and paginated response
      let applicationsList: JobApplication[] = []
      if (Array.isArray(apps)) {
        applicationsList = apps
      } else if (apps && 'results' in apps && Array.isArray(apps.results)) {
        applicationsList = apps.results
      }
      console.log('Processed applications:', applicationsList)
      setApplications(applicationsList)
    } catch (err: any) {
      console.error('Failed to load applications:', err)
      alert(`Failed to load applications: ${err.message || 'Unknown error'}`)
      setApplications([])
    } finally {
      setApplicationsLoading(false)
    }
  }


  const handleViewApplications = async (job: JobPosting) => {
    setSelectedJobForApplications(job)
    setShowApplicationsModal(true)
    // Load applications immediately when opening modal
    await loadJobApplications(job.id)
  }

  const handleUpdateStatus = async (applicationId: string, newStatus: JobApplication['status']) => {
    try {
      setUpdatingStatus(true)
      await marketplaceClient.updateApplicationStatus(applicationId, newStatus)
      await loadJobApplications(selectedJobForApplications!.id)
      setShowApplicationDetailModal(false)
      alert('Application status updated successfully')
    } catch (err: any) {
      console.error('Failed to update status:', err)
      alert(err.message || 'Failed to update application status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleUpdateApplication = async (applicationId: string) => {
    try {
      setUpdatingStatus(true)
      await marketplaceClient.updateApplication(applicationId, {
        notes: applicationNotes,
      })
      await loadJobApplications(selectedJobForApplications!.id)
      setShowApplicationDetailModal(false)
      setApplicationNotes('')
      alert('Application updated successfully')
    } catch (err: any) {
      console.error('Failed to update application:', err)
      alert(err.message || 'Failed to update application')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleViewApplicationDetail = async (application: JobApplication) => {
    try {
      const detail = await marketplaceClient.getApplicationDetailsEmployer(application.id)
      setSelectedApplication(detail)
      setApplicationNotes(detail.notes || '')
      setShowApplicationDetailModal(true)
    } catch (err: any) {
      console.error('Failed to load application details:', err)
      alert(err.message || 'Failed to load application details')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'mint' | 'gold' | 'steel' | 'defender'> = {
      pending: 'steel',
      reviewing: 'gold',
      shortlisted: 'mint',
      interview: 'defender',
      accepted: 'mint',
      rejected: 'steel',
      withdrawn: 'steel',
    }
    return colors[status] || 'steel'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'reviewing': return <Loader2 className="w-4 h-4 animate-spin" />
      case 'shortlisted': return <CheckCircle className="w-4 h-4" />
      case 'interview': return <MessageSquare className="w-4 h-4" />
      case 'accepted': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-gold">Job Postings</h1>
            <p className="text-och-steel">Manage your job postings and assignments.</p>
          </div>
          <Button
            variant="gold"
            onClick={() => {
              resetForm()
              setEditingJob(null)
              setShowForm(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
        </div>


        {/* Form */}
        {showForm && (
          <Card className="mb-6 p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              {editingJob ? 'Edit Job Posting' : 'Create Job Posting'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-och-steel mb-2 block">Job Title *</label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-och-midnight/50 border-och-defender/20"
                  />
                </div>
                <div>
                  <label className="text-sm text-och-steel mb-2 block">Job Type *</label>
                  <select
                    required
                    value={formData.job_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, job_type: e.target.value as any }))}
                    className="w-full bg-och-midnight/50 border border-och-defender/20 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-och-steel mb-2 block">Description *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={6}
                  className="w-full bg-och-midnight/50 border border-och-defender/20 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-och-steel mb-2 block">Location</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="bg-och-midnight/50 border-och-defender/20"
                  />
                </div>
                <div>
                  <label className="text-sm text-och-steel mb-2 block">Application Deadline</label>
                  <Input
                    type="date"
                    value={formData.application_deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, application_deadline: e.target.value }))}
                    className="bg-och-midnight/50 border-och-defender/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-och-steel mb-2 block">Min Salary</label>
                  <Input
                    type="number"
                    value={formData.salary_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary_min: e.target.value }))}
                    className="bg-och-midnight/50 border-och-defender/20"
                  />
                </div>
                <div>
                  <label className="text-sm text-och-steel mb-2 block">Max Salary</label>
                  <Input
                    type="number"
                    value={formData.salary_max}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary_max: e.target.value }))}
                    className="bg-och-midnight/50 border-och-defender/20"
                  />
                </div>
                <div>
                  <label className="text-sm text-och-steel mb-2 block">Currency</label>
                  <Input
                    value={formData.salary_currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary_currency: e.target.value }))}
                    className="bg-och-midnight/50 border-och-defender/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-och-steel mb-2 block">Required Skills *</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="Add a skill and press Enter"
                    className="bg-och-midnight/50 border-och-defender/20"
                  />
                  <Button type="button" onClick={addSkill} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.required_skills.map((skill) => (
                    <div
                      key={skill}
                      className="bg-och-gold/20 border border-och-gold/50 text-white px-3 py-1 rounded cursor-pointer hover:bg-och-gold/30 transition-colors"
                      onClick={() => removeSkill(skill)}
                    >
                      {skill} ×
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" variant="gold">
                  {editingJob ? 'Update' : 'Create'} Job Posting
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false)
                  setEditingJob(null)
                  resetForm()
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Job List */}
        {loading ? (
          <Card className="p-8">
            <div className="text-center text-och-steel">Loading job postings...</div>
          </Card>
        ) : error ? (
          <Card className="p-8">
            <div className="text-center text-red-400">{error}</div>
          </Card>
        ) : safeJobs.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-och-steel">
              No job postings yet. Create your first posting to get started.
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {safeJobs.map((job) => (
              <Card key={job.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-white">{job.title}</h3>
                      <Badge variant={job.is_active ? 'mint' : 'steel'}>
                        {job.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-och-steel mb-4">{job.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-och-steel">
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {job.job_type.replace('_', ' ').toUpperCase()}
                      </div>
                      {(job.salary_min || job.salary_max) && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {job.salary_min && job.salary_max
                            ? `${job.salary_min} - ${job.salary_max} ${job.salary_currency}`
                            : job.salary_min
                            ? `${job.salary_min}+ ${job.salary_currency}`
                            : `Up to ${job.salary_max} ${job.salary_currency}`}
                        </div>
                      )}
                      {job.application_deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      onClick={() => handleViewApplications(job)}
                      title="View Applications"
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Applications
                    </Button>
                    <Button variant="outline" onClick={() => handleEdit(job)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" onClick={() => handleDelete(job.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {job.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {job.required_skills.map((skill) => (
                      <Badge key={skill} variant="defender">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Applications Modal */}
        {showApplicationsModal && (
          <Dialog open={showApplicationsModal} onOpenChange={setShowApplicationsModal}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-och-midnight border-och-defender/30">
              <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-och-gold">
                Applications for {selectedJobForApplications?.title || 'Job'}
              </DialogTitle>
              </DialogHeader>
              
              {applicationsLoading ? (
                <div className="text-center py-12 text-och-steel">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  Loading applications...
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-12 text-och-steel">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No applications yet</p>
                  <p className="text-sm">Applications will appear here when students apply to this job.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <Card key={app.id} className="p-6 hover:border-och-gold/50 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-white">
                              {app.applicant_name || app.applicant_email || 'Unknown Applicant'}
                            </h3>
                          </div>
                          <p className="text-sm text-och-steel mb-2">{app.applicant_email}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-och-steel">Applied:</span>
                              <p className="text-white">{new Date(app.applied_at).toLocaleDateString()}</p>
                            </div>
                            {app.match_score && (
                              <div>
                                <span className="text-och-steel">Match Score:</span>
                                <p className="text-white">{app.match_score}%</p>
                              </div>
                            )}
                            {app.status_changed_at && (
                              <div>
                                <span className="text-och-steel">Status Changed:</span>
                                <p className="text-white">{new Date(app.status_changed_at).toLocaleDateString()}</p>
                              </div>
                            )}
                          </div>
                          {app.cover_letter && (
                            <div className="mt-3 p-3 bg-och-midnight/50 rounded-lg">
                              <p className="text-xs text-och-steel mb-1">Cover Letter:</p>
                              <p className="text-sm text-white line-clamp-2">{app.cover_letter}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <Badge variant={getStatusColor(app.status) as any} className="flex items-center gap-1">
                            {getStatusIcon(app.status)}
                            {app.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewApplicationDetail(app)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}

        {/* Application Detail Modal */}
        {showApplicationDetailModal && selectedApplication && (
          <Dialog open={showApplicationDetailModal} onOpenChange={setShowApplicationDetailModal}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-och-midnight border-och-defender/30">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-och-gold">
                  Application Details
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Applicant Info */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Applicant Information</h3>
                  <div className="p-4 bg-och-midnight/50 rounded-lg space-y-2">
                    <div>
                      <span className="text-och-steel">Name:</span>
                      <p className="text-white">{selectedApplication.applicant_name || selectedApplication.applicant_email}</p>
                    </div>
                    <div>
                      <span className="text-och-steel">Email:</span>
                      <p className="text-white">{selectedApplication.applicant_email}</p>
                    </div>
                    <div>
                      <span className="text-och-steel">Applied:</span>
                      <p className="text-white">{new Date(selectedApplication.applied_at).toLocaleDateString()}</p>
                    </div>
                    {selectedApplication.match_score && (
                      <div>
                        <span className="text-och-steel">Match Score:</span>
                        <p className="text-white">{selectedApplication.match_score}%</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Job Info */}
                {selectedApplication.job_posting && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3">Job Information</h3>
                    <div className="p-4 bg-och-midnight/50 rounded-lg">
                      <p className="text-white font-semibold">{selectedApplication.job_posting.title}</p>
                      <p className="text-och-steel text-sm">{selectedApplication.job_posting.location || 'Remote'}</p>
                    </div>
                  </div>
                )}

                {/* Cover Letter */}
                {selectedApplication.cover_letter && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3">Cover Letter</h3>
                    <div className="p-4 bg-och-midnight/50 rounded-lg">
                      <p className="text-white whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                    </div>
                  </div>
                )}

                {/* Status Management */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Status Management</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-och-steel mb-2 block">Current Status</label>
                      <Badge variant={getStatusColor(selectedApplication.status) as any} className="text-lg">
                        {selectedApplication.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div>
                      <label className="text-sm text-och-steel mb-2 block">Update Status</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {['pending', 'reviewing', 'shortlisted', 'interview', 'accepted', 'rejected'].map((status) => (
                          <Button
                            key={status}
                            variant={selectedApplication.status === status ? 'gold' : 'outline'}
                            size="sm"
                            onClick={() => handleUpdateStatus(selectedApplication.id, status as JobApplication['status'])}
                            disabled={updatingStatus || selectedApplication.status === status}
                            className="text-xs"
                          >
                            {status.replace('_', ' ').toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-och-steel mb-2 block">Internal Notes</label>
                      <textarea
                        value={applicationNotes}
                        onChange={(e) => setApplicationNotes(e.target.value)}
                        rows={4}
                        className="w-full bg-och-midnight/50 border border-och-defender/30 rounded-lg px-4 py-2 text-white"
                        placeholder="Add internal notes about this applicant..."
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => handleUpdateApplication(selectedApplication.id)}
                        disabled={updatingStatus}
                      >
                        {updatingStatus ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Save Notes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}

