/**
 * Redesigned Subtask View Component
 * Atomic submission portal for mission evidence
 * Features OCH dark theme, drag-drop terminal, and dependency visualization
 */
'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  FileText, 
  X, 
  Lock, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert,
  Zap,
  Save,
  Rocket,
  ArrowRight,
  Monitor,
  Target
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatusBadge } from './shared/StatusBadge'
import { MobileFloatingActionBar } from './MobileFloatingActionBar'
import { useMissionStore } from '@/lib/stores/missionStore'
import clsx from 'clsx'

interface SubtaskViewEnhancedProps {
  missionId: string
}

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  url?: string
}

export function SubtaskViewEnhanced({ missionId }: SubtaskViewEnhancedProps) {
  const { currentSubtask, subtasks, subtasksProgress, updateSubtaskProgress, setCurrentSubtask } = useMissionStore()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [notes, setNotes] = useState('')
  const [justCompleted, setJustCompleted] = useState(false)

  const currentSubtaskData = subtasks.find((s) => s.id === currentSubtask)
  const progress = subtasksProgress[currentSubtask] || { completed: false, evidence: [], notes: '' }

  useEffect(() => {
    if (progress) {
      setNotes(progress.notes || '')
      if (progress.evidence && progress.evidence.length > 0) {
        setUploadedFiles(
          progress.evidence.map((url, idx) => ({
            id: `file-${idx}`,
            name: url.split('/').pop() || `Evidence ${idx + 1}`,
            type: 'file',
            size: 0,
            url,
          }))
        )
      }
    }
  }, [progress, currentSubtask])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const files = Array.from(e.dataTransfer.files)
      await handleFileUpload(files)
  }, [uploadedFiles, currentSubtask])

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      await handleFileUpload(files)
  }, [uploadedFiles, currentSubtask])

  const handleFileUpload = async (files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file, idx) => ({
      id: `file-${Date.now()}-${idx}`,
      name: file.name,
      type: file.type || 'file',
      size: file.size,
    }))

    const updatedFiles = [...uploadedFiles, ...newFiles]
    setUploadedFiles(updatedFiles)

    const evidenceUrls = updatedFiles.map((f) => f.url || f.name)
    updateSubtaskProgress(currentSubtask, {
      completed: progress.completed,
      evidence: evidenceUrls,
      notes: notes,
    })
  }

  const removeFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter((f) => f.id !== fileId)
    setUploadedFiles(updatedFiles)
    updateSubtaskProgress(currentSubtask, {
      completed: progress.completed,
      evidence: updatedFiles.map((f) => f.url || f.name),
      notes: notes,
    })
  }

  const handleComplete = () => {
    updateSubtaskProgress(currentSubtask, {
      completed: true,
      evidence: uploadedFiles.map((f) => f.url || f.name),
      notes,
    })
    setJustCompleted(true)
    setTimeout(() => setJustCompleted(false), 2000)
  }

  const allDependenciesMet = currentSubtaskData?.dependencies
    ? currentSubtaskData.dependencies.every((depId: number) => {
        const depProgress = subtasksProgress[depId]
        return depProgress?.completed
      })
    : true

  if (!currentSubtaskData) {
    return (
      <Card className="bg-och-midnight/60 border-och-steel/10 p-12 text-center rounded-[2rem]">
        <ShieldAlert className="w-12 h-12 text-och-steel/30 mx-auto mb-4" />
        <p className="text-och-steel font-black uppercase tracking-widest text-xs">Awaiting Subtask Deployment...</p>
      </Card>
    )
  }

  const subtaskStatus = progress.completed ? 'completed' : allDependenciesMet ? 'available' : 'locked'
  const evidenceTypes = currentSubtaskData.evidence_schema?.file_types || ['PDF', 'SCREENSHOT', 'GITHUB', 'VIDEO']

  const canGoPrevious = currentSubtask > 0
  const canGoNext = currentSubtask < subtasks.length - 1

  return (
    <div className="relative pb-24 lg:pb-0 h-full flex flex-col">
      <Card className="bg-och-midnight/60 rounded-[2.5rem] border border-och-steel/10 p-8 xl:p-12 flex-1 flex flex-col shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* PROGRESS WATERMARK */}
        <div className="absolute top-0 right-0 p-8 opacity-5 select-none pointer-events-none">
          <span className="text-[120px] font-black leading-none">0{currentSubtask + 1}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-10 relative z-10">
          <div className="flex gap-6">
            <div className="w-16 h-16 rounded-2xl bg-och-defender/10 border border-och-defender/20 flex items-center justify-center text-och-defender relative group overflow-hidden">
               <div className="absolute inset-0 bg-och-defender/5 animate-pulse" />
               <Rocket className="w-8 h-8 relative z-10 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="defender" className="text-[9px] font-black tracking-widest px-2 py-0.5">SUBTASK {currentSubtask + 1}</Badge>
                <div className="h-1 w-1 rounded-full bg-och-steel/30" />
                <StatusBadge status={subtaskStatus as any} />
              </div>
              <h3 className="text-2xl xl:text-3xl font-black text-white uppercase tracking-tight">{currentSubtaskData.title}</h3>
            </div>
          </div>
          
          <div className="hidden sm:flex gap-2">
            <button 
              onClick={() => canGoPrevious && setCurrentSubtask(currentSubtask - 1)}
              disabled={!canGoPrevious}
              className="p-3 rounded-xl bg-och-steel/10 text-och-steel hover:bg-och-steel/20 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => canGoNext && setCurrentSubtask(currentSubtask + 1)}
              disabled={!canGoNext}
              className="p-3 rounded-xl bg-och-steel/10 text-och-steel hover:bg-och-steel/20 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <p className="text-slate-300 text-sm font-medium leading-relaxed mb-10 max-w-3xl relative z-10 italic">
          "{currentSubtaskData.description}"
        </p>

        {/* Evidence Submission Terminal */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-1 relative z-10">
          <div className="space-y-6">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
              className={clsx(
                "border-2 border-dashed rounded-[2rem] p-10 text-center transition-all duration-500 h-full flex flex-col items-center justify-center relative group",
            isDragging
                  ? "border-och-mint bg-och-mint/10 scale-[1.02]"
                  : "border-och-steel/20 bg-och-midnight/40 hover:border-och-mint/50 hover:bg-och-mint/5"
              )}
        >
              <div className="absolute top-4 right-4 opacity-20">
                <Monitor className="w-8 h-8" />
              </div>

          <motion.div
                animate={isDragging ? { y: [0, -10, 0] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
                className={clsx("p-6 rounded-3xl bg-och-midnight/80 border border-och-steel/10 mb-6 shadow-2xl transition-all group-hover:border-och-mint/30", isDragging ? "shadow-och-mint/20" : "")}
          >
                <Upload className={clsx("w-12 h-12", isDragging ? "text-och-mint" : "text-och-steel")} />
          </motion.div>
              
              <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-2">Evidence Terminal</h4>
              <p className="text-xs text-och-steel font-bold mb-8 max-w-[240px] uppercase tracking-widest leading-relaxed">
                {evidenceTypes.join(' • ')} <br/>
                <span className="text-[10px] opacity-60">Max 50MB per artifact</span>
          </p>

          <input
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
            accept={evidenceTypes.map((t: string) => {
                  const tag = t.toLowerCase()
                  if (tag === 'screenshot') return 'image/*'
                  if (tag === 'video') return 'video/*'
                  if (tag === 'pdf') return '.pdf'
              return '*/*'
            }).join(',')}
          />
          <label htmlFor="file-upload">
                <Button variant="defender" className="cursor-pointer h-12 px-8 rounded-xl font-black uppercase tracking-widest bg-och-mint text-black hover:bg-white transition-all shadow-lg shadow-och-mint/20">
                  Select Artifacts
            </Button>
          </label>
            </div>
          </div>

          <div className="space-y-6 flex flex-col">
            {/* TACTICAL BRANCHING (Advanced/Mastery Only) */}
            {true && (
              <div className="p-6 rounded-2xl bg-och-defender/5 border border-och-defender/20 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-4 h-4 text-och-defender" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Tactical Branching</span>
                </div>
                <p className="text-[11px] text-och-steel font-medium italic mb-4">
                  "Critical scenario pivot detected. Your choice here will dictate the next engagement phase."
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-3 rounded-xl bg-och-midnight border border-och-defender/30 text-[10px] font-black text-white uppercase tracking-tight hover:bg-och-defender transition-all">
                    Aggressive Containment
                  </button>
                  <button className="p-3 rounded-xl bg-och-midnight border border-och-steel/20 text-[10px] font-black text-och-steel uppercase tracking-tight hover:border-white transition-all">
                    Stealth Observation
                  </button>
                </div>
              </div>
            )}

            {/* Artifacts Queue */}
            <div className="flex-1 space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              <p className="text-[10px] font-black text-och-steel uppercase tracking-widest mb-2 flex items-center gap-2">
                <FileCode className="w-3 h-3" /> Artifact Queue
              </p>
              <AnimatePresence initial={false}>
                {uploadedFiles.length > 0 ? (
                  uploadedFiles.map((file) => (
                  <motion.div
                    key={file.id}
                      initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center justify-between p-4 bg-white/5 border border-och-steel/10 rounded-2xl group hover:border-och-mint/30 transition-all"
                  >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="p-2 rounded-lg bg-och-midnight/80 border border-och-steel/10">
                          <FileText className="w-4 h-4 text-och-mint" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white truncate uppercase tracking-tight">{file.name}</p>
                          <p className="text-[9px] text-och-steel font-bold uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB • {file.type.split('/')[1] || 'DOC'}</p>
                        </div>
                    </div>
                      <button
                      onClick={() => removeFile(file.id)}
                        className="p-2 rounded-lg hover:bg-och-defender/20 text-och-steel hover:text-och-defender transition-all"
                    >
                      <X className="w-4 h-4" />
                      </button>
                  </motion.div>
                  ))
                ) : (
                  <div className="h-32 flex flex-col items-center justify-center border border-och-steel/5 rounded-2xl bg-white/5 italic">
                    <p className="text-och-steel/40 text-[10px] font-bold uppercase tracking-widest">Queue Empty</p>
                  </div>
                )}
              </AnimatePresence>
        </div>

            {/* Tactical Notes */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-och-steel uppercase tracking-widest mb-2 flex items-center gap-2">
                <Zap className="w-3 h-3" /> Tactical Notes
              </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
                className="w-full px-6 py-4 bg-och-midnight/80 border border-och-steel/20 rounded-2xl text-white text-xs font-bold placeholder:text-och-steel/30 focus:border-och-defender/50 outline-none transition-all shadow-inner resize-none uppercase tracking-wider leading-relaxed"
                placeholder="DESCRIBE YOUR METHODOLOGY AND DISCOVERIES..."
          />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 pt-8 border-t border-och-steel/10 flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
        {!allDependenciesMet && (
              <div className="flex items-center gap-3 text-och-defender bg-och-defender/10 px-4 py-2 rounded-xl border border-och-defender/20 animate-pulse">
                <Lock className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Dependencies Locked</span>
              </div>
            )}
            {progress.completed && (
              <div className="flex items-center gap-3 text-och-mint bg-och-mint/10 px-4 py-2 rounded-xl border border-och-mint/20">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Subtask Verified</span>
            </div>
        )}
          </div>

          <div className="flex items-center gap-3">
          <Button
              variant="outline"
              className="h-12 px-6 rounded-xl border-och-steel/20 text-och-steel text-[10px] font-black uppercase tracking-widest hover:border-white transition-all"
            onClick={() => {
              updateSubtaskProgress(currentSubtask, {
                completed: progress.completed,
                evidence: uploadedFiles.map((f) => f.url || f.name),
                notes,
              })
            }}
          >
              <Save className="w-4 h-4 mr-2" />
              Save Intel
          </Button>
          <Button
              className={clsx(
                "h-12 px-10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all",
                progress.completed 
                  ? "bg-och-mint/20 border border-och-mint/30 text-och-mint" 
                  : "bg-och-defender text-white hover:scale-105 active:scale-95 shadow-och-defender/20"
              )}
            onClick={handleComplete}
            disabled={!allDependenciesMet || progress.completed}
          >
              {progress.completed ? 'Subtask Complete' : 'Commit Subtask'}
              {!progress.completed && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
          </div>
        </div>
      </Card>

      {/* Completion Celebration */}
      <AnimatePresence>
        {justCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-och-midnight/60 backdrop-blur-md rounded-[2.5rem] z-[60]"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              className="p-12 rounded-[3rem] bg-och-mint text-black flex flex-col items-center gap-6 shadow-[0_0_100px_rgba(16,185,129,0.4)]"
            >
              <CheckCircle2 className="w-20 h-20" />
              <div className="text-center">
                <h4 className="text-3xl font-black uppercase tracking-tighter mb-1">Subtask Committed</h4>
                <p className="text-sm font-bold uppercase tracking-widest opacity-70">Progress Data Synced</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FileCode({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 12.5 8 15l2 2.5"/><path d="m14 12.5 2 2.5-2 2.5"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/></svg>
  )
}
