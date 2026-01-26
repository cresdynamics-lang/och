'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { X, Plus } from 'lucide-react'
import type { GroupMentorshipSession } from '@/services/types/mentor'

interface SessionNotesEditorProps {
  session: GroupMentorshipSession
  onSave: (notes: GroupMentorshipSession['structured_notes']) => Promise<void>
  onCancel: () => void
  isLocked?: boolean
}

export function SessionNotesEditor({
  session,
  onSave,
  onCancel,
  isLocked = false
}: SessionNotesEditorProps) {
  const [notes, setNotes] = useState<GroupMentorshipSession['structured_notes']>({
    key_takeaways: [],
    action_items: [],
    discussion_points: '',
    challenges: '',
    wins: '',
    next_steps: '',
    mentor_reflections: '',
    linked_goals: [],
    attached_files: [],
    ...session.structured_notes
  })

  const [takeawayInput, setTakeawayInput] = useState('')
  const [actionItemInput, setActionItemInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Extract mentee names from attendance for assignee dropdown
  const menteeNames = session.attendance?.map(a => a.mentee_name) || []

  const handleAddTakeaway = () => {
    if (takeawayInput.trim()) {
      setNotes(prev => ({
        ...prev,
        key_takeaways: [...(prev?.key_takeaways || []), takeawayInput.trim()]
      }))
      setTakeawayInput('')
    }
  }

  const handleRemoveTakeaway = (index: number) => {
    setNotes(prev => ({
      ...prev,
      key_takeaways: (prev?.key_takeaways || []).filter((_, i) => i !== index)
    }))
  }

  const handleAddActionItem = () => {
    if (actionItemInput.trim()) {
      setNotes(prev => ({
        ...prev,
        action_items: [
          ...(prev?.action_items || []),
          {
            item: actionItemInput.trim(),
            assignee: undefined
          }
        ]
      }))
      setActionItemInput('')
    }
  }

  const handleRemoveActionItem = (index: number) => {
    setNotes(prev => ({
      ...prev,
      action_items: (prev?.action_items || []).filter((_, i) => i !== index)
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Ensure all fields are properly formatted
      const notesToSave: GroupMentorshipSession['structured_notes'] = {
        key_takeaways: notes?.key_takeaways || [],
        action_items: notes?.action_items || [],
        discussion_points: notes?.discussion_points || '',
        challenges: notes?.challenges || '',
        wins: notes?.wins || '',
        next_steps: notes?.next_steps || '',
        mentor_reflections: notes?.mentor_reflections || '',
        linked_goals: notes?.linked_goals || [],
        attached_files: notes?.attached_files || []
      }
      
      console.log('[SessionNotesEditor] Saving notes:', notesToSave)
      await onSave(notesToSave)
      console.log('[SessionNotesEditor] Notes saved successfully')
    } catch (err) {
      console.error('[SessionNotesEditor] Failed to save notes:', err)
      alert('Failed to save notes. Please try again.')
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  if (isLocked) {
    return (
      <Card className="border-och-steel/20">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Session Notes</h3>
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="w-3 h-3" />
            </Button>
          </div>
          <p className="text-xs text-och-steel">
            This session has been closed. Notes are locked and cannot be edited.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="border-och-mint/30">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Session Notes & Record-Keeping</h3>
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="w-3 h-3" />
          </Button>
        </div>

        {/* Key Takeaways */}
        <div>
          <label className="block text-xs font-medium text-white mb-2">
            Key Takeaways
          </label>
          <div className="space-y-2">
            {notes?.key_takeaways?.map((takeaway, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-och-midnight rounded border border-och-steel/20">
                <span className="flex-1 text-xs text-white">{takeaway}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveTakeaway(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={takeawayInput}
                onChange={(e) => setTakeawayInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTakeaway()}
                placeholder="Add a key takeaway..."
                className="flex-1 px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-xs focus:outline-none focus:ring-2 focus:ring-och-mint"
              />
              <Button variant="outline" size="sm" onClick={handleAddTakeaway}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div>
          <label className="block text-xs font-medium text-white mb-2">
            Action Items
          </label>
          <div className="space-y-2">
            {notes?.action_items?.map((item, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-och-midnight rounded border border-och-steel/20">
                <span className="flex-1 text-xs text-white">
                  {typeof item === 'string' ? item : item.item}
                  {typeof item === 'object' && item.assignee && (
                    <span className="text-och-gold ml-2">→ {item.assignee}</span>
                  )}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveActionItem(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={actionItemInput}
                onChange={(e) => setActionItemInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddActionItem()}
                placeholder="Add an action item..."
                className="flex-1 px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-xs focus:outline-none focus:ring-2 focus:ring-och-mint"
              />
              <Button variant="outline" size="sm" onClick={handleAddActionItem}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Discussion Points */}
        <div>
          <label className="block text-xs font-medium text-white mb-2">
            Discussion Points / Recap
          </label>
          <textarea
            value={notes?.discussion_points || ''}
            onChange={(e) => setNotes(prev => ({ ...prev, discussion_points: e.target.value }))}
            placeholder="Summarize the main discussion points, recap what was covered..."
            rows={4}
            className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-xs focus:outline-none focus:ring-2 focus:ring-och-mint resize-none"
          />
        </div>

        {/* Challenges & Wins */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-white mb-2">
              Challenges Identified
            </label>
            <textarea
              value={notes?.challenges || ''}
              onChange={(e) => setNotes(prev => ({ ...prev, challenges: e.target.value }))}
              placeholder="What challenges or obstacles were discussed?"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-xs focus:outline-none focus:ring-2 focus:ring-och-mint resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white mb-2">
              Wins & Achievements
            </label>
            <textarea
              value={notes?.wins || ''}
              onChange={(e) => setNotes(prev => ({ ...prev, wins: e.target.value }))}
              placeholder="What wins or achievements were celebrated?"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-xs focus:outline-none focus:ring-2 focus:ring-och-mint resize-none"
            />
          </div>
        </div>

        {/* Next Steps */}
        <div>
          <label className="block text-xs font-medium text-white mb-2">
            Next Steps / Recommended Actions
          </label>
          <textarea
            value={notes?.next_steps || ''}
            onChange={(e) => setNotes(prev => ({ ...prev, next_steps: e.target.value }))}
            placeholder="What are the recommended next steps or actions?"
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-xs focus:outline-none focus:ring-2 focus:ring-och-mint resize-none"
          />
        </div>

        {/* Mentor Reflections */}
        <div>
          <label className="block text-xs font-medium text-white mb-2">
            Mentor Reflections
          </label>
          <textarea
            value={notes?.mentor_reflections || ''}
            onChange={(e) => setNotes(prev => ({ ...prev, mentor_reflections: e.target.value }))}
            placeholder="Your personal reflections on the session, mentee progress, areas for improvement..."
            rows={4}
            className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-xs focus:outline-none focus:ring-2 focus:ring-och-mint resize-none"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-2 pt-4 border-t border-och-steel/20">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="defender" size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Notes'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

