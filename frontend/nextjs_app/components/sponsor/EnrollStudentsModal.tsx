'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Users, CheckCircle, Loader2 } from 'lucide-react'
import { apiGateway } from '@/services/apiGateway'

interface EnrollStudentsModalProps {
  cohortId: string
  cohortName: string
  onClose: () => void
  onSuccess: () => void
}

interface LinkedStudent {
  uuid_id: string
  id: string
  email: string
  first_name: string
  last_name: string
}

export function EnrollStudentsModal({
  cohortId,
  cohortName,
  onClose,
  onSuccess,
}: EnrollStudentsModalProps) {
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [enrolling, setEnrolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLinkedStudents()
  }, [])

  const fetchLinkedStudents = async () => {
    setLoadingStudents(true)
    setError(null)
    try {
      const res = await apiGateway.get('/sponsor/dashboard/linked-students/')
      setLinkedStudents(res.students || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load linked students')
      setLinkedStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }

  const filteredStudents = linkedStudents.filter(
    (s) =>
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleStudent = (uuidId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(uuidId)) next.delete(uuidId)
      else next.add(uuidId)
      return next
    })
  }

  const handleEnroll = async () => {
    if (selectedIds.size === 0) return
    setEnrolling(true)
    setError(null)
    try {
      await apiGateway.post('/sponsor/seats/assign', {
        cohort_id: cohortId,
        user_ids: Array.from(selectedIds),
      })
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Enrollment failed')
    } finally {
      setEnrolling(false)
    }
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white">Enroll Students in {cohortName}</DialogTitle>
        </DialogHeader>
        <p className="text-och-steel text-sm -mt-2">
          Only students linked to your sponsor account can be enrolled.
        </p>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-och-steel" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-och-midnight border-och-steel/20"
          />
        </div>

        {error && (
          <div className="text-red-400 text-sm py-2">{error}</div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto border border-och-steel/20 rounded-lg">
          {loadingStudents ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-och-defender animate-spin mb-3" />
              <p className="text-och-steel">Loading linked students...</p>
            </div>
          ) : linkedStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-och-steel">
              <Users className="w-12 h-12 mb-3 opacity-50" />
              <p>No students linked to your account</p>
              <p className="text-sm mt-1">Contact your program director to link students</p>
            </div>
          ) : (
            <div className="divide-y divide-och-steel/10">
              {filteredStudents.map((s) => {
                const name = [s.first_name, s.last_name].filter(Boolean).join(' ') || s.email
                const uuidId = s.uuid_id || s.id
                const isSelected = selectedIds.has(uuidId)
                return (
                  <button
                    key={uuidId}
                    type="button"
                    onClick={() => toggleStudent(uuidId)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                      isSelected ? 'bg-och-defender/20' : 'hover:bg-och-steel/5'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-och-defender border-och-defender' : 'border-och-steel/40'
                      }`}
                    >
                      {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div>
                      <p className="font-medium text-white">{name}</p>
                      <p className="text-sm text-och-steel">{s.email}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-och-steel/20">
          <span className="text-sm text-och-steel">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleEnroll}
              disabled={enrolling || selectedIds.size === 0}
              className="bg-och-defender hover:bg-och-defender/90"
            >
              {enrolling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enrolling...
                </>
              ) : (
                `Enroll ${selectedIds.size} Student${selectedIds.size !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
