'use client'

import { useState, useEffect } from 'react'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { apiClient } from '@/services/apiClient'

interface Certificate {
  id: string
  enrollment_id: string
  user: {
    id: string
    email: string
    name: string
  }
  program: string
  track: string
  cohort: string
  issued_at: string
  file_uri: string
  status: 'issued' | 'pending'
}

interface CertificateStats {
  summary: {
    total_certificates: number
    issued_certificates: number
    pending_certificates: number
    issuance_rate: number
  }
  program_statistics: Array<{
    program_id: string
    program_name: string
    total_certificates: number
    issued_certificates: number
  }>
}

export default function CertificatesClient() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [stats, setStats] = useState<CertificateStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [programFilter, setProgramFilter] = useState<string>('all')
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedEnrollments, setSelectedEnrollments] = useState<string[]>([])
  const [templateType, setTemplateType] = useState('technical')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    loadCertificates()
    loadStatistics()
  }, [statusFilter, programFilter])

  const loadCertificates = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (programFilter !== 'all') params.append('program_id', programFilter)
      
      const response = await apiClient.get(`/api/v1/programs/director/certificates/list_certificates/?${params}`) as any
      setCertificates(response.data.certificates || [])
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load certificates')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const response = await apiClient.get('/api/v1/programs/director/certificates/statistics/')
      setStats((response as any).data)
    } catch (err) {
      console.error('Failed to load certificate statistics:', err)
    }
  }

  const downloadCertificate = async (certificateId: string) => {
    try {
      const response = await apiClient.get(`/api/v1/programs/director/certificates/${certificateId}/download/`, {
        // @ts-ignore - responseType not in type but needed for blob
        responseType: 'blob'
      })
      
      const blob = new Blob([(response as any).data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificate_${certificateId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to download certificate')
    }
  }

  const generateCertificate = async (enrollmentId: string) => {
    try {
      setIsGenerating(true)
      await apiClient.post('/api/v1/programs/director/certificates/generate_certificate/', {
        enrollment_id: enrollmentId,
        template_type: templateType
      })
      await loadCertificates()
      await loadStatistics()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate certificate')
    } finally {
      setIsGenerating(false)
    }
  }

  const bulkGenerate = async () => {
    try {
      setIsGenerating(true)
      await apiClient.post('/api/v1/programs/director/certificates/bulk_generate/', {
        enrollment_ids: selectedEnrollments,
        template_type: templateType
      })
      setSelectedEnrollments([])
      setShowGenerateModal(false)
      await loadCertificates()
      await loadStatistics()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate certificates')
    } finally {
      setIsGenerating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <DirectorLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-orange">Certificate Management</h1>
            <p className="text-och-steel">Generate, manage, and download program certificates</p>
          </div>
          <Button 
            variant="defender" 
            onClick={() => setShowGenerateModal(true)}
            disabled={selectedEnrollments.length === 0}
          >
            Generate Certificates ({selectedEnrollments.length})
          </Button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Total Certificates</p>
                <p className="text-2xl font-bold text-white">{stats.summary.total_certificates}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Issued</p>
                <p className="text-2xl font-bold text-och-mint">{stats.summary.issued_certificates}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Pending</p>
                <p className="text-2xl font-bold text-och-orange">{stats.summary.pending_certificates}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Issuance Rate</p>
                <p className="text-2xl font-bold text-och-defender">{stats.summary.issuance_rate.toFixed(1)}%</p>
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <div className="p-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                >
                  <option value="all">All Certificates</option>
                  <option value="issued">Issued</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              
              {stats && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Program</label>
                  <select
                    value={programFilter}
                    onChange={(e) => setProgramFilter(e.target.value)}
                    className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="all">All Programs</option>
                    {stats.program_statistics.map(program => (
                      <option key={program.program_id} value={program.program_id}>
                        {program.program_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Certificates Table */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Certificates</h2>
              <Badge variant="defender">{certificates.length} certificates</Badge>
            </div>
            
            {error && (
              <div className="mb-4 p-4 bg-och-orange/10 border border-och-orange/20 rounded-lg">
                <p className="text-och-orange">{error}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setError(null)}>
                  Dismiss
                </Button>
              </div>
            )}
            
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
                <p className="text-och-steel">Loading certificates...</p>
              </div>
            ) : certificates.length === 0 ? (
              <div className="text-center py-12 text-och-steel">
                <p>No certificates found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-och-steel/20">
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={selectedEnrollments.length === certificates.filter(c => c.status === 'pending').length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEnrollments(certificates.filter(c => c.status === 'pending').map(c => c.enrollment_id))
                            } else {
                              setSelectedEnrollments([])
                            }
                          }}
                        />
                      </th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Student</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Program</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Track</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Cohort</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Status</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Issued Date</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificates.map((cert) => (
                      <tr key={cert.id} className="border-b border-och-steel/10 hover:bg-och-midnight/50">
                        <td className="p-3">
                          {cert.status === 'pending' && (
                            <input
                              type="checkbox"
                              checked={selectedEnrollments.includes(cert.enrollment_id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedEnrollments([...selectedEnrollments, cert.enrollment_id])
                                } else {
                                  setSelectedEnrollments(selectedEnrollments.filter(id => id !== cert.enrollment_id))
                                }
                              }}
                            />
                          )}
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="text-white font-medium">{cert.user.name || 'N/A'}</p>
                            <p className="text-och-steel text-sm">{cert.user.email}</p>
                          </div>
                        </td>
                        <td className="p-3 text-white">{cert.program}</td>
                        <td className="p-3 text-och-steel">{cert.track}</td>
                        <td className="p-3 text-och-steel">{cert.cohort}</td>
                        <td className="p-3">
                          <Badge variant={cert.status === 'issued' ? 'mint' : 'orange'}>
                            {cert.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-och-steel text-sm">
                          {formatDate(cert.issued_at)}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            {cert.status === 'issued' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadCertificate(cert.id)}
                              >
                                Download
                              </Button>
                            ) : (
                              <Button
                                variant="defender"
                                size="sm"
                                onClick={() => generateCertificate(cert.enrollment_id)}
                                disabled={isGenerating}
                              >
                                Generate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        {/* Generate Certificates Modal */}
        <Modal
          isOpen={showGenerateModal}
          onClose={() => setShowGenerateModal(false)}
          title="Generate Certificates"
        >
          <div className="space-y-4">
            <p className="text-och-steel">
              Generate certificates for {selectedEnrollments.length} selected enrollments.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Certificate Template
              </label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
              >
                <option value="technical">Technical Program Certificate</option>
                <option value="leadership">Leadership Program Certificate</option>
                <option value="mentorship">Mentorship Program Certificate</option>
                <option value="custom">Custom Certificate</option>
              </select>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowGenerateModal(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                variant="defender"
                onClick={bulkGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate Certificates'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DirectorLayout>
  )
}