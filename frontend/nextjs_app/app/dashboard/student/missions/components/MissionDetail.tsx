'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DifficultyChip } from './DifficultyChip'
import { CompetencyTags } from './CompetencyTags'
import { ArtifactUpload } from './ArtifactUpload'
import { LinkUpload } from './LinkUpload'
import { RequirementsChecklist } from './RequirementsChecklist'
import { Countdown } from './Countdown'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { apiGateway } from '@/services/apiGateway'
import type { Mission, MissionSubmission, AIFeedback, MentorReview } from '../types'

interface MissionDetailProps {
  mission: Mission
  onClose: () => void
  onSubmitForAI: (missionId: string, submission: Partial<MissionSubmission>) => Promise<void>
  onSubmitForMentor: (submissionId: string) => Promise<void>
  onReload: () => void
}

export function MissionDetail({ mission, onClose, onSubmitForAI, onSubmitForMentor, onReload }: MissionDetailProps) {
  const [submission, setSubmission] = useState<Partial<MissionSubmission>>({
    mission_id: mission.id,
    files: [],
    file_urls: [],
    github_url: '',
    notebook_url: '',
    video_url: '',
    notes: '',
    draft: true,
  })
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(mission.ai_feedback || null)
  const [mentorReview, setMentorReview] = useState<MentorReview | null>(mission.mentor_review || null)

  useEffect(() => {
    loadMissionDetails()
    
    // Poll for status updates if mission is in review
    if (mission.status === 'in_ai_review' || mission.status === 'in_mentor_review') {
      const interval = setInterval(() => {
        loadMissionDetails()
      }, 10000) // 10 seconds for active reviews
      
      return () => clearInterval(interval)
    }
  }, [mission.id, mission.status])

  const loadMissionDetails = async () => {
    try {
      const response = await apiGateway.get<Mission>(`/missions/${mission.id}`)
      if (response.submission) {
        setSubmission(response.submission)
      }
      if (response.ai_feedback) {
        setAiFeedback(response.ai_feedback)
      }
      if (response.mentor_review) {
        setMentorReview(response.mentor_review)
      }
    } catch (error) {
      console.error('Failed to load mission details:', error)
    }
  }

  const handleFileUpload = async (files: FileList) => {
    if (!mission.submission?.id) {
      alert('Please start the mission first')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('files', file)
      })

      const response = await apiGateway.post<{ artifacts: Array<{ url: string }> }>(
        `/student/missions/submissions/${mission.submission.id}/artifacts`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      )

      setSubmission(prev => ({
        ...prev,
        file_urls: [...(prev.file_urls || []), ...response.artifacts.map(a => a.url)]
      }))
      await loadMissionDetails()
    } catch (error: any) {
      alert(error.message || 'Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      await apiGateway.post(`/student/missions/${mission.id}/draft`, {
        notes: submission.notes,
        github_url: submission.github_url,
        notebook_url: submission.notebook_url,
        video_url: submission.video_url,
      })
      alert('Draft saved')
      await loadMissionDetails()
    } catch (error: any) {
      alert(error.message || 'Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitForAI = async () => {
    if (!submission.file_urls?.length && !submission.github_url && !submission.notebook_url) {
      alert('Please upload at least one file or provide a URL before submitting')
      return
    }

    setSubmitting(true)
    try {
      await onSubmitForAI(mission.id, { ...submission, draft: false })
      await loadMissionDetails()
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitForMentor = async () => {
    if (mission.status !== 'ai_reviewed' && mission.status !== 'in_ai_review' && !aiFeedback) {
      alert('Please wait for AI review to complete before submitting for mentor review')
      return
    }

    if (!mission.submission?.id) {
      alert('Submission not found')
      return
    }

    setSubmitting(true)
    try {
      await onSubmitForMentor(mission.submission.id)
      await loadMissionDetails()
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmitForMentor = mission.status === 'in_ai_review' || (aiFeedback && mission.status !== 'approved')

  return (
    <div className="fixed inset-0 bg-och-midnight/90 z-50 overflow-y-auto">
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{mission.title}</h2>
              {mission.code && (
                <span className="text-sm text-och-steel font-mono">{mission.code}</span>
              )}
            </div>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Mission Brief */}
              <Card className="bg-och-midnight/50 border border-och-steel/20">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Mission Brief</h3>
                  <div className="space-y-4 text-och-steel">
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Description</h4>
                      <p>{mission.description}</p>
                    </div>
                    {mission.brief && (
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-2">Full Brief</h4>
                        <p>{mission.brief}</p>
                      </div>
                    )}
                    {mission.objectives && mission.objectives.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-2">Objectives</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {mission.objectives.map((obj, idx) => (
                            <li key={idx}>{obj}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {mission.competency_tags && mission.competency_tags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-2">Competencies</h4>
                        <div className="flex flex-wrap gap-2">
                          {mission.competency_tags.map((tag, idx) => (
                            <Badge key={idx} variant="defender" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Attachments & Links */}
              {(mission.attachments?.length || mission.external_links?.length) && (
                <Card className="bg-och-midnight/50 border border-och-steel/20">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Resources</h3>
                    {mission.attachments && mission.attachments.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-white mb-2">Attachments</h4>
                        <div className="space-y-2">
                          {mission.attachments.map((att) => (
                            <a
                              key={att.id}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-2 bg-och-midnight border border-och-steel/20 rounded hover:border-och-defender/40 text-och-steel hover:text-white transition"
                            >
                              {att.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {mission.external_links && mission.external_links.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-2">External Links</h4>
                        <div className="space-y-2">
                          {mission.external_links.map((link) => (
                            <a
                              key={link.id}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-2 bg-och-midnight border border-och-steel/20 rounded hover:border-och-defender/40 text-och-defender hover:text-och-mint transition"
                            >
                              {link.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Submission Area */}
              {mission.status !== 'approved' && (
                <Card className="bg-och-midnight/50 border border-och-steel/20">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Submission</h3>

                    {/* File Upload */}
                    <div className="mb-6">
                      <ArtifactUpload
                        onFilesSelected={handleFileUpload}
                        maxSize={10}
                        uploading={uploading}
                        uploadProgress={uploadProgress}
                      />
                      {submission.file_urls && submission.file_urls.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-semibold text-white">Uploaded Files:</p>
                          {submission.file_urls.map((url, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-och-midnight/50 rounded text-sm">
                              <span className="text-och-steel">{url.split('/').pop()}</span>
                              <button
                                onClick={() => setSubmission(prev => ({
                                  ...prev,
                                  file_urls: prev.file_urls?.filter((_, i) => i !== idx)
                                }))}
                                className="text-och-orange hover:text-och-orange/80 text-xs"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* URL Inputs */}
                    <div className="space-y-3 mb-6">
                      <LinkUpload
                        type="github"
                        label="GitHub Repository"
                        placeholder="https://github.com/username/repo"
                        value={submission.github_url}
                        onChange={(url) => setSubmission(prev => ({ ...prev, github_url: url }))}
                        onRemove={() => setSubmission(prev => ({ ...prev, github_url: '' }))}
                      />
                      <LinkUpload
                        type="notebook"
                        label="Jupyter/Colab Notebook"
                        placeholder="https://colab.research.google.com/..."
                        value={submission.notebook_url}
                        onChange={(url) => setSubmission(prev => ({ ...prev, notebook_url: url }))}
                        onRemove={() => setSubmission(prev => ({ ...prev, notebook_url: '' }))}
                      />
                      <LinkUpload
                        type="video"
                        label="Video Walkthrough"
                        placeholder="https://youtube.com/watch?v=..."
                        value={submission.video_url}
                        onChange={(url) => setSubmission(prev => ({ ...prev, video_url: url }))}
                        onRemove={() => setSubmission(prev => ({ ...prev, video_url: '' }))}
                      />
                    </div>

                    {/* Notes */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-white mb-2">Notes to Mentor/Reviewer</label>
                      <textarea
                        value={submission.notes || ''}
                        onChange={(e) => setSubmission(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Optional notes..."
                        rows={4}
                        className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-defender"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={handleSaveDraft}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Draft'}
                      </Button>
                      <Button
                        variant="defender"
                        onClick={handleSubmitForAI}
                        disabled={submitting || mission.status === 'in_ai_review' || mission.status === 'in_mentor_review'}
                      >
                        {submitting ? 'Submitting...' : 'Submit for AI Review'}
                      </Button>
                      {canSubmitForMentor && (
                        <Button
                          variant="orange"
                          onClick={handleSubmitForMentor}
                          disabled={submitting}
                        >
                          {submitting ? 'Submitting...' : 'Submit for Mentor Review'}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* AI Feedback */}
              {aiFeedback && (
                <Card className="bg-och-midnight/50 border border-och-defender/40">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4">AI Feedback</h3>
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl font-bold text-och-defender">{aiFeedback.score}</span>
                        <span className="text-och-steel">/ {aiFeedback.max_score}</span>
                      </div>
                    </div>
                    {aiFeedback.strengths && aiFeedback.strengths.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-white mb-2">Strengths</h4>
                        <ul className="list-disc list-inside space-y-1 text-och-steel">
                          {aiFeedback.strengths.map((strength, idx) => (
                            <li key={idx}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiFeedback.gaps && aiFeedback.gaps.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-white mb-2">Gaps</h4>
                        <ul className="list-disc list-inside space-y-1 text-och-steel">
                          {aiFeedback.gaps.map((gap, idx) => (
                            <li key={idx}>{gap}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiFeedback.full_feedback && (
                      <div className="mt-4 p-4 bg-och-midnight border border-och-steel/20 rounded">
                        <h4 className="text-sm font-semibold text-white mb-2">Full Feedback</h4>
                        <div className="space-y-3 text-sm text-och-steel">
                          <div>
                            <span className="font-medium text-white">Correctness:</span> {aiFeedback.full_feedback.correctness}
                          </div>
                          {aiFeedback.full_feedback.missed_requirements && aiFeedback.full_feedback.missed_requirements.length > 0 && (
                            <div>
                              <span className="font-medium text-white">Missed Requirements:</span>
                              <ul className="list-disc list-inside mt-1">
                                {aiFeedback.full_feedback.missed_requirements.map((req, idx) => (
                                  <li key={idx}>{req}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {aiFeedback.full_feedback.suggested_improvements && aiFeedback.full_feedback.suggested_improvements.length > 0 && (
                            <div>
                              <span className="font-medium text-white">Suggested Improvements:</span>
                              <ul className="list-disc list-inside mt-1">
                                {aiFeedback.full_feedback.suggested_improvements.map((imp, idx) => (
                                  <li key={idx}>{imp}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {mission.status !== 'approved' && (
                      <Button variant="outline" className="mt-4" onClick={() => onReload()}>
                        Revise and Resubmit
                      </Button>
                    )}
                  </div>
                </Card>
              )}

              {/* Mentor Review */}
              {mentorReview && (
                <Card className="bg-och-midnight/50 border border-och-orange/40">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Mentor Review</h3>
                    <div className="mb-4">
                      <Badge variant={
                        mentorReview.status === 'approved' ? 'mint' :
                        mentorReview.status === 'changes_requested' ? 'orange' : 'steel'
                      }>
                        {mentorReview.status === 'waiting' ? 'Waiting for Mentor' :
                         mentorReview.status === 'changes_requested' ? 'Changes Requested' :
                         mentorReview.status === 'approved' ? 'Approved' : 'Rejected'}
                      </Badge>
                    </div>
                    {mentorReview.rubric_summary && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-white mb-2">Rubric Summary</h4>
                        <div className="space-y-2 text-sm text-och-steel">
                          {mentorReview.rubric_summary.configuration !== undefined && (
                            <div>Configuration: {mentorReview.rubric_summary.configuration}/10</div>
                          )}
                          {mentorReview.rubric_summary.documentation !== undefined && (
                            <div>Documentation: {mentorReview.rubric_summary.documentation}/10</div>
                          )}
                          {mentorReview.rubric_summary.reasoning !== undefined && (
                            <div>Reasoning: {mentorReview.rubric_summary.reasoning}/10</div>
                          )}
                        </div>
                      </div>
                    )}
                    {mentorReview.decision && (
                      <div className="mb-4">
                        <Badge variant={mentorReview.decision === 'pass' ? 'mint' : 'orange'}>
                          {mentorReview.decision === 'pass' ? 'Pass' : 'Fail'}
                        </Badge>
                      </div>
                    )}
                    {mentorReview.comments && (
                      <div className="p-4 bg-och-midnight border border-och-steel/20 rounded">
                        <p className="text-sm text-och-steel">{mentorReview.comments}</p>
                        {mentorReview.reviewer_name && (
                          <p className="text-xs text-och-steel mt-2">— {mentorReview.reviewer_name}</p>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Mission Info */}
              <Card className="bg-och-midnight/50 border border-och-steel/20">
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-white mb-3">Mission Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-och-steel">Difficulty:</span>
                      <Badge variant="defender" className="ml-2">{mission.difficulty}</Badge>
                    </div>
                    {mission.estimated_time && (
                      <div>
                        <span className="text-och-steel">Time:</span>
                        <span className="text-white ml-2">{mission.estimated_time}</span>
                      </div>
                    )}
                    {mission.due_date && (
                      <div>
                        <span className="text-och-steel">Due:</span>
                        <span className="text-white ml-2">{new Date(mission.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {mission.track_name && (
                      <div>
                        <span className="text-och-steel">Track:</span>
                        <span className="text-white ml-2">{mission.track_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Portfolio & Readiness Impact */}
              {mission.readiness_impact && (
                <Card className="bg-och-midnight/50 border border-och-steel/20">
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-white mb-3">Impact</h4>
                    {mission.readiness_impact.competencies && mission.readiness_impact.competencies.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-och-steel mb-2">Competencies:</div>
                        {mission.readiness_impact.competencies.map((comp, idx) => (
                          <div key={idx} className="text-sm text-white mb-1">
                            {comp.name}: +{comp.points}
                          </div>
                        ))}
                      </div>
                    )}
                    {mission.readiness_impact.readiness_points > 0 && (
                      <div>
                        <div className="text-xs text-och-steel mb-1">Readiness:</div>
                        <div className="text-lg font-bold text-och-mint">+{mission.readiness_impact.readiness_points} points</div>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

