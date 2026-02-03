'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'

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
  status: string
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
  recent_certificates: Array<{
    id: string
    user_name: string
    program_name: string
    issued_at: string
    status: string
  }>
}

interface Program {
  id: string
  name: string
  category: string
}

export default function CertificateManagementClient() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'list' | 'generate' | 'templates' | 'statistics'>('list')
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [statistics, setStatistics] = useState<CertificateStats | null>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [templates, setTemplates] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('technical')
  const [customFields, setCustomFields] = useState<any>({})
  const [selectedCertificates, setSelectedCertificates] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const headers = { 'Authorization': `Bearer ${token}` }

      // Load certificates
      if (activeTab === 'list') {
        const certResponse = await fetch('/api/v1/director/certificates/list_certificates/', { headers })
        if (certResponse.ok) {
          const data = await certResponse.json()
          setCertificates(data.certificates)
        }
      }

      // Load statistics
      if (activeTab === 'statistics') {
        const statsResponse = await fetch('/api/v1/director/certificates/statistics/', { headers })
        if (statsResponse.ok) {
          const data = await statsResponse.json()
          setStatistics(data)
        }
      }

      // Load templates
      if (activeTab === 'templates' || activeTab === 'generate') {
        const templatesResponse = await fetch('/api/v1/director/certificates/certificate_templates/', { headers })
        if (templatesResponse.ok) {
          const data = await templatesResponse.json()
          setTemplates(data)
        }
      }

      // Load programs for generation
      if (activeTab === 'generate') {
        const programsResponse = await fetch('/api/v1/director/programs/', { headers })
        if (programsResponse.ok) {
          const data = await programsResponse.json()
          setPrograms(data.results || data)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadCertificate = async (certificateId: string) => {
    try {
      const response = await fetch(`/api/v1/director/certificates/${certificateId}/download/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `certificate_${certificateId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading certificate:', error)
    }
  }

  const generateCertificate = async (enrollmentId: string) => {
    setGenerating(true)
    try {
      const response = await fetch('/api/v1/director/certificates/generate_certificate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          enrollment_id: enrollmentId,
          template_type: selectedTemplate,
          custom_fields: customFields
        })
      })

      if (response.ok) {
        await loadData() // Reload certificates
      } else {
        const error = await response.json()
        console.error('Failed to generate certificate:', error)
      }
    } catch (error) {
      console.error('Error generating certificate:', error)
    } finally {
      setGenerating(false)
    }
  }

  const bulkGenerate = async () => {
    if (selectedCertificates.size === 0) return

    setGenerating(true)
    try {
      const response = await fetch('/api/v1/director/certificates/bulk_generate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          enrollment_ids: Array.from(selectedCertificates),
          template_type: selectedTemplate
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Generated ${result.generated_certificates.length} certificates`)
        setSelectedCertificates(new Set())
        await loadData()
      } else {
        const error = await response.json()
        console.error('Failed to bulk generate:', error)
      }
    } catch (error) {
      console.error('Error bulk generating:', error)
    } finally {
      setGenerating(false)
    }
  }

  const toggleCertificateSelection = (certificateId: string) => {
    const newSelection = new Set(selectedCertificates)
    if (newSelection.has(certificateId)) {
      newSelection.delete(certificateId)
    } else {
      newSelection.add(certificateId)
    }
    setSelectedCertificates(newSelection)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
          <p className="text-och-steel">Loading certificates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Certificate Management</h1>
        <p className="text-och-steel">Generate, manage, and download program certificates</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-och-steel/20">
        {[
          { key: 'list', label: 'Certificates', icon: '📜' },
          { key: 'generate', label: 'Generate', icon: '⚡' },
          { key: 'templates', label: 'Templates', icon: '🎨' },
          { key: 'statistics', label: 'Statistics', icon: '📊' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-och-defender border-b-2 border-och-defender'
                : 'text-och-steel hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Certificates List */}
      {activeTab === 'list' && (
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Issued Certificates</h2>
              {selectedCertificates.size > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCertificates(new Set())}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    variant="defender"
                    size="sm"
                    onClick={bulkGenerate}
                    disabled={generating}
                  >
                    {generating ? 'Generating...' : `Regenerate Selected (${selectedCertificates.size})`}
                  </Button>
                </div>
              )}
            </div>

            {certificates.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📜</div>
                <p className="text-och-steel">No certificates found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedCertificates.has(cert.enrollment_id)}
                          onChange={() => toggleCertificateSelection(cert.enrollment_id)}
                          className="w-4 h-4"
                        />
                        <div>
                          <h3 className="font-semibold text-white">{cert.user.name}</h3>
                          <p className="text-sm text-och-steel">{cert.user.email}</p>
                          <p className="text-xs text-och-steel">{cert.program} - {cert.track}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <Badge variant={cert.status === 'issued' ? 'mint' : 'orange'}>
                            {cert.status}
                          </Badge>
                          <p className="text-xs text-och-steel mt-1">
                            {new Date(cert.issued_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        {cert.file_uri && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadCertificate(cert.id)}
                          >
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Generate Certificates */}
      {activeTab === 'generate' && (
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Generate New Certificates</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-och-steel mb-2">
                    Template Type
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                  >
                    {Object.entries(templates).map(([key, template]: [string, any]) => (
                      <option key={key} value={key}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-och-steel mb-2">
                    Program Filter
                  </label>
                  <select
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                  >
                    <option value="">All Programs</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {templates[selectedTemplate] && (
                <div className="mt-6 p-4 bg-och-midnight/50 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">Template Preview</h3>
                  <p className="text-och-steel mb-3">{templates[selectedTemplate].description}</p>
                  <div className="flex flex-wrap gap-2">
                    {templates[selectedTemplate].fields.map((field: string) => (
                      <Badge key={field} variant="outline">{field}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Eligible Enrollments</h3>
              <p className="text-och-steel mb-4">
                Completed enrollments without certificates will appear here for generation.
              </p>
              <div className="text-center py-8 text-och-steel">
                <p>Load eligible enrollments based on selected program filter</p>
                <Button variant="outline" className="mt-4">
                  Load Eligible Enrollments
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(templates).map(([key, template]: [string, any]) => (
            <Card key={key}>
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-2">{template.name}</h3>
                <p className="text-och-steel mb-4">{template.description}</p>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-och-steel mb-2">Design Style</p>
                    <Badge variant="outline">{template.design}</Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-och-steel mb-2">Color Scheme</p>
                    <Badge variant="outline">{template.color_scheme}</Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-och-steel mb-2">Available Fields</p>
                    <div className="flex flex-wrap gap-1">
                      {template.fields.map((field: string) => (
                        <Badge key={field} variant="steel" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => {
                    setSelectedTemplate(key)
                    setActiveTab('generate')
                  }}
                >
                  Use Template
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Statistics */}
      {activeTab === 'statistics' && statistics && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm">Total Certificates</p>
                <p className="text-2xl font-bold text-white">{statistics.summary.total_certificates}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm">Issued</p>
                <p className="text-2xl font-bold text-och-mint">{statistics.summary.issued_certificates}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm">Pending</p>
                <p className="text-2xl font-bold text-och-orange">{statistics.summary.pending_certificates}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm">Issuance Rate</p>
                <p className="text-2xl font-bold text-och-defender">{statistics.summary.issuance_rate.toFixed(1)}%</p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">By Program</h3>
                <div className="space-y-3">
                  {statistics.program_statistics.map((prog) => (
                    <div key={prog.program_id} className="flex justify-between items-center">
                      <span className="text-white">{prog.program_name}</span>
                      <div className="text-right">
                        <span className="text-white font-semibold">{prog.issued_certificates}/{prog.total_certificates}</span>
                        <div className="w-20 bg-och-steel/20 rounded-full h-2 mt-1">
                          <div
                            className="bg-och-defender h-2 rounded-full"
                            style={{
                              width: `${prog.total_certificates > 0 ? (prog.issued_certificates / prog.total_certificates * 100) : 0}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Recent Certificates</h3>
                <div className="space-y-2">
                  {statistics.recent_certificates.map((cert) => (
                    <div key={cert.id} className="flex justify-between items-center py-2">
                      <div>
                        <p className="text-white font-semibold">{cert.user_name}</p>
                        <p className="text-xs text-och-steel">{cert.program_name}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={cert.status === 'issued' ? 'mint' : 'orange'}>
                          {cert.status}
                        </Badge>
                        <p className="text-xs text-och-steel mt-1">
                          {new Date(cert.issued_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}