'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Users, X } from 'lucide-react'
import { apiGateway } from '@/services/apiGateway'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface FormField {
  key: string
  label: string
  type: string
  required: boolean
}

interface PublishedCohort {
  id: string
  name: string
  start_date: string
  end_date: string
  mode: string
  track: { id: string; name: string }
  program: { id: string; name: string } | null
  profile_image_url: string | null
  student_form_fields: FormField[]
  sponsor_form_fields: FormField[]
  seat_cap: number
  enrollment_count: number
}

type ApplicantType = 'student' | 'sponsor'

export function PublicCohortRegistration() {
  const [cohorts, setCohorts] = useState<PublishedCohort[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCohort, setSelectedCohort] = useState<PublishedCohort | null>(null)
  const [applicantType, setApplicantType] = useState<ApplicantType | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCohorts()
  }, [])

  const fetchCohorts = async () => {
    try {
      const res = await apiGateway.get<{ cohorts: PublishedCohort[] }>('/public/cohorts/', { skipAuth: true })
      const data = res as any
      setCohorts(data?.cohorts || [])
    } catch {
      setCohorts([])
    } finally {
      setLoading(false)
    }
  }

  const openForm = (cohort: PublishedCohort, type: ApplicantType) => {
    setSelectedCohort(cohort)
    setApplicantType(type)
    setFormData({})
    setSuccess(null)
    setError(null)
  }

  const closeForm = () => {
    setSelectedCohort(null)
    setApplicantType(null)
    setFormData({})
    setSuccess(null)
    setError(null)
  }

  const getFields = () => {
    if (!selectedCohort || !applicantType) return []
    return applicantType === 'student'
      ? selectedCohort.student_form_fields
      : selectedCohort.sponsor_form_fields
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCohort || !applicantType) return
    setSubmitting(true)
    setError(null)
    try {
      const endpoint =
        applicantType === 'student'
          ? `/public/cohorts/${selectedCohort.id}/apply/student/`
          : `/public/cohorts/${selectedCohort.id}/apply/sponsor/`
      const res = await apiGateway.post(endpoint, { form_data: formData }, { skipAuth: true })
      const data = res as any
      setSuccess(data?.message || 'Application submitted successfully!')
      setFormData({})
    } catch (err: any) {
      const msg =
        err?.data?.error || err?.data?.detail || err?.message || 'Submission failed. Please try again.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null
  if (cohorts.length === 0) return null

  const fields = getFields()

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-och-midnight/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Apply to a Cohort
          </h2>
          <p className="text-xl text-och-steel max-w-2xl mx-auto">
            Join an upcoming cohort as a student or sponsor your talent development
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cohorts.map((cohort) => (
            <Card
              key={cohort.id}
              className="border-och-steel/20 bg-och-midnight hover:border-och-defender/40 transition-all overflow-hidden"
            >
              <div className="aspect-video bg-och-midnight/80 flex items-center justify-center overflow-hidden">
                {cohort.profile_image_url ? (
                  <img
                    src={cohort.profile_image_url}
                    alt={cohort.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-och-steel/50 text-6xl">
                    <GraduationCap className="w-16 h-16 mx-auto" />
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{cohort.name}</h3>
                <p className="text-sm text-och-mint mb-1">
                  {cohort.track?.name} {cohort.program && `• ${cohort.program.name}`}
                </p>
                <p className="text-xs text-och-steel mb-4">
                  {cohort.start_date} – {cohort.end_date} • {cohort.mode}
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="defender"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => openForm(cohort, 'student')}
                  >
                    <GraduationCap className="w-4 h-4" />
                    Apply as Student
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 border-och-gold/50 text-och-gold hover:bg-och-gold/10"
                    onClick={() => openForm(cohort, 'sponsor')}
                  >
                    <Users className="w-4 h-4" />
                    Join as Sponsor
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <AnimatePresence>
          {selectedCohort && applicantType && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={closeForm}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md"
              >
                <Card className="border-och-defender/40 bg-och-midnight p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">
                      {applicantType === 'student' ? 'Apply as Student' : 'Join as Sponsor'} –{' '}
                      {selectedCohort.name}
                    </h3>
                    <button
                      type="button"
                      onClick={closeForm}
                      className="p-2 text-och-steel hover:text-white rounded-lg"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {success ? (
                    <div className="p-4 bg-och-mint/10 border border-och-mint/30 rounded-lg text-och-mint">
                      {success}
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {error && (
                        <div className="p-3 bg-och-orange/10 border border-och-orange/30 rounded-lg text-och-orange text-sm">
                          {error}
                        </div>
                      )}
                      {fields.map((field) => (
                        <div key={field.key}>
                          <label className="block text-sm font-medium text-white mb-1">
                            {field.label}
                            {field.required && <span className="text-och-orange">*</span>}
                          </label>
                          {field.type === 'textarea' ? (
                            <textarea
                              required={field.required}
                              value={formData[field.key] || ''}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                              }
                              className="w-full px-4 py-2 bg-och-midnight/80 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender min-h-[80px]"
                              placeholder={field.label}
                              rows={3}
                            />
                          ) : (
                            <input
                              type={field.type === 'url' ? 'url' : field.type || 'text'}
                              required={field.required}
                              value={formData[field.key] || ''}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                              }
                              className="w-full px-4 py-2 bg-och-midnight/80 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                              placeholder={field.label}
                            />
                          )}
                        </div>
                      ))}
                      <div className="flex gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={closeForm}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="defender"
                          disabled={submitting}
                          className="flex-1"
                        >
                          {submitting ? 'Submitting...' : 'Submit'}
                        </Button>
                      </div>
                    </form>
                  )}
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
