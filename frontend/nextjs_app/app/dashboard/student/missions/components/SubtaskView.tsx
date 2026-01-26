/**
 * Subtask View Component
 * Single subtask with evidence upload
 */
'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'
import { useMissionStore } from '@/lib/stores/missionStore'
import type { Subtask } from '../types'

interface SubtaskViewProps {
  missionId: string
  subtaskNumber: number
}

export function SubtaskView({ missionId, subtaskNumber }: SubtaskViewProps) {
  const { subtasks, subtasksProgress, updateSubtaskProgress, currentProgress } = useMissionStore()
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  const currentSubtaskData = subtasks.find((s) => s.id === subtaskNumber)
  const progress = subtasksProgress[subtaskNumber]

  useEffect(() => {
    if (progress) {
      setNotes(progress.notes || '')
    }
  }, [progress])

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('subtask_number', subtaskNumber.toString())
      
      const response = await apiGateway.post<{ file_id: string; file_url: string }>(
        `/mission-progress/${currentProgress?.id}/files`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      return response
    },
  })

  // Save progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: async () => {
      const evidence = progress?.evidence || []
      const response = await apiGateway.patch(
        `/mission-progress/${currentProgress?.id}`,
        {
          subtask_number: subtaskNumber,
          evidence,
          notes,
        }
      )
      return response
    },
  })

  useEffect(() => {
    if (saveProgressMutation.isSuccess) {
      updateSubtaskProgress(subtaskNumber, {
        completed: true,
        evidence: progress?.evidence || [],
        notes,
      })
    }
  }, [saveProgressMutation.isSuccess, subtaskNumber, progress?.evidence, notes, updateSubtaskProgress])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const result = await uploadFileMutation.mutateAsync(file)
      updateSubtaskProgress(subtaskNumber, {
        completed: progress?.completed || false,
        evidence: [...(progress?.evidence || []), result.file_url],
        notes: progress?.notes || '',
      })
      setFiles([...files, file])
    } catch (error) {
      console.error('File upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = () => {
    saveProgressMutation.mutate()
  }

  const handleComplete = () => {
    updateSubtaskProgress(subtaskNumber, {
      completed: true,
      evidence: progress?.evidence || [],
      notes,
    })
    saveProgressMutation.mutate()
  }

  if (!currentSubtaskData) {
    return <Card className="p-6 text-center text-och-steel">Subtask not found</Card>
  }

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Badge variant="mint">Subtask {subtaskNumber}</Badge>
          <h3 className="text-lg font-bold text-white">{currentSubtaskData.title}</h3>
        </div>
        {progress?.completed && <Badge variant="mint">✓ Completed</Badge>}
      </div>

      <p className="text-och-steel mb-6 leading-relaxed">{currentSubtaskData.description}</p>

      {/* Evidence Upload */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-och-steel mb-2">
          Evidence Files
        </label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg cursor-pointer hover:border-och-mint/50 transition-colors"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </label>
          {progress?.evidence && progress.evidence.length > 0 && (
            <span className="text-sm text-och-steel">
              {progress.evidence.length} file(s) uploaded
            </span>
          )}
        </div>
        {progress?.evidence && progress.evidence.length > 0 && (
          <div className="mt-3 space-y-2">
            {progress.evidence.map((url, idx) => (
              <div key={idx} className="text-sm text-och-steel flex items-center gap-2">
                <span>📎</span>
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-och-mint hover:underline">
                  File {idx + 1}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-och-steel mb-2">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel focus:border-och-mint focus:outline-none"
          placeholder="Add your notes here..."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="defender" size="sm" onClick={handleSave} disabled={saveProgressMutation.isPending}>
          Save Progress
        </Button>
        <Button variant="mint" size="sm" onClick={handleComplete} disabled={saveProgressMutation.isPending}>
          Mark Complete
        </Button>
      </div>
    </Card>
  )
}

