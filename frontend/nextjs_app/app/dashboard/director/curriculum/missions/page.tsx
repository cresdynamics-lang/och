'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { missionsClient, type MissionTemplate } from '@/services/missionsClient'
import { usePrograms, useTracks, useProgram } from '@/hooks/usePrograms'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import yaml from 'js-yaml'

const ITEMS_PER_PAGE = 20

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const FilterIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const RocketIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

export default function MissionsManagementPage() {
  const router = useRouter()
  const { programs, isLoading: programsLoading } = usePrograms()
  const [selectedProgramId, setSelectedProgramId] = useState<string>('')
  
  // Fetch program detail when program is selected (includes tracks)
  const { program: selectedProgramDetail } = useProgram(
    selectedProgramId && selectedProgramId !== '' ? selectedProgramId : ''
  )
  
  // Load tracks for the selected program
  const { tracks, isLoading: tracksLoading } = useTracks(
    selectedProgramId && selectedProgramId !== '' ? selectedProgramId : undefined
  )
  
  const [missions, setMissions] = useState<MissionTemplate[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<string>('all')
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<string>('all')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all')
  
  // Form states
  const [showMissionForm, setShowMissionForm] = useState(false)
  const [editingMission, setEditingMission] = useState<MissionTemplate | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // YAML-structured form state
  interface MissionYAMLForm {
    mission_meta: {
      id: string
      version: string
      status: 'draft' | 'active' | 'archived'
      created_at: string
      last_updated: string
    }
    header: {
      title: string
      slug: string
      difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
      tier: 2 | 3
      estimated_duration: string
      track: string
    }
    narrative: {
      context_location: string
      scenario: string
      role: string
    }
    subtasks: Array<{
      id: number
      title: string
      description: string
      order: number
      type: 'technical' | 'forensic' | 'communication' | 'analysis' | 'other'
    }>
    framework_mappings: {
      mitre_attack: Array<{ code: string; name: string }>
      nice_workrole: Array<{ code: string; name: string }>
      nist_csf: Array<{ function: string }>
      iso_27001: Array<{ control: string; name: string }>
      pci_dss: Array<{ requirement: string; description: string }>
      owasp_asvs: Array<{ category: string; name: string }>
      cis_controls: Array<{ control: string; name: string }>
    }
    deliverables: Array<{
      id: string
      title: string
      format: string
      description: string
    }>
    scoring: {
      ai_evaluation: {
        enabled: boolean
        focus: string[]
      }
      mentor_review: {
        enabled: boolean
        tier_required: string
        rubric_focus: string[]
      }
      skills_update: Array<{
        skill: string
        impact: 'low' | 'medium' | 'high'
      }>
    }
  }
  
  const [missionYAMLForm, setMissionYAMLForm] = useState<MissionYAMLForm>({
    mission_meta: {
      id: '',
      version: '1.0.0',
      status: 'draft',
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    },
    header: {
      title: '',
      slug: '',
      difficulty: 'Intermediate',
      tier: 2,
      estimated_duration: '',
      track: '',
    },
    narrative: {
      context_location: '',
      scenario: '',
      role: '',
    },
    subtasks: [],
    framework_mappings: {
      mitre_attack: [],
      nice_workrole: [],
      nist_csf: [],
      iso_27001: [],
      pci_dss: [],
      owasp_asvs: [],
      cis_controls: [],
    },
    deliverables: [],
    scoring: {
      ai_evaluation: {
        enabled: true,
        focus: [],
      },
      mentor_review: {
        enabled: false,
        tier_required: 'Paid ($7)',
        rubric_focus: [],
      },
      skills_update: [],
    },
  })
  
  // Keep legacy form for backward compatibility with existing save logic
  const [missionForm, setMissionForm] = useState<Partial<MissionTemplate>>({
    code: '',
    title: '',
    description: '',
    difficulty: 'beginner',
    type: 'lab',
    track_id: '',
    track_key: '',
    est_hours: undefined,
    estimated_time_minutes: undefined,
    competencies: [],
    requirements: {},
    status: 'draft',
    assessment_mode: 'hybrid',
    requires_mentor_review: false,
    story_narrative: '',
    subtasks: [],
    evidence_upload_schema: {
      file_types: [],
      max_file_size_mb: 10,
      required_artifacts: [],
    },
    time_constraint_hours: undefined,
    competency_coverage: [],
  })

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Load missions when filters change
  useEffect(() => {
    loadMissions()
  }, [currentPage, debouncedSearch, selectedProgramId, selectedTrackFilter, selectedDifficultyFilter, selectedTypeFilter, selectedStatusFilter])

  // Use tracks from program detail if available, otherwise use tracks endpoint
  const availableTracks = useMemo(() => {
    if (!selectedProgramId) return []
    
    // Prefer tracks from program detail
    if (selectedProgramDetail?.tracks && Array.isArray(selectedProgramDetail.tracks) && selectedProgramDetail.tracks.length > 0) {
      return selectedProgramDetail.tracks
    }
    
    return tracks
  }, [selectedProgramId, selectedProgramDetail, tracks])

  const loadMissions = async () => {
    setIsLoading(true)
    try {
      const params: any = {
        page: currentPage,
        page_size: ITEMS_PER_PAGE,
      }

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim()
      }

      if (selectedProgramId && selectedProgramId !== '') {
        params.program_id = selectedProgramId
      }

      if (selectedTrackFilter !== 'all') {
        // Track filter select stores track.id
        params.track_id = selectedTrackFilter
      }

      if (selectedDifficultyFilter !== 'all') {
        params.difficulty = selectedDifficultyFilter
      }

      if (selectedTypeFilter !== 'all') {
        params.type = selectedTypeFilter
      }

      if (selectedStatusFilter !== 'all') {
        params.status = selectedStatusFilter
      }

      const response = await missionsClient.getAllMissions(params)
      console.log('✅ Missions loaded:', {
        count: response.results?.length || 0,
        total: response.count || 0,
        page: currentPage,
        hasNext: !!response.next,
        hasPrevious: !!response.previous,
      })
      
      setMissions(response.results || [])
      setTotalCount(response.count || 0)
    } catch (error: any) {
      console.error('❌ Failed to load missions:', error)
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to load missions'
      console.error('Error details:', errorMessage)
      setMissions([])
      setTotalCount(0)
      // Optionally show error to user
      // alert(`Failed to load missions: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateMission = () => {
    setEditingMission(null)
    const now = new Date().toISOString()
    setMissionYAMLForm({
      mission_meta: {
        id: '',
        version: '1.0.0',
        status: 'draft',
        created_at: now,
        last_updated: now,
      },
      header: {
        title: '',
        slug: '',
        difficulty: 'Intermediate',
        tier: 2,
        estimated_duration: '',
        track: '',
      },
      narrative: {
        context_location: '',
        scenario: '',
        role: '',
      },
      subtasks: [],
      framework_mappings: {
        mitre_attack: [],
        nice_workrole: [],
        nist_csf: [],
        iso_27001: [],
        pci_dss: [],
        owasp_asvs: [],
        cis_controls: [],
      },
      deliverables: [],
      scoring: {
        ai_evaluation: {
          enabled: true,
          focus: [],
        },
        mentor_review: {
          enabled: false,
          tier_required: 'Paid ($7)',
          rubric_focus: [],
        },
        skills_update: [],
      },
    })
    setMissionForm({
      code: '',
      title: '',
      description: '',
      difficulty: 'beginner',
      type: 'lab',
      track_id: selectedTrackFilter !== 'all' ? selectedTrackFilter : '',
      track_key: '',
      est_hours: undefined,
      estimated_time_minutes: undefined,
      competencies: [],
      requirements: {},
      status: 'draft',
      assessment_mode: 'hybrid',
      requires_mentor_review: false,
      story_narrative: '',
      subtasks: [],
      evidence_upload_schema: {
        file_types: [],
        max_file_size_mb: 10,
        required_artifacts: [],
      },
      time_constraint_hours: undefined,
      competency_coverage: [],
    })
    setShowMissionForm(true)
  }

  const handleOpenMission = (missionId?: string) => {
    if (!missionId) return
    router.push(`/dashboard/director/curriculum/missions/${missionId}`)
  }

  const handleSaveMission = async () => {
    if (!missionForm.code || !missionForm.title) {
      alert('Mission code and title are required')
      return
    }

    // Validate competency coverage weights sum to 100
    if (missionForm.competency_coverage && missionForm.competency_coverage.length > 0) {
      const totalWeight = missionForm.competency_coverage.reduce((sum, cov) => sum + (cov.weight_percentage || 0), 0)
      if (Math.abs(totalWeight - 100) > 0.01) {
        alert(`Competency coverage weights must sum to 100%. Current total: ${totalWeight.toFixed(2)}%`)
        return
      }
    }

    setIsSaving(true)
    try {
      // Prepare mission data - store OCH Admin fields in requirements JSON
      const missionData: any = {
        code: missionForm.code.trim(),
        title: missionForm.title.trim(),
        description: missionForm.description || '',
        difficulty: missionForm.difficulty,
        type: missionForm.type,
        track_id: missionForm.track_id || null,
        track_key: missionForm.track_key || '',
        est_hours: missionForm.est_hours,
        estimated_time_minutes: missionForm.estimated_time_minutes,
        competencies: missionForm.competencies || [],
        // Store OCH Admin fields in requirements JSON
        requirements: {
          ...(missionForm.requirements || {}),
          status: missionForm.status || 'draft',
          assessment_mode: missionForm.assessment_mode || 'hybrid',
          requires_mentor_review: missionForm.requires_mentor_review ?? false,
          story_narrative: missionForm.story_narrative || '',
          subtasks: missionForm.subtasks || [],
          evidence_upload_schema: missionForm.evidence_upload_schema || {
            file_types: [],
            max_file_size_mb: 10,
            required_artifacts: [],
          },
          time_constraint_hours: missionForm.time_constraint_hours,
          competency_coverage: missionForm.competency_coverage || [],
          rubric_id: missionForm.rubric_id,
          module_id: missionForm.module_id,
        },
      }

      if (editingMission?.id) {
        await missionsClient.updateMission(editingMission.id, missionData)
      } else {
        await missionsClient.createMission(missionData)
      }
      setShowMissionForm(false)
      setEditingMission(null)
      // Clear filters that might exclude the newly created mission
      // Reset to first page and reload missions
      setCurrentPage(1)
      // Don't clear all filters, but ensure we can see the new mission
      // If we have track filter set, keep it; otherwise clear type/difficulty filters
      if (selectedTrackFilter === 'all') {
        setSelectedTypeFilter('all')
        setSelectedDifficultyFilter('all')
        setSelectedStatusFilter('all')
      }
      await loadMissions()
    } catch (error: any) {
      console.error('Failed to save mission:', error)
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.error || error?.message || 'Failed to save mission'
      alert(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteMission = async (missionId: string) => {
    if (!confirm('Are you sure you want to delete this mission? This action cannot be undone.')) {
      return
    }

    try {
      await missionsClient.deleteMission(missionId)
      // Reload missions - adjust page if needed
      const newTotalCount = totalCount - 1
      const newTotalPages = Math.ceil(newTotalCount / ITEMS_PER_PAGE)
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages)
      }
      await loadMissions()
    } catch (error: any) {
      console.error('Failed to delete mission:', error)
      alert(error?.response?.data?.detail || error?.message || 'Failed to delete mission')
    }
  }

  const handleAddCompetency = () => {
    setMissionForm({
      ...missionForm,
      competencies: [...(missionForm.competencies || []), ''],
    })
  }

  const handleRemoveCompetency = (index: number) => {
    const newCompetencies = [...(missionForm.competencies || [])]
    newCompetencies.splice(index, 1)
    setMissionForm({
      ...missionForm,
      competencies: newCompetencies,
    })
  }

  const handleCompetencyChange = (index: number, value: string) => {
    const newCompetencies = [...(missionForm.competencies || [])]
    newCompetencies[index] = value
    setMissionForm({
      ...missionForm,
      competencies: newCompetencies,
    })
  }
  
  // YAML Form helpers
  const handleAddSubtask = () => {
    const newOrder = missionYAMLForm.subtasks.length > 0 
      ? Math.max(...missionYAMLForm.subtasks.map(s => s.order)) + 1 
      : 1
    setMissionYAMLForm({
      ...missionYAMLForm,
      subtasks: [
        ...missionYAMLForm.subtasks,
        { id: missionYAMLForm.subtasks.length + 1, title: '', description: '', order: newOrder, type: 'technical' }
      ],
    })
  }
  
  const handleRemoveSubtask = (index: number) => {
    const newSubtasks = [...missionYAMLForm.subtasks]
    newSubtasks.splice(index, 1)
    setMissionYAMLForm({ ...missionYAMLForm, subtasks: newSubtasks })
  }
  
  const handleUpdateSubtask = (index: number, field: string, value: any) => {
    const newSubtasks = [...missionYAMLForm.subtasks]
    newSubtasks[index] = { ...newSubtasks[index], [field]: value }
    setMissionYAMLForm({ ...missionYAMLForm, subtasks: newSubtasks })
  }
  
  const handleAddDeliverable = () => {
    setMissionYAMLForm({
      ...missionYAMLForm,
      deliverables: [
        ...missionYAMLForm.deliverables,
        { id: `del_${String(missionYAMLForm.deliverables.length + 1).padStart(2, '0')}`, title: '', format: '', description: '' }
      ],
    })
  }
  
  const handleRemoveDeliverable = (index: number) => {
    const newDeliverables = [...missionYAMLForm.deliverables]
    newDeliverables.splice(index, 1)
    setMissionYAMLForm({ ...missionYAMLForm, deliverables: newDeliverables })
  }
  
  const handleUpdateDeliverable = (index: number, field: string, value: string) => {
    const newDeliverables = [...missionYAMLForm.deliverables]
    newDeliverables[index] = { ...newDeliverables[index], [field]: value }
    setMissionYAMLForm({ ...missionYAMLForm, deliverables: newDeliverables })
  }
  
  const handleAddFrameworkMapping = (framework: keyof MissionYAMLForm['framework_mappings'], item: any) => {
    setMissionYAMLForm({
      ...missionYAMLForm,
      framework_mappings: {
        ...missionYAMLForm.framework_mappings,
        [framework]: [...missionYAMLForm.framework_mappings[framework], item],
      },
    })
  }
  
  const handleRemoveFrameworkMapping = (framework: keyof MissionYAMLForm['framework_mappings'], index: number) => {
    const newMappings = [...missionYAMLForm.framework_mappings[framework]]
    newMappings.splice(index, 1)
    setMissionYAMLForm({
      ...missionYAMLForm,
      framework_mappings: {
        ...missionYAMLForm.framework_mappings,
        [framework]: newMappings,
      },
    })
  }
  
  const handleAddSkillUpdate = () => {
    setMissionYAMLForm({
      ...missionYAMLForm,
      scoring: {
        ...missionYAMLForm.scoring,
        skills_update: [
          ...missionYAMLForm.scoring.skills_update,
          { skill: '', impact: 'medium' as const },
        ],
      },
    })
  }
  
  const handleRemoveSkillUpdate = (index: number) => {
    const newSkills = [...missionYAMLForm.scoring.skills_update]
    newSkills.splice(index, 1)
    setMissionYAMLForm({
      ...missionYAMLForm,
      scoring: {
        ...missionYAMLForm.scoring,
        skills_update: newSkills,
      },
    })
  }
  
  const handleUpdateSkillUpdate = (index: number, field: string, value: any) => {
    const newSkills = [...missionYAMLForm.scoring.skills_update]
    newSkills[index] = { ...newSkills[index], [field]: value }
    setMissionYAMLForm({
      ...missionYAMLForm,
      scoring: {
        ...missionYAMLForm.scoring,
        skills_update: newSkills,
      },
    })
  }
  
  // Sync title to slug when title changes (only if slug is empty)
  useEffect(() => {
    if (missionYAMLForm.header.title && !missionYAMLForm.header.slug) {
      setMissionYAMLForm(prev => ({
        ...prev,
        header: {
          ...prev.header,
          slug: generateSlug(prev.header.title),
        },
      }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionYAMLForm.header.title])

  const handleTrackChange = (trackId: string) => {
    const track = availableTracks.find(t => String(t.id) === trackId)
    setMissionForm({
      ...missionForm,
      track_id: trackId,
      track_key: track?.key || '',
    })
    setMissionYAMLForm({
      ...missionYAMLForm,
      header: {
        ...missionYAMLForm.header,
        track: track?.name || '',
      },
    })
  }
  
  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  
  // Generate YAML file from form data
  const generateYAML = (): string => {
    const yamlData = {
      mission_meta: {
        id: missionYAMLForm.mission_meta.id || missionYAMLForm.header.title.split(' ').join('-').toUpperCase() || 'MISSION-001',
        version: missionYAMLForm.mission_meta.version,
        status: missionYAMLForm.mission_meta.status,
        created_at: missionYAMLForm.mission_meta.created_at,
        last_updated: new Date().toISOString(),
      },
      header: {
        title: missionYAMLForm.header.title,
        slug: missionYAMLForm.header.slug || generateSlug(missionYAMLForm.header.title),
        difficulty: missionYAMLForm.header.difficulty,
        tier: missionYAMLForm.header.tier,
        estimated_duration: missionYAMLForm.header.estimated_duration,
        track: missionYAMLForm.header.track,
      },
      narrative: {
        context_location: missionYAMLForm.narrative.context_location,
        scenario: missionYAMLForm.narrative.scenario,
        role: missionYAMLForm.narrative.role,
      },
      subtasks: missionYAMLForm.subtasks.sort((a, b) => a.order - b.order),
      framework_mappings: {
        mitre_attack: missionYAMLForm.framework_mappings.mitre_attack,
        nice_workrole: missionYAMLForm.framework_mappings.nice_workrole,
        nist_csf: missionYAMLForm.framework_mappings.nist_csf,
        iso_27001: missionYAMLForm.framework_mappings.iso_27001,
        pci_dss: missionYAMLForm.framework_mappings.pci_dss,
        owasp_asvs: missionYAMLForm.framework_mappings.owasp_asvs,
        cis_controls: missionYAMLForm.framework_mappings.cis_controls,
      },
      deliverables: missionYAMLForm.deliverables,
      scoring: missionYAMLForm.scoring,
    }
    
    return yaml.dump(yamlData, {
      indent: 2,
      lineWidth: 120,
      quotingType: '"',
      forceQuotes: false,
      noRefs: true,
    })
  }
  
  // Convert YAML form data to MissionTemplate format for backend
  const convertYAMLToMissionTemplate = (yamlData: MissionYAMLForm): Partial<MissionTemplate> => {
    // Map difficulty from YAML format to backend format
    const difficultyMap: Record<string, 'beginner' | 'intermediate' | 'advanced' | 'capstone'> = {
      'Beginner': 'beginner',
      'Intermediate': 'intermediate',
      'Advanced': 'advanced',
      'Expert': 'advanced', // Expert maps to advanced for backend
    }
    
    // Find track by name if available
    const track = availableTracks.find(t => t.name === yamlData.header.track)
    
    // Extract competencies from framework mappings and skills
    const competencies: string[] = []
    if (yamlData.framework_mappings.nice_workrole.length > 0) {
      yamlData.framework_mappings.nice_workrole.forEach(item => {
        if (item.name && !competencies.includes(item.name)) {
          competencies.push(item.name)
        }
      })
    }
    yamlData.scoring.skills_update.forEach(skill => {
      if (skill.skill && !competencies.includes(skill.skill)) {
        competencies.push(skill.skill)
      }
    })
    
    // Parse estimated_duration (e.g., "24h - 7d" or "24h")
    let est_hours: number | undefined
    let estimated_time_minutes: number | undefined
    const durationMatch = yamlData.header.estimated_duration.match(/(\d+)h/)
    if (durationMatch) {
      est_hours = parseInt(durationMatch[1])
    }
    
    // Convert subtasks to backend format
    const subtasks = yamlData.subtasks.map(st => ({
      id: String(st.id),
      title: st.title,
      description: st.description,
      order: st.order,
      required: true,
      dependencies: [],
    }))
    
    // Convert deliverables to evidence_upload_schema
    const file_types = yamlData.deliverables
      .map(d => d.format.split('/').pop())
      .filter((ft): ft is string => !!ft)
      .filter((ft, idx, arr) => arr.indexOf(ft) === idx) // unique
    
    // Build requirements object with all YAML data and extra fields
    const requirements: Record<string, any> = {
      status: yamlData.mission_meta.status === 'active' ? 'published' : yamlData.mission_meta.status === 'archived' ? 'retired' : 'draft',
      assessment_mode: yamlData.scoring.mentor_review.enabled ? 'hybrid' : (yamlData.scoring.ai_evaluation.enabled ? 'auto' : 'manual'),
      requires_mentor_review: yamlData.scoring.mentor_review.enabled,
      story_narrative: yamlData.narrative.scenario,
      subtasks: subtasks,
      evidence_upload_schema: {
        file_types: file_types.length > 0 ? file_types : [],
        max_file_size_mb: 10,
        required_artifacts: yamlData.deliverables.map(d => ({
          type: 'file' as const,
          required: true,
          description: d.description,
        })),
      },
      // Store full YAML structure
      yaml_structure: yamlData,
      framework_mappings: yamlData.framework_mappings,
      deliverables: yamlData.deliverables,
      scoring: yamlData.scoring,
      tier: yamlData.header.tier,
      context_location: yamlData.narrative.context_location,
      role: yamlData.narrative.role,
    }
    
    // Build mission data object, removing undefined values
    const missionData: Record<string, any> = {
      code: yamlData.mission_meta.id || yamlData.header.slug.toUpperCase().replace(/-/g, '-'),
      title: yamlData.header.title,
      description: yamlData.narrative.scenario || '',
      difficulty: difficultyMap[yamlData.header.difficulty] || 'intermediate',
      type: 'scenario', // Default to scenario, could be inferred from other fields
      requirements: requirements,
    }
    
    // Only add optional fields if they have values
    if (track?.id) {
      missionData.track_id = String(track.id)
    }
    if (track?.key) {
      missionData.track_key = track.key
    }
    if (est_hours !== undefined) {
      missionData.est_hours = est_hours
    }
    if (estimated_time_minutes !== undefined) {
      missionData.estimated_time_minutes = estimated_time_minutes
    }
    if (competencies.length > 0) {
      missionData.competencies = competencies
    }
    
    return missionData
  }
  
  // Download YAML file and save to backend
  const handleDownloadYAML = async () => {
    try {
      if (!missionYAMLForm.header.title || !missionYAMLForm.mission_meta.id) {
        alert('Please fill in required fields: Title and Mission ID')
        return
      }
      
      setIsSaving(true)
      
      // Convert YAML form to MissionTemplate format
      const missionData = convertYAMLToMissionTemplate(missionYAMLForm)
      
      // Save to backend
      try {
        await missionsClient.createMission(missionData)
        console.log('✅ Mission saved to backend')
        
        // Reload missions list
        await loadMissions()
      } catch (saveError: any) {
        console.error('Failed to save mission:', saveError)
        const errorMessage = saveError?.response?.data?.detail || saveError?.response?.data?.error || saveError?.message || 'Failed to save mission'
        alert(`Failed to save mission to backend: ${errorMessage}`)
        throw saveError
      }
      
      // Generate and download YAML
      const yamlContent = generateYAML()
      const blob = new Blob([yamlContent], { type: 'text/yaml' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const filename = missionYAMLForm.header.slug || generateSlug(missionYAMLForm.header.title) || 'mission'
      a.download = `${filename}.yaml`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      // Close form and reset
      setShowMissionForm(false)
      setEditingMission(null)
      
      alert('Mission created and YAML file downloaded successfully!')
    } catch (error: any) {
      console.error('Failed to generate/save YAML:', error)
      if (!error?.response) {
        alert('Failed to generate YAML file. Please check the form data.')
      }
    } finally {
      setIsSaving(false)
    }
  }
  
  // Parse YAML file and populate form
  const handleYAMLUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    if (!file.name.endsWith('.yaml') && !file.name.endsWith('.yml')) {
      alert('Please upload a YAML file (.yaml or .yml)')
      return
    }
    
    try {
      const fileContent = await file.text()
      const parsedYAML = yaml.load(fileContent) as any
      
      if (!parsedYAML.mission_meta || !parsedYAML.header || !parsedYAML.narrative) {
        alert('Invalid YAML structure. Please ensure the file follows the mission YAML format.')
        return
      }
      
      // Create the mission YAML form structure
      const loadedYAMLForm: MissionYAMLForm = {
        mission_meta: {
          id: parsedYAML.mission_meta.id || '',
          version: parsedYAML.mission_meta.version || '1.0.0',
          status: parsedYAML.mission_meta.status || 'draft',
          created_at: parsedYAML.mission_meta.created_at || new Date().toISOString(),
          last_updated: parsedYAML.mission_meta.last_updated || new Date().toISOString(),
        },
        header: {
          title: parsedYAML.header.title || '',
          slug: parsedYAML.header.slug || '',
          difficulty: parsedYAML.header.difficulty || 'Intermediate',
          tier: parsedYAML.header.tier || 2,
          estimated_duration: parsedYAML.header.estimated_duration || '',
          track: parsedYAML.header.track || '',
        },
        narrative: {
          context_location: parsedYAML.narrative.context_location || '',
          scenario: parsedYAML.narrative.scenario || '',
          role: parsedYAML.narrative.role || '',
        },
        subtasks: parsedYAML.subtasks || [],
        framework_mappings: {
          mitre_attack: parsedYAML.framework_mappings?.mitre_attack || [],
          nice_workrole: parsedYAML.framework_mappings?.nice_workrole || [],
          nist_csf: parsedYAML.framework_mappings?.nist_csf || [],
          iso_27001: parsedYAML.framework_mappings?.iso_27001 || [],
          pci_dss: parsedYAML.framework_mappings?.pci_dss || [],
          owasp_asvs: parsedYAML.framework_mappings?.owasp_asvs || [],
          cis_controls: parsedYAML.framework_mappings?.cis_controls || [],
        },
        deliverables: parsedYAML.deliverables || [],
        scoring: {
          ai_evaluation: parsedYAML.scoring?.ai_evaluation || { enabled: true, focus: [] },
          mentor_review: parsedYAML.scoring?.mentor_review || { enabled: false, tier_required: 'Paid ($7)', rubric_focus: [] },
          skills_update: parsedYAML.scoring?.skills_update || [],
        },
      }
      
      // Convert to MissionTemplate and save to backend
      setIsSaving(true)
      try {
        const missionData = convertYAMLToMissionTemplate(loadedYAMLForm)
        await missionsClient.createMission(missionData)
        console.log('✅ Mission created from YAML file')
        
        // Reload missions list
        await loadMissions()
        
        alert('Mission created successfully from YAML file!')
      } catch (saveError: any) {
        console.error('Failed to create mission from YAML:', saveError)
        const errorMessage = saveError?.response?.data?.detail || saveError?.response?.data?.error || saveError?.message || 'Failed to create mission'
        alert(`Failed to create mission: ${errorMessage}`)
      } finally {
        setIsSaving(false)
      }
    } catch (error: any) {
      console.error('Failed to parse YAML:', error)
      alert(`Failed to parse YAML file: ${error.message || 'Invalid YAML format'}`)
    } finally {
      // Reset file input
      event.target.value = ''
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'mint'
      case 'intermediate': return 'gold'
      case 'advanced': return 'orange'
      case 'capstone': return 'defender'
      default: return 'steel'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lab': return 'mint'
      case 'scenario': return 'defender'
      case 'project': return 'gold'
      case 'capstone': return 'orange'
      default: return 'steel'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'steel'
      case 'approved': return 'gold'
      case 'published': return 'mint'
      case 'retired': return 'orange'
      default: return 'steel'
    }
  }

  const getMissionStatus = (mission: MissionTemplate): string => {
    return mission.status || mission.requirements?.status || 'draft'
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-och-gold flex items-center gap-3">
                  <RocketIcon />
                  Missions Management
                </h1>
                <p className="text-och-steel">
                  Publish and manage missions, link to tracks, configure competencies and assessment mechanics
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/dashboard/director/curriculum/registry">
                  <Button variant="outline">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Competency Registry
                  </Button>
                </Link>
                <input
                  id="yaml-upload"
                  type="file"
                  accept=".yaml,.yml"
                  onChange={handleYAMLUpload}
                  className="hidden"
                  disabled={showMissionForm}
                />
                <Button 
                  variant="outline" 
                  disabled={showMissionForm}
                  onClick={() => {
                    if (!showMissionForm) {
                      document.getElementById('yaml-upload')?.click()
                    }
                  }}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload YAML
                </Button>
                <Button variant="defender" onClick={handleCreateMission} disabled={showMissionForm}>
                  <PlusIcon />
                  <span className="ml-2">Create Mission</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <FilterIcon />
                <h2 className="text-lg font-semibold text-white">Filters</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                {/* Search */}
                <div className="lg:col-span-2 relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-och-steel">
                    <SearchIcon />
                  </div>
                  <input
                    type="text"
                    placeholder="Search missions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                  />
                </div>

                {/* Program Filter */}
                <select
                  value={selectedProgramId}
                  onChange={(e) => {
                    setSelectedProgramId(e.target.value)
                    setSelectedTrackFilter('all')
                    setCurrentPage(1)
                  }}
                  className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                >
                  <option value="">All Programs</option>
                  {programs.map((program) => (
                    <option key={program.id} value={String(program.id)}>
                      {program.name}
                    </option>
                  ))}
                </select>

                {/* Track Filter */}
                <select
                  value={selectedTrackFilter}
                  onChange={(e) => {
                    setSelectedTrackFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                  disabled={!selectedProgramId}
                >
                  <option value="all">All Tracks</option>
                  {availableTracks.map((track) => (
                    <option key={track.id} value={String(track.id)}>
                      {track.name}
                    </option>
                  ))}
                </select>

                {/* Difficulty Filter */}
                <select
                  value={selectedDifficultyFilter}
                  onChange={(e) => {
                    setSelectedDifficultyFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                >
                  <option value="all">All Difficulties</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="capstone">Capstone</option>
                </select>

                {/* Type Filter */}
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => {
                    setSelectedTypeFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                >
                  <option value="all">All Types</option>
                  <option value="lab">Lab</option>
                  <option value="scenario">Scenario</option>
                  <option value="project">Project</option>
                  <option value="capstone">Capstone</option>
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => {
                    setSelectedStatusFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Missions List */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-och-steel">
                    Showing <span className="text-white font-semibold">{missions.length}</span> of{' '}
                    <span className="text-white font-semibold">{totalCount}</span> missions
                    {totalPages > 1 && (
                      <span className="text-och-steel"> (Page {currentPage} of {totalPages})</span>
                    )}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadMissions()}
                  disabled={isLoading}
                  title="Refresh missions list"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="ml-2">Refresh</span>
                </Button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
                    <p className="text-och-steel">Loading missions...</p>
                  </div>
                </div>
              ) : missions.length === 0 ? (
                <div className="text-center py-12">
                  <RocketIcon />
                  <p className="text-och-steel text-lg mt-4 mb-2">No missions found</p>
                  <p className="text-och-steel text-sm mb-4">
                    {debouncedSearch || selectedTrackFilter !== 'all' || selectedDifficultyFilter !== 'all' || selectedTypeFilter !== 'all' || selectedStatusFilter !== 'all' 
                      ? 'No missions match your current filters. Try adjusting your filters or create a new mission.' 
                      : 'Create your first mission to get started'}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    {(debouncedSearch || selectedTrackFilter !== 'all' || selectedDifficultyFilter !== 'all' || selectedTypeFilter !== 'all' || selectedStatusFilter !== 'all') && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchQuery('')
                          setSelectedTrackFilter('all')
                          setSelectedDifficultyFilter('all')
                          setSelectedTypeFilter('all')
                          setSelectedStatusFilter('all')
                          setCurrentPage(1)
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                    <Button variant="defender" onClick={handleCreateMission}>
                      <PlusIcon />
                      <span className="ml-2">Create Mission</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="hidden md:grid grid-cols-12 gap-3 text-xs uppercase tracking-wide text-och-steel pb-3 border-b border-och-steel/20">
                      <div className="col-span-5">Mission</div>
                      <div className="col-span-3">Track / Tags</div>
                      <div className="col-span-2">Est.</div>
                      <div className="col-span-2 text-right">Actions</div>
                    </div>

                    <div className="divide-y divide-och-steel/10">
                      {missions.map((mission) => {
                        const track = availableTracks.find(
                          (t) => String(t.id) === String(mission.track_id) || t.key === mission.track_key
                        )
                        const trackLabel =
                          mission.track_name ||
                          track?.name ||
                          mission.track_key ||
                          (mission.track_id ? String(mission.track_id) : '')
                        const programLabel = mission.program_name || (track as any)?.program_name || ''
                        const missionStatus = getMissionStatus(mission)

                        return (
                          <div
                            key={mission.id}
                            onClick={() => handleOpenMission(mission.id)}
                            className="py-4 cursor-pointer hover:bg-och-midnight/30 transition-colors"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                              <div className="md:col-span-5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="text-white font-semibold">{mission.code}</div>
                                  <Badge variant={getStatusColor(missionStatus)}>{missionStatus}</Badge>
                                  <Badge variant={getDifficultyColor(mission.difficulty)}>{mission.difficulty}</Badge>
                                  <Badge variant={getTypeColor(mission.type)}>{mission.type}</Badge>
                                  {mission.requirements?.requires_mentor_review && (
                                    <Badge variant="gold">Mentor Review</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-white mt-1 font-medium">{mission.title}</div>
                                <div className="text-xs text-och-steel mt-1 line-clamp-2">
                                  {mission.description || 'No description'}
                                </div>
                              </div>

                              <div className="md:col-span-3">
                                <div className="text-sm text-white">{trackLabel ? trackLabel : 'Unassigned'}</div>
                                {programLabel && (
                                  <div className="text-xs text-och-steel mt-0.5">{programLabel}</div>
                                )}
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {(mission.competencies || []).slice(0, 3).map((c, idx) => (
                                    <Badge key={idx} variant="steel" className="text-xs">
                                      {c}
                                    </Badge>
                                  ))}
                                  {(mission.competencies || []).length > 3 && (
                                    <Badge variant="steel" className="text-xs">
                                      +{(mission.competencies || []).length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="md:col-span-2 text-sm text-white">
                                <div>
                                  {mission.est_hours ? `${mission.est_hours}h` : '—'} /{' '}
                                  {mission.estimated_time_minutes ? `${mission.estimated_time_minutes}m` : '—'}
                                </div>
                                <div className="text-xs text-och-steel mt-1">
                                  Created {mission.created_at ? new Date(mission.created_at).toLocaleDateString() : 'N/A'}
                                </div>
                              </div>

                              <div className="md:col-span-2 flex gap-2 md:justify-end" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="defender"
                                  size="sm"
                                  onClick={() => handleOpenMission(mission.id)}
                                >
                                  Manage & Analytics
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-och-steel">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={!hasPrevPage || isLoading}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                              pageNum = i + 1
                            } else if (currentPage <= 3) {
                              pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i
                            } else {
                              pageNum = currentPage - 2 + i
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? 'defender' : 'outline'}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                disabled={isLoading}
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={!hasNextPage || isLoading}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Mission Form Modal */}
          {showMissionForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-5xl w-full max-h-[95vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    {editingMission ? 'Edit Mission' : 'Create Mission (YAML Structure)'}
                  </h2>

                  <div className="space-y-6">
                    {/* mission_meta Section */}
                    <div className="border border-och-steel/30 rounded-lg p-4 bg-och-midnight/30">
                      <h3 className="text-lg font-semibold text-white mb-4">mission_meta</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">ID *</label>
                          <input
                            type="text"
                            value={missionYAMLForm.mission_meta.id}
                            onChange={(e) => setMissionYAMLForm({
                              ...missionYAMLForm,
                              mission_meta: { ...missionYAMLForm.mission_meta, id: e.target.value }
                            })}
                            placeholder="e.g., ACM-M01"
                            className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Version *</label>
                          <input
                            type="text"
                            value={missionYAMLForm.mission_meta.version}
                            onChange={(e) => setMissionYAMLForm({
                              ...missionYAMLForm,
                              mission_meta: { ...missionYAMLForm.mission_meta, version: e.target.value }
                            })}
                            placeholder="1.0.0"
                            className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Status *</label>
                          <select
                            value={missionYAMLForm.mission_meta.status}
                            onChange={(e) => setMissionYAMLForm({
                              ...missionYAMLForm,
                              mission_meta: { ...missionYAMLForm.mission_meta, status: e.target.value as 'draft' | 'active' | 'archived' }
                            })}
                            className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                            required
                          >
                            <option value="draft">draft</option>
                            <option value="active">active</option>
                            <option value="archived">archived</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* header Section */}
                    <div className="border border-och-steel/30 rounded-lg p-4 bg-och-midnight/30">
                      <h3 className="text-lg font-semibold text-white mb-4">header</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">Title *</label>
                            <input
                              type="text"
                              value={missionYAMLForm.header.title}
                              onChange={(e) => setMissionYAMLForm({
                                ...missionYAMLForm,
                                header: { ...missionYAMLForm.header, title: e.target.value }
                              })}
                              placeholder="Ransomware Crisis Response"
                              className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">Slug *</label>
                            <input
                              type="text"
                              value={missionYAMLForm.header.slug}
                              onChange={(e) => setMissionYAMLForm({
                                ...missionYAMLForm,
                                header: { ...missionYAMLForm.header, slug: e.target.value }
                              })}
                              placeholder="ransomware-crisis-response"
                              className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">Difficulty *</label>
                            <select
                              value={missionYAMLForm.header.difficulty}
                              onChange={(e) => setMissionYAMLForm({
                                ...missionYAMLForm,
                                header: { ...missionYAMLForm.header, difficulty: e.target.value as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' }
                              })}
                              className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                              required
                            >
                              <option value="Beginner">Beginner</option>
                              <option value="Intermediate">Intermediate</option>
                              <option value="Advanced">Advanced</option>
                              <option value="Expert">Expert</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">Tier *</label>
                            <select
                              value={missionYAMLForm.header.tier}
                              onChange={(e) => setMissionYAMLForm({
                                ...missionYAMLForm,
                                header: { ...missionYAMLForm.header, tier: parseInt(e.target.value) as 2 | 3 }
                              })}
                              className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                              required
                            >
                              <option value="2">2</option>
                              <option value="3">3</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">Estimated Duration *</label>
                            <input
                              type="text"
                              value={missionYAMLForm.header.estimated_duration}
                              onChange={(e) => setMissionYAMLForm({
                                ...missionYAMLForm,
                                header: { ...missionYAMLForm.header, estimated_duration: e.target.value }
                              })}
                              placeholder="24h - 7d"
                              className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">Track *</label>
                            {selectedProgramId ? (
                              <select
                                value={missionYAMLForm.header.track}
                                onChange={(e) => {
                                  const track = availableTracks.find(t => t.name === e.target.value)
                                  setMissionYAMLForm({
                                    ...missionYAMLForm,
                                    header: { ...missionYAMLForm.header, track: e.target.value }
                                  })
                                  if (track) {
                                    setMissionForm({
                                      ...missionForm,
                                      track_id: String(track.id),
                                      track_key: track.key || '',
                                    })
                                  }
                                }}
                                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                                required
                              >
                                <option value="">Select Track</option>
                                {availableTracks.map((track) => (
                                  <option key={track.id} value={track.name}>
                                    {track.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={missionYAMLForm.header.track}
                                onChange={(e) => setMissionYAMLForm({
                                  ...missionYAMLForm,
                                  header: { ...missionYAMLForm.header, track: e.target.value }
                                })}
                                placeholder="Blue Team / Defense"
                                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                                required
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* narrative Section */}
                    <div className="border border-och-steel/30 rounded-lg p-4 bg-och-midnight/30">
                      <h3 className="text-lg font-semibold text-white mb-4">narrative</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Context Location *</label>
                          <input
                            type="text"
                            value={missionYAMLForm.narrative.context_location}
                            onChange={(e) => setMissionYAMLForm({
                              ...missionYAMLForm,
                              narrative: { ...missionYAMLForm.narrative, context_location: e.target.value }
                            })}
                            placeholder="Ransomware Tower, OCH Cyber-City"
                            className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Scenario *</label>
                          <textarea
                            value={missionYAMLForm.narrative.scenario}
                            onChange={(e) => setMissionYAMLForm({
                              ...missionYAMLForm,
                              narrative: { ...missionYAMLForm.narrative, scenario: e.target.value }
                            })}
                            placeholder="A high-stakes attack on a critical sector..."
                            className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                            rows={4}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Role *</label>
                          <input
                            type="text"
                            value={missionYAMLForm.narrative.role}
                            onChange={(e) => setMissionYAMLForm({
                              ...missionYAMLForm,
                              narrative: { ...missionYAMLForm.narrative, role: e.target.value }
                            })}
                            placeholder="Lead SOC Analyst"
                            className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* subtasks Section */}
                    <div className="border border-och-steel/30 rounded-lg p-4 bg-och-midnight/30">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">subtasks</h3>
                        <Button variant="outline" size="sm" onClick={handleAddSubtask}>
                          <PlusIcon />
                          <span className="ml-1">Add Subtask</span>
                        </Button>
                      </div>
                      <div className="space-y-4">
                        {missionYAMLForm.subtasks.map((subtask, index) => (
                          <div key={index} className="p-3 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                              <div>
                                <label className="block text-xs font-medium text-och-steel mb-1">ID</label>
                                <input
                                  type="number"
                                  value={subtask.id}
                                  onChange={(e) => handleUpdateSubtask(index, 'id', parseInt(e.target.value))}
                                  className="w-full px-3 py-1.5 bg-och-midnight border border-och-steel/20 rounded text-white text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-och-steel mb-1">Order</label>
                                <input
                                  type="number"
                                  value={subtask.order}
                                  onChange={(e) => handleUpdateSubtask(index, 'order', parseInt(e.target.value))}
                                  className="w-full px-3 py-1.5 bg-och-midnight border border-och-steel/20 rounded text-white text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-och-steel mb-1">Type</label>
                                <select
                                  value={subtask.type}
                                  onChange={(e) => handleUpdateSubtask(index, 'type', e.target.value)}
                                  className="w-full px-3 py-1.5 bg-och-midnight border border-och-steel/20 rounded text-white text-sm"
                                >
                                  <option value="technical">technical</option>
                                  <option value="forensic">forensic</option>
                                  <option value="communication">communication</option>
                                  <option value="analysis">analysis</option>
                                  <option value="other">other</option>
                                </select>
                              </div>
                              <div className="flex items-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveSubtask(index)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <TrashIcon />
                                </Button>
                              </div>
                            </div>
                            <div className="mb-3">
                              <label className="block text-xs font-medium text-och-steel mb-1">Title</label>
                              <input
                                type="text"
                                value={subtask.title}
                                onChange={(e) => handleUpdateSubtask(index, 'title', e.target.value)}
                                placeholder="Initial Triage"
                                className="w-full px-3 py-1.5 bg-och-midnight border border-och-steel/20 rounded text-white text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-och-steel mb-1">Description</label>
                              <textarea
                                value={subtask.description}
                                onChange={(e) => handleUpdateSubtask(index, 'description', e.target.value)}
                                placeholder="Perform log analysis and identify..."
                                className="w-full px-3 py-1.5 bg-och-midnight border border-och-steel/20 rounded text-white text-sm"
                                rows={2}
                              />
                            </div>
                          </div>
                        ))}
                        {missionYAMLForm.subtasks.length === 0 && (
                          <p className="text-sm text-och-steel text-center py-4">No subtasks added. Click "Add Subtask" to add one.</p>
                        )}
                      </div>
                    </div>

                    {/* framework_mappings Section */}
                    <div className="border border-och-steel/30 rounded-lg p-4 bg-och-midnight/30">
                      <h3 className="text-lg font-semibold text-white mb-4">framework_mappings</h3>
                      <div className="space-y-4">
                        {/* MITRE ATT&CK */}
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">MITRE ATT&CK</label>
                          <div className="space-y-2">
                            {missionYAMLForm.framework_mappings.mitre_attack.map((item, index) => (
                              <div key={index} className="flex gap-2">
                                <input
                                  type="text"
                                  value={item.code}
                                  onChange={(e) => {
                                    const newItems = [...missionYAMLForm.framework_mappings.mitre_attack]
                                    newItems[index] = { ...newItems[index], code: e.target.value }
                                    setMissionYAMLForm({
                                      ...missionYAMLForm,
                                      framework_mappings: { ...missionYAMLForm.framework_mappings, mitre_attack: newItems }
                                    })
                                  }}
                                  placeholder="T1486"
                                  className="flex-1 px-3 py-1.5 bg-och-midnight border border-och-steel/20 rounded text-white text-sm"
                                />
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => {
                                    const newItems = [...missionYAMLForm.framework_mappings.mitre_attack]
                                    newItems[index] = { ...newItems[index], name: e.target.value }
                                    setMissionYAMLForm({
                                      ...missionYAMLForm,
                                      framework_mappings: { ...missionYAMLForm.framework_mappings, mitre_attack: newItems }
                                    })
                                  }}
                                  placeholder="Data Encrypted for Impact"
                                  className="flex-1 px-3 py-1.5 bg-och-midnight border border-och-steel/20 rounded text-white text-sm"
                                />
                                <Button variant="outline" size="sm" onClick={() => handleRemoveFrameworkMapping('mitre_attack', index)}>
                                  <TrashIcon />
                                </Button>
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => handleAddFrameworkMapping('mitre_attack', { code: '', name: '' })}>
                              <PlusIcon /> Add MITRE
                            </Button>
                          </div>
                        </div>

                        {/* NICE Work Role */}
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">NICE Work Role</label>
                          <div className="space-y-2">
                            {missionYAMLForm.framework_mappings.nice_workrole.map((item, index) => (
                              <div key={index} className="flex gap-2">
                                <input
                                  type="text"
                                  value={item.code}
                                  onChange={(e) => {
                                    const newItems = [...missionYAMLForm.framework_mappings.nice_workrole]
                                    newItems[index] = { ...newItems[index], code: e.target.value }
                                    setMissionYAMLForm({
                                      ...missionYAMLForm,
                                      framework_mappings: { ...missionYAMLForm.framework_mappings, nice_workrole: newItems }
                                    })
                                  }}
                                  placeholder="OM-ANA-001"
                                  className="flex-1 px-3 py-1.5 bg-och-midnight border border-och-steel/20 rounded text-white text-sm"
                                />
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => {
                                    const newItems = [...missionYAMLForm.framework_mappings.nice_workrole]
                                    newItems[index] = { ...newItems[index], name: e.target.value }
                                    setMissionYAMLForm({
                                      ...missionYAMLForm,
                                      framework_mappings: { ...missionYAMLForm.framework_mappings, nice_workrole: newItems }
                                    })
                                  }}
                                  placeholder="Cyber Defense Analyst"
                                  className="flex-1 px-3 py-1.5 bg-och-midnight border border-och-steel/20 rounded text-white text-sm"
                                />
                                <Button variant="outline" size="sm" onClick={() => handleRemoveFrameworkMapping('nice_workrole', index)}>
                                  <TrashIcon />
                                </Button>
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => handleAddFrameworkMapping('nice_workrole', { code: '', name: '' })}>
                              <PlusIcon /> Add NICE
                            </Button>
                          </div>
                        </div>

                        {/* NIST CSF */}
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">NIST CSF</label>
                          <div className="space-y-2">
                            {missionYAMLForm.framework_mappings.nist_csf.map((item, index) => (
                              <div key={index} className="flex gap-2">
                                <input
                                  type="text"
                                  value={item.function}
                                  onChange={(e) => {
                                    const newItems = [...missionYAMLForm.framework_mappings.nist_csf]
                                    newItems[index] = { function: e.target.value }
                                    setMissionYAMLForm({
                                      ...missionYAMLForm,
                                      framework_mappings: { ...missionYAMLForm.framework_mappings, nist_csf: newItems }
                                    })
                                  }}
                                  placeholder="RESPOND"
                                  className="flex-1 px-3 py-1.5 bg-och-midnight border border-och-steel/20 rounded text-white text-sm"
                                />
                                <Button variant="outline" size="sm" onClick={() => handleRemoveFrameworkMapping('nist_csf', index)}>
                                  <TrashIcon />
                                </Button>
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => handleAddFrameworkMapping('nist_csf', { function: '' })}>
                              <PlusIcon /> Add NIST CSF
                            </Button>
                          </div>
                        </div>

                        {/* ISO 27001, PCI DSS, OWASP ASVS, CIS Controls - similar pattern but abbreviated for space */}
                        <details className="border border-och-steel/20 rounded p-2">
                          <summary className="text-sm font-medium text-white cursor-pointer">Additional Frameworks (ISO 27001, PCI DSS, OWASP ASVS, CIS Controls)</summary>
                          <div className="mt-3 space-y-4">
                            {/* ISO 27001 */}
                            <div>
                              <label className="block text-xs font-medium text-och-steel mb-2">ISO 27001</label>
                              {missionYAMLForm.framework_mappings.iso_27001.map((item, index) => (
                                <div key={index} className="flex gap-2 mb-2">
                                  <input type="text" value={item.control} onChange={(e) => {
                                    const newItems = [...missionYAMLForm.framework_mappings.iso_27001]
                                    newItems[index] = { ...newItems[index], control: e.target.value }
                                    setMissionYAMLForm({
                                      ...missionYAMLForm,
                                      framework_mappings: { ...missionYAMLForm.framework_mappings, iso_27001: newItems }
                                    })
                                  }} placeholder="A.5.24" className="flex-1 px-2 py-1 bg-och-midnight border border-och-steel/20 rounded text-white text-xs" />
                                  <input type="text" value={item.name} onChange={(e) => {
                                    const newItems = [...missionYAMLForm.framework_mappings.iso_27001]
                                    newItems[index] = { ...newItems[index], name: e.target.value }
                                    setMissionYAMLForm({
                                      ...missionYAMLForm,
                                      framework_mappings: { ...missionYAMLForm.framework_mappings, iso_27001: newItems }
                                    })
                                  }} placeholder="Incident Management" className="flex-1 px-2 py-1 bg-och-midnight border border-och-steel/20 rounded text-white text-xs" />
                                  <Button variant="outline" size="sm" onClick={() => handleRemoveFrameworkMapping('iso_27001', index)}><TrashIcon /></Button>
                                </div>
                              ))}
                              <Button variant="outline" size="sm" onClick={() => handleAddFrameworkMapping('iso_27001', { control: '', name: '' })}>
                                <PlusIcon /> Add ISO 27001
                              </Button>
                            </div>
                            {/* PCI DSS, OWASP, CIS - similar abbreviated pattern */}
                          </div>
                        </details>
                      </div>
                    </div>

                    {/* deliverables Section */}
                    <div className="border border-och-steel/30 rounded-lg p-4 bg-och-midnight/30">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">deliverables</h3>
                        <Button variant="outline" size="sm" onClick={handleAddDeliverable}>
                          <PlusIcon />
                          <span className="ml-1">Add Deliverable</span>
                        </Button>
                      </div>
                      <div className="space-y-4">
                        {missionYAMLForm.deliverables.map((deliverable, index) => (
                          <div key={index} className="p-3 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-och-steel mb-1">ID</label>
                                <input
                                  type="text"
                                  value={deliverable.id}
                                  onChange={(e) => handleUpdateDeliverable(index, 'id', e.target.value)}
                                  className="w-full px-3 py-1.5 bg-och-midnight border border-och-steel/20 rounded text-white text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-och-steel mb-1">Title</label>
                                <input
                                  type="text"
                                  value={deliverable.title}
                                  onChange={(e) => handleUpdateDeliverable(index, 'title', e.target.value)}
                                  placeholder="Technical Logs"
                                  className="w-full px-3 py-1.5 bg-och-midnight border border-och-steel/20 rounded text-white text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-och-steel mb-1">Format</label>
                                <input
                                  type="text"
                                  value={deliverable.format}
                                  onChange={(e) => handleUpdateDeliverable(index, 'format', e.target.value)}
                                  placeholder="text/log"
                                  className="w-full px-3 py-1.5 bg-och-midnight border border-och-steel/20 rounded text-white text-sm"
                                />
                              </div>
                              <div className="flex items-end">
                                <Button variant="outline" size="sm" onClick={() => handleRemoveDeliverable(index)} className="text-red-400">
                                  <TrashIcon />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-3">
                              <label className="block text-xs font-medium text-och-steel mb-1">Description</label>
                              <textarea
                                value={deliverable.description}
                                onChange={(e) => handleUpdateDeliverable(index, 'description', e.target.value)}
                                placeholder="Sanitized logs showing..."
                                className="w-full px-3 py-1.5 bg-och-midnight border border-och-steel/20 rounded text-white text-sm"
                                rows={2}
                              />
                            </div>
                          </div>
                        ))}
                        {missionYAMLForm.deliverables.length === 0 && (
                          <p className="text-sm text-och-steel text-center py-4">No deliverables added. Click "Add Deliverable" to add one.</p>
                        )}
                      </div>
                    </div>

                    {/* scoring Section */}
                    <div className="border border-och-steel/30 rounded-lg p-4 bg-och-midnight/30">
                      <h3 className="text-lg font-semibold text-white mb-4">scoring</h3>
                      <div className="space-y-4">
                        {/* AI Evaluation */}
                        <div>
                          <label className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              checked={missionYAMLForm.scoring.ai_evaluation.enabled}
                              onChange={(e) => setMissionYAMLForm({
                                ...missionYAMLForm,
                                scoring: {
                                  ...missionYAMLForm.scoring,
                                  ai_evaluation: { ...missionYAMLForm.scoring.ai_evaluation, enabled: e.target.checked }
                                }
                              })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm font-medium text-white">AI Evaluation Enabled</span>
                          </label>
                          <input
                            type="text"
                            value={missionYAMLForm.scoring.ai_evaluation.focus.join(', ')}
                            onChange={(e) => setMissionYAMLForm({
                              ...missionYAMLForm,
                              scoring: {
                                ...missionYAMLForm.scoring,
                                ai_evaluation: {
                                  ...missionYAMLForm.scoring.ai_evaluation,
                                  focus: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                }
                              }
                            })}
                            placeholder="log_integrity, script_syntax, flag_capture"
                            className="w-full px-3 py-1.5 bg-och-midnight border border-och-steel/20 rounded text-white text-sm"
                          />
                        </div>

                        {/* Mentor Review */}
                        <div>
                          <label className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              checked={missionYAMLForm.scoring.mentor_review.enabled}
                              onChange={(e) => setMissionYAMLForm({
                                ...missionYAMLForm,
                                scoring: {
                                  ...missionYAMLForm.scoring,
                                  mentor_review: { ...missionYAMLForm.scoring.mentor_review, enabled: e.target.checked }
                                }
                              })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm font-medium text-white">Mentor Review Enabled</span>
                          </label>
                          <input
                            type="text"
                            value={missionYAMLForm.scoring.mentor_review.tier_required}
                            onChange={(e) => setMissionYAMLForm({
                              ...missionYAMLForm,
                              scoring: {
                                ...missionYAMLForm.scoring,
                                mentor_review: { ...missionYAMLForm.scoring.mentor_review, tier_required: e.target.value }
                              }
                            })}
                            placeholder="Paid ($7)"
                            className="w-full px-3 py-1.5 bg-och-midnight border border-och-steel/20 rounded text-white text-sm mb-2"
                          />
                          <input
                            type="text"
                            value={missionYAMLForm.scoring.mentor_review.rubric_focus.join(', ')}
                            onChange={(e) => setMissionYAMLForm({
                              ...missionYAMLForm,
                              scoring: {
                                ...missionYAMLForm.scoring,
                                mentor_review: {
                                  ...missionYAMLForm.scoring.mentor_review,
                                  rubric_focus: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                }
                              }
                            })}
                            placeholder="decision_logic, communication_clarity, report_professionalism"
                            className="w-full px-3 py-1.5 bg-och-midnight border border-och-steel/20 rounded text-white text-sm"
                          />
                        </div>

                        {/* Skills Update */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-white">Skills Update</label>
                            <Button variant="outline" size="sm" onClick={handleAddSkillUpdate}>
                              <PlusIcon /> Add Skill
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {missionYAMLForm.scoring.skills_update.map((skill, index) => (
                              <div key={index} className="flex gap-2">
                                <input
                                  type="text"
                                  value={skill.skill}
                                  onChange={(e) => handleUpdateSkillUpdate(index, 'skill', e.target.value)}
                                  placeholder="Incident Response"
                                  className="flex-1 px-3 py-1.5 bg-och-midnight border border-och-steel/20 rounded text-white text-sm"
                                />
                                <select
                                  value={skill.impact}
                                  onChange={(e) => handleUpdateSkillUpdate(index, 'impact', e.target.value)}
                                  className="px-3 py-1.5 bg-och-midnight border border-och-steel/20 rounded text-white text-sm"
                                >
                                  <option value="low">low</option>
                                  <option value="medium">medium</option>
                                  <option value="high">high</option>
                                </select>
                                <Button variant="outline" size="sm" onClick={() => handleRemoveSkillUpdate(index)}>
                                  <TrashIcon />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-och-steel/20">
                      <Button
                        variant="defender"
                        onClick={handleDownloadYAML}
                        disabled={!missionYAMLForm.header.title || !missionYAMLForm.mission_meta.id}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Generate & Download YAML
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowMissionForm(false)
                          setEditingMission(null)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
