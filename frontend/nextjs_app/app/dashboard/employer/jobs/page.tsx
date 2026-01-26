'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { marketplaceClient, type JobPosting } from '@/services/marketplaceClient'
import { Plus, Edit, Trash2, Calendar, MapPin, DollarSign } from 'lucide-react'

export default function JobPostingsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await marketplaceClient.getJobPostings()
      // Handle both array and paginated response
      if (Array.isArray(data)) {
        setJobs(data)
      } else if (data && 'results' in data && Array.isArray(data.results)) {
        setJobs(data.results)
      } else {
        setJobs([])
      }
    } catch (err: any) {
      console.error('Failed to load jobs:', err)
      setError(err.message || 'Failed to load job postings')
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
                    <button
                      key={skill}
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="cursor-pointer"
                    >
                      <Badge variant="gold">
                        {skill} ×
                      </Badge>
                    </button>
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
        ) : jobs.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-och-steel">
              No job postings yet. Create your first posting to get started.
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
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
      </div>
    </div>
  )
}

