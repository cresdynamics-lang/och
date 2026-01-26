'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { mentorClient } from '@/services/mentorClient'
import type { MissionSubmission } from '@/services/types/mentor'

interface MissionReviewFormProps {
  submission: MissionSubmission
  onReviewComplete: () => void
}

export function MissionReviewForm({ submission, onReviewComplete }: MissionReviewFormProps) {
  const [overallStatus, setOverallStatus] = useState<'pass' | 'fail' | 'needs_revision'>('pass')
  const [writtenFeedback, setWrittenFeedback] = useState('')
  const [comments, setComments] = useState<Array<{ comment: string; section?: string }>>([])
  const [newComment, setNewComment] = useState('')
  const [newCommentSection, setNewCommentSection] = useState('')
  const [technicalCompetencies, setTechnicalCompetencies] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [scoreBreakdown, setScoreBreakdown] = useState<Record<string, number>>({})
  const [newScoreKey, setNewScoreKey] = useState('')
  const [newScoreValue, setNewScoreValue] = useState('')
  const [recommendedMissions, setRecommendedMissions] = useState<string[]>([])
  const [newRecommendedMission, setNewRecommendedMission] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addComment = () => {
    if (!newComment.trim()) return
    setComments([...comments, { comment: newComment, section: newCommentSection || undefined }])
    setNewComment('')
    setNewCommentSection('')
  }

  const removeComment = (index: number) => {
    setComments(comments.filter((_, i) => i !== index))
  }

  const addTag = () => {
    if (!newTag.trim() || technicalCompetencies.includes(newTag)) return
    setTechnicalCompetencies([...technicalCompetencies, newTag])
    setNewTag('')
  }

  const removeTag = (tag: string) => {
    setTechnicalCompetencies(technicalCompetencies.filter(t => t !== tag))
  }

  const addScore = () => {
    if (!newScoreKey.trim() || !newScoreValue) return
    const value = parseFloat(newScoreValue)
    if (isNaN(value)) return
    setScoreBreakdown({ ...scoreBreakdown, [newScoreKey]: value })
    setNewScoreKey('')
    setNewScoreValue('')
  }

  const removeScore = (key: string) => {
    const updated = { ...scoreBreakdown }
    delete updated[key]
    setScoreBreakdown(updated)
  }

  const addRecommendedMission = () => {
    if (!newRecommendedMission.trim() || recommendedMissions.includes(newRecommendedMission)) return
    setRecommendedMissions([...recommendedMissions, newRecommendedMission])
    setNewRecommendedMission('')
  }

  const removeRecommendedMission = (mission: string) => {
    setRecommendedMissions(recommendedMissions.filter(m => m !== mission))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      await mentorClient.submitMissionReview(submission.id, {
        overall_status: overallStatus,
        feedback: writtenFeedback ? { written: writtenFeedback } : undefined,
        comments: comments.length > 0 ? comments : undefined,
        technical_competencies: technicalCompetencies.length > 0 ? technicalCompetencies : undefined,
        score_breakdown: Object.keys(scoreBreakdown).length > 0 ? scoreBreakdown : undefined,
        recommended_next_missions: recommendedMissions.length > 0 ? recommendedMissions : undefined,
      })
      onReviewComplete()
    } catch (err: any) {
      setError(err.message || 'Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Mission Review: {submission.mission_title}</h2>
        <p className="text-sm text-och-steel">
          Mentee: {submission.mentee_name} ({submission.mentee_email})
        </p>
        <p className="text-xs text-och-steel">
          Submitted: {new Date(submission.submitted_at).toLocaleString()}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-och-orange/25 border border-och-orange text-white rounded-md text-sm">
          {error}
        </div>
      )}

      {/* AI Feedback Section */}
      {(submission.status === 'in_review' || (submission as any).ai_feedback) && (submission as any).ai_feedback && (
        <div className="mb-6 p-4 bg-och-defender/10 border border-och-defender/30 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-semibold text-white">AI Feedback (Initial Review)</h3>
            <Badge variant="defender" className="text-xs">AI Reviewed</Badge>
          </div>
          <div className="text-sm text-white mb-3">
            {typeof (submission as any).ai_feedback === 'string' 
              ? (submission as any).ai_feedback 
              : ((submission as any).ai_feedback as any)?.summary || 'AI feedback available'}
          </div>
          {(submission as any).ai_feedback && typeof (submission as any).ai_feedback === 'object' && ((submission as any).ai_feedback as any).score && (
            <div className="text-xs text-och-steel">
              AI Score: {((submission as any).ai_feedback as any).score}/100
              {((submission as any).ai_feedback as any).gaps && ((submission as any).ai_feedback as any).gaps.length > 0 && (
                <div className="mt-2">
                  <span className="font-medium">Identified Gaps: </span>
                  {((submission as any).ai_feedback as any).gaps.join(', ')}
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-och-steel mt-2 italic">
            Your review should provide deeper analysis complementing this initial AI feedback.
          </p>
          </div>
        )}

      {/* Evidence Review Section */}
      <div className="mb-6 p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
        <h3 className="text-lg font-semibold text-white mb-3">Evidence Review</h3>
        <p className="text-xs text-och-steel mb-4">
          Review the evidence uploaded by the mentee. Evidence can include files, screenshots, notebook links, GitHub links, or video walk-throughs.
        </p>
        
        {/* Files */}
        {submission.submission_data?.files && submission.submission_data.files.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
              📎 Files ({submission.submission_data.files.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {submission.submission_data.files.map((file: any) => (
                <a
                  key={file.id || file.filename}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-och-midnight rounded text-xs text-och-mint hover:text-white hover:bg-och-midnight/70 transition-colors flex items-center gap-2"
                >
                  <span>📄</span>
                  <span className="truncate">{file.filename || file.name || 'File'}</span>
                  <span className="text-och-steel ml-auto">→</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* GitHub Repository */}
        {submission.submission_data?.code_repository && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
              🔗 GitHub Repository
            </h4>
            <a
              href={submission.submission_data.code_repository}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-och-midnight rounded text-sm text-och-mint hover:text-white hover:bg-och-midnight/70 transition-colors inline-flex items-center gap-2"
            >
              {submission.submission_data.code_repository}
              <span>↗</span>
            </a>
          </div>
        )}

        {/* Notebook Link */}
        {(submission.submission_data as any)?.notebook_link && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
              📓 Notebook Link
            </h4>
            <a
              href={(submission.submission_data as any).notebook_link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-och-midnight rounded text-sm text-och-mint hover:text-white hover:bg-och-midnight/70 transition-colors inline-flex items-center gap-2"
            >
              {(submission.submission_data as any).notebook_link}
              <span>↗</span>
            </a>
          </div>
        )}

        {/* Video Walk-through */}
        {(submission.submission_data as any)?.video_url && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
              🎥 Video Walk-through
            </h4>
            <a
              href={(submission.submission_data as any).video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-och-midnight rounded text-sm text-och-mint hover:text-white hover:bg-och-midnight/70 transition-colors inline-flex items-center gap-2"
            >
              {(submission.submission_data as any).video_url}
              <span>↗</span>
            </a>
          </div>
        )}

        {/* Screenshots */}
        {(submission.submission_data as any)?.screenshots && (submission.submission_data as any).screenshots.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
              📸 Screenshots ({(submission.submission_data as any).screenshots.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(submission.submission_data as any).screenshots.map((screenshot: any, idx: number) => (
                <a
                  key={idx}
                  href={screenshot.url || screenshot}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={screenshot.url || screenshot}
                    alt={`Screenshot ${idx + 1}`}
                    className="w-full h-24 object-cover rounded border border-och-steel/20 hover:border-och-mint transition-colors"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Live Demo */}
        {submission.submission_data?.live_demo_url && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
              🌐 Live Demo
            </h4>
            <a
              href={submission.submission_data.live_demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-och-midnight rounded text-sm text-och-mint hover:text-white hover:bg-och-midnight/70 transition-colors inline-flex items-center gap-2"
            >
              {submission.submission_data.live_demo_url}
              <span>↗</span>
            </a>
          </div>
        )}

        {/* Answers/Text Submission */}
        {submission.submission_data?.answers && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-white mb-2">📝 Answers/Text Submission</h4>
            <pre className="text-xs text-och-steel bg-och-midnight p-3 rounded overflow-auto max-h-40">
              {JSON.stringify(submission.submission_data.answers, null, 2)}
            </pre>
          </div>
        )}

        {!submission.submission_data?.files && 
         !submission.submission_data?.code_repository && 
         !(submission.submission_data as any)?.notebook_link && 
         !(submission.submission_data as any)?.video_url && 
         !(submission.submission_data as any)?.screenshots && 
         !submission.submission_data?.live_demo_url && 
         !submission.submission_data?.answers && (
          <div className="text-sm text-och-steel italic">No evidence provided in this submission.</div>
        )}
      </div>

      {/* Overall Status - Pass/Fail Grade */}
      <div className="mb-6 p-4 bg-och-midnight/30 rounded-lg border border-och-steel/20">
        <label className="block text-sm font-medium text-white mb-3">
          Pass/Fail Grade <span className="text-och-orange">*</span>
        </label>
        <p className="text-xs text-och-steel mb-3">
          Issue a pass/fail grade based on your deeper analysis. This complements the AI feedback and confirms skill mastery.
        </p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2 transition-colors"
            style={{
              borderColor: overallStatus === 'pass' ? '#10b981' : 'transparent',
              backgroundColor: overallStatus === 'pass' ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
            }}
          >
            <input
              type="radio"
              value="pass"
              checked={overallStatus === 'pass'}
              onChange={(e) => setOverallStatus(e.target.value as any)}
              className="text-och-mint"
            />
            <span className="text-white font-medium">✓ Pass</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2 transition-colors"
            style={{
              borderColor: overallStatus === 'fail' ? '#ef4444' : 'transparent',
              backgroundColor: overallStatus === 'fail' ? 'rgba(239, 68, 68, 0.1)' : 'transparent'
            }}
          >
            <input
              type="radio"
              value="fail"
              checked={overallStatus === 'fail'}
              onChange={(e) => setOverallStatus(e.target.value as any)}
              className="text-och-mint"
            />
            <span className="text-white font-medium">✗ Fail</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2 transition-colors"
            style={{
              borderColor: overallStatus === 'needs_revision' ? '#f59e0b' : 'transparent',
              backgroundColor: overallStatus === 'needs_revision' ? 'rgba(245, 158, 11, 0.1)' : 'transparent'
            }}
          >
            <input
              type="radio"
              value="needs_revision"
              checked={overallStatus === 'needs_revision'}
              onChange={(e) => setOverallStatus(e.target.value as any)}
              className="text-och-mint"
            />
            <span className="text-white font-medium">↻ Needs Revision</span>
          </label>
        </div>
      </div>

      {/* Written Feedback */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-2">
          Written Feedback <span className="text-och-orange">*</span>
        </label>
        <p className="text-xs text-och-steel mb-2">
          Provide deeper analysis of the submission. This should complement the AI feedback and guide the mentee's development.
        </p>
        <textarea
          value={writtenFeedback}
          onChange={(e) => setWrittenFeedback(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
          placeholder="Provide detailed feedback on the submission. Focus on deeper analysis, skill mastery confirmation, and guidance for improvement..."
        />
        <p className="text-xs text-och-steel mt-1">
          Note: Audio feedback support may be available in future updates.
        </p>
      </div>

      {/* Comments */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-2">Comments</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newCommentSection}
            onChange={(e) => setNewCommentSection(e.target.value)}
            placeholder="Section (optional)"
            className="flex-1 px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
          />
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
            onKeyPress={(e) => e.key === 'Enter' && addComment()}
          />
          <Button variant="outline" size="sm" onClick={addComment}>Add</Button>
        </div>
        <div className="space-y-2">
          {comments.map((comment, index) => (
            <div key={index} className="p-2 bg-och-midnight/50 rounded flex justify-between items-start">
              <div className="flex-1">
                {comment.section && (
                  <span className="text-xs text-och-steel font-medium">{comment.section}: </span>
                )}
                <span className="text-sm text-white">{comment.comment}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => removeComment(index)}>Remove</Button>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Competencies - Skill Tagging */}
      <div className="mb-6 p-4 bg-och-midnight/30 rounded-lg border border-och-steel/20">
        <label className="block text-sm font-medium text-white mb-2">
          Technical Competencies (Skill Tagging) <span className="text-och-orange">*</span>
        </label>
        <p className="text-xs text-och-steel mb-3">
          Tag specific technical competencies proven or missed by this submission. This updates the mentee's skill profile 
          and is used by the TalentScope Analytics Engine.
        </p>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="e.g., SIEM, Alerting, Incident Response, Python, Network Security..."
            className="flex-1 px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
          />
          <Button variant="outline" size="sm" onClick={addTag}>Add Tag</Button>
        </div>
        {technicalCompetencies.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
          {technicalCompetencies.map((tag) => (
              <span key={tag} className="px-3 py-1.5 bg-och-defender/30 text-och-mint rounded text-xs flex items-center gap-2 border border-och-defender/40">
                <span className="font-medium">✓</span>
              {tag}
                <button 
                  onClick={() => removeTag(tag)} 
                  className="text-och-steel hover:text-white ml-1"
                  title="Remove tag"
                >
                  ×
                </button>
            </span>
          ))}
        </div>
        )}
        {technicalCompetencies.length === 0 && (
          <p className="text-xs text-och-steel italic mt-2">No competencies tagged yet. Add tags to track skill mastery.</p>
        )}
      </div>

      {/* Score Breakdown - Rubric-Based Scoring */}
      <div className="mb-6 p-4 bg-och-midnight/30 rounded-lg border border-och-steel/20">
        <label className="block text-sm font-medium text-white mb-2">
          Score Breakdown {((submission as any).mission_difficulty === 'capstone' || (submission as any).mission_difficulty === 'advanced') ? (
            <span className="text-och-orange">* (Rubric Required)</span>
          ) : ''}
        </label>
        <p className="text-xs text-och-steel mb-3">
          {((submission as any).mission_difficulty === 'capstone' || (submission as any).mission_difficulty === 'advanced')
            ? 'For Capstone projects and Advanced/Mastery missions, you must use the assigned rubrics. Rubrics define criteria, levels, and weights for evaluation.'
            : 'Add detailed scoring breakdown by category. This is especially important for Capstones and Advanced missions with rubrics.'}
        </p>
        {(submission as any).rubric_id && (
          <div className="mb-3 p-2 bg-och-defender/20 border border-och-defender/40 rounded text-xs text-och-mint">
            ✓ Rubric assigned: {(submission as any).rubric_id}. Use rubric criteria for scoring.
          </div>
        )}
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newScoreKey}
            onChange={(e) => setNewScoreKey(e.target.value)}
            placeholder="e.g., Technical Quality, Problem Solving, Documentation..."
            className="flex-1 px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
          />
          <input
            type="number"
            min="0"
            max="100"
            value={newScoreValue}
            onChange={(e) => setNewScoreValue(e.target.value)}
            placeholder="Score (0-100)"
            className="w-24 px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
            onKeyPress={(e) => e.key === 'Enter' && addScore()}
          />
          <Button variant="outline" size="sm" onClick={addScore}>Add</Button>
        </div>
        {Object.keys(scoreBreakdown).length > 0 && (
          <div className="space-y-2 mt-3">
          {Object.entries(scoreBreakdown).map(([key, value]) => (
              <div key={key} className="p-3 bg-och-midnight/50 rounded flex justify-between items-center border border-och-steel/20">
                <div>
                  <span className="text-sm text-white font-medium">{key}</span>
                  <span className="text-sm text-och-mint ml-2">{value}/100</span>
                </div>
              <Button variant="outline" size="sm" onClick={() => removeScore(key)}>Remove</Button>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Recommended Next Missions and Recipes */}
      <div className="mb-6 p-4 bg-och-midnight/30 rounded-lg border border-och-steel/20">
        <label className="block text-sm font-medium text-white mb-2">
          Next Steps: Recommended Missions & Recipes
        </label>
        <p className="text-xs text-och-steel mb-3">
          Recommend next missions or suggested actions based on your review. If you detect a specific skill gap, 
          recommend recipes (micro-skill units) to bridge the technical challenge.
        </p>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newRecommendedMission}
            onChange={(e) => setNewRecommendedMission(e.target.value)}
            placeholder="Mission ID, title, or recipe name..."
            className="flex-1 px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
            onKeyPress={(e) => e.key === 'Enter' && addRecommendedMission()}
          />
          <Button variant="outline" size="sm" onClick={addRecommendedMission}>Add</Button>
        </div>
        {recommendedMissions.length > 0 && (
          <div className="space-y-2 mt-3">
          {recommendedMissions.map((mission) => (
              <div key={mission} className="p-2 bg-och-midnight/50 rounded flex justify-between items-center border border-och-steel/20">
                <span className="text-sm text-white">→ {mission}</span>
              <Button variant="outline" size="sm" onClick={() => removeRecommendedMission(mission)}>Remove</Button>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* Portfolio Integration Notice */}
      <div className="mb-6 p-3 bg-och-mint/10 border border-och-mint/30 rounded-lg">
        <div className="flex items-start gap-2">
          <span className="text-och-mint text-lg">ℹ️</span>
          <div className="flex-1">
            <p className="text-xs text-white font-medium mb-1">Portfolio Integration</p>
            <p className="text-xs text-och-steel">
              Upon approval, this mission report or artifact will be automatically converted into a verifiable Portfolio Item 
              and published to the learner's portfolio, where the scoring will be recorded.
            </p>
          </div>
        </div>
      </div>

      {/* Audit Trail Notice */}
      <div className="mb-6 p-3 bg-och-steel/10 border border-och-steel/30 rounded-lg">
        <div className="flex items-start gap-2">
          <span className="text-och-steel text-lg">📋</span>
          <div className="flex-1">
            <p className="text-xs text-white font-medium mb-1">Activity Audit Trail</p>
            <p className="text-xs text-och-steel">
              All your mentor actions—including mission scoring, feedback, and competency tagging—are logged in the 
              immutable Activity Audit Trail for compliance and accountability.
            </p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onReviewComplete}>Cancel</Button>
        <Button variant="defender" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </Card>
  )
}


