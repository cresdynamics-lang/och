'use client'

import { useState, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { missionsClient, type MissionTemplate } from '@/services/missionsClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const RegistryIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

export default function MentorCompetencyRegistryPage() {
  const router = useRouter()
  const [missions, setMissions] = useState<MissionTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFramework, setSelectedFramework] = useState<string>('all')
  const [selectedRole, setSelectedRole] = useState<string>('all')

  // Framework definitions
  const frameworks = [
    { id: 'mitre_attack', name: 'MITRE ATT&CK', color: 'defender' },
    { id: 'nice_workrole', name: 'NICE Work Role', color: 'mint' },
    { id: 'nist_csf', name: 'NIST CSF', color: 'gold' },
    { id: 'iso_27001', name: 'ISO 27001', color: 'orange' },
    { id: 'pci_dss', name: 'PCI DSS', color: 'steel' },
    { id: 'owasp_asvs', name: 'OWASP ASVS', color: 'defender' },
    { id: 'cis_controls', name: 'CIS Controls', color: 'mint' },
  ]

  useEffect(() => {
    loadMissions()
  }, [])

  const loadMissions = async () => {
    setIsLoading(true)
    try {
      const response = await missionsClient.getAllMissions({ page_size: 1000 })
      setMissions(response.results || [])
    } catch (error) {
      console.error('Failed to load missions:', error)
      setMissions([])
    } finally {
      setIsLoading(false)
    }
  }

  // Extract all framework mappings from missions
  const extractFrameworkData = () => {
    const frameworkData: Record<string, any[]> = {
      mitre_attack: [],
      nice_workrole: [],
      nist_csf: [],
      iso_27001: [],
      pci_dss: [],
      owasp_asvs: [],
      cis_controls: [],
    }

    const seen = new Set<string>()

    missions.forEach(mission => {
      const frameworkMappings = mission.requirements?.framework_mappings || {}
      
      Object.keys(frameworkData).forEach(frameworkKey => {
        const mappings = frameworkMappings[frameworkKey] || []
        mappings.forEach((item: any) => {
          let key = ''
          if (frameworkKey === 'nist_csf') {
            key = `${frameworkKey}_${item.function}`
          } else if (frameworkKey === 'mitre_attack' || frameworkKey === 'nice_workrole') {
            key = `${frameworkKey}_${item.code}_${item.name}`
          } else if (frameworkKey === 'iso_27001' || frameworkKey === 'cis_controls') {
            key = `${frameworkKey}_${item.control}_${item.name}`
          } else if (frameworkKey === 'pci_dss') {
            key = `${frameworkKey}_${item.requirement}_${item.description}`
          } else if (frameworkKey === 'owasp_asvs') {
            key = `${frameworkKey}_${item.category}_${item.name}`
          }

          if (key && !seen.has(key)) {
            seen.add(key)
            frameworkData[frameworkKey].push({
              ...item,
              missionCode: mission.code,
              missionTitle: mission.title,
              missionId: mission.id,
            })
          }
        })
      })
    })

    return frameworkData
  }

  // Extract unique roles from NICE Work Role mappings
  const extractRoles = () => {
    const roles = new Map<string, { code: string; name: string; missions: Array<{ id: string; code: string; title: string }> }>()

    missions.forEach(mission => {
      const niceMappings = mission.requirements?.framework_mappings?.nice_workrole || []
      niceMappings.forEach((item: any) => {
        const key = item.code || item.name
        if (key) {
          if (!roles.has(key)) {
            roles.set(key, {
              code: item.code || '',
              name: item.name || '',
              missions: [],
            })
          }
          const role = roles.get(key)!
          if (!role.missions.find(m => m.id === mission.id)) {
            role.missions.push({
              id: mission.id || '',
              code: mission.code,
              title: mission.title,
            })
          }
        }
      })
    })

    return Array.from(roles.values())
  }

  const frameworkData = extractFrameworkData()
  const roles = extractRoles()

  // Filter based on search and framework
  const filteredMissions = missions.filter(mission => {
    const matchesSearch = !searchQuery || 
      mission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mission.description || '').toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (selectedFramework !== 'all') {
      const mappings = mission.requirements?.framework_mappings?.[selectedFramework] || []
      if (mappings.length === 0) return false
    }

    if (selectedRole !== 'all') {
      const niceMappings = mission.requirements?.framework_mappings?.nice_workrole || []
      const hasRole = niceMappings.some((m: any) => (m.code || m.name) === selectedRole)
      if (!hasRole) return false
    }

    return true
  })

  return (
    <RouteGuard>
      <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-och-gold flex items-center gap-3">
                <RegistryIcon />
                Missions/Competency Registry
              </h1>
              <p className="text-och-steel">
                Central registry mapping missions to standardized industry frameworks and roles to ensure learning goals align with industry standards
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/mentor/missions/hall')}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Mission Hall
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 bg-och-midnight/50 border border-och-steel/20">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-och-steel">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Search missions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                />
              </div>

              <select
                value={selectedFramework}
                onChange={(e) => setSelectedFramework(e.target.value)}
                className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
              >
                <option value="all">All Frameworks</option>
                {frameworks.map(fw => (
                  <option key={fw.id} value={fw.id}>{fw.name}</option>
                ))}
              </select>

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role.code || role.name} value={role.code || role.name}>
                    {role.name} ({role.missions.length} missions)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Framework Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {frameworks.map(framework => (
            <Card key={framework.id} className="border-och-steel/30 bg-och-midnight/50">
              <div className="p-4">
                <h3 className="text-sm font-medium text-och-steel mb-2">{framework.name}</h3>
                <div className="text-2xl font-bold text-white mb-1">
                  {frameworkData[framework.id].length}
                </div>
                <p className="text-xs text-och-steel">
                  {frameworkData[framework.id].length === 1 ? 'Mapping' : 'Mappings'} across {new Set(frameworkData[framework.id].map((m: any) => m.missionId)).size} mission{new Set(frameworkData[framework.id].map((m: any) => m.missionId)).size !== 1 ? 's' : ''}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Industry Roles */}
        <Card className="mb-6 bg-och-midnight/50 border border-och-steel/20">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Industry Roles (NICE Work Role Framework)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map(role => (
                <div
                  key={role.code || role.name}
                  className="p-4 bg-och-midnight rounded-lg border border-och-steel/20 hover:border-och-mint/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">{role.name}</h3>
                    <Badge variant="mint">{role.missions.length}</Badge>
                  </div>
                  {role.code && (
                    <p className="text-xs text-och-steel mb-2">Code: {role.code}</p>
                  )}
                  <div className="mt-3">
                    <p className="text-xs text-och-steel mb-2">Missions:</p>
                    <div className="space-y-1">
                      {role.missions.slice(0, 3).map(mission => (
                        <Link
                          key={mission.id}
                          href={`/dashboard/mentor/missions/${mission.id}`}
                          className="block text-xs text-och-mint hover:text-och-gold truncate"
                        >
                          {mission.code}: {mission.title}
                        </Link>
                      ))}
                      {role.missions.length > 3 && (
                        <p className="text-xs text-och-steel">+{role.missions.length - 3} more</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {roles.length === 0 && (
              <p className="text-och-steel text-center py-8">No industry roles mapped yet. Add framework mappings to missions to see them here.</p>
            )}
          </div>
        </Card>

        {/* Framework Mappings Detail */}
        {selectedFramework !== 'all' && (
          <Card className="mb-6 bg-och-midnight/50 border border-och-steel/20">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                {frameworks.find(f => f.id === selectedFramework)?.name} Mappings
              </h2>
              <div className="space-y-4">
                {frameworkData[selectedFramework].map((item: any, index: number) => (
                  <div
                    key={index}
                    className="p-4 bg-och-midnight rounded-lg border border-och-steel/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {selectedFramework === 'mitre_attack' || selectedFramework === 'nice_workrole' ? (
                          <>
                            <div className="font-semibold text-white">{item.code}</div>
                            <div className="text-sm text-och-steel">{item.name}</div>
                          </>
                        ) : selectedFramework === 'nist_csf' ? (
                          <div className="font-semibold text-white">{item.function}</div>
                        ) : selectedFramework === 'iso_27001' || selectedFramework === 'cis_controls' ? (
                          <>
                            <div className="font-semibold text-white">{item.control}</div>
                            <div className="text-sm text-och-steel">{item.name}</div>
                          </>
                        ) : selectedFramework === 'pci_dss' ? (
                          <>
                            <div className="font-semibold text-white">Requirement {item.requirement}</div>
                            <div className="text-sm text-och-steel">{item.description}</div>
                          </>
                        ) : selectedFramework === 'owasp_asvs' ? (
                          <>
                            <div className="font-semibold text-white">{item.category}</div>
                            <div className="text-sm text-och-steel">{item.name}</div>
                          </>
                        ) : null}
                      </div>
                      <Link href={`/dashboard/mentor/missions/${item.missionId}`}>
                        <Button variant="defender" size="sm">
                          View Mission
                        </Button>
                      </Link>
                    </div>
                    <div className="mt-2">
                      <Link
                        href={`/dashboard/mentor/missions/${item.missionId}`}
                        className="text-xs text-och-mint hover:text-och-gold"
                      >
                        {item.missionCode}: {item.missionTitle}
                      </Link>
                    </div>
                  </div>
                ))}
                {frameworkData[selectedFramework].length === 0 && (
                  <p className="text-och-steel text-center py-8">
                    No {frameworks.find(f => f.id === selectedFramework)?.name} mappings found. Add framework mappings to missions to see them here.
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Missions with Framework Mappings */}
        <Card className="bg-och-midnight/50 border border-och-steel/20">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Missions ({filteredMissions.length})
            </h2>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
                <p className="text-och-steel">Loading missions...</p>
              </div>
            ) : filteredMissions.length === 0 ? (
              <p className="text-och-steel text-center py-8">
                No missions found matching your filters.
              </p>
            ) : (
              <div className="space-y-4">
                {filteredMissions.map(mission => {
                  const frameworkMappings = mission.requirements?.framework_mappings || {}
                  const hasMappings = Object.values(frameworkMappings).some((arr: any) => Array.isArray(arr) && arr.length > 0)

                  return (
                    <div
                      key={mission.id}
                      className="p-4 bg-och-midnight rounded-lg border border-och-steel/20 hover:border-och-mint/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Link
                              href={`/dashboard/mentor/missions/${mission.id}`}
                              className="font-semibold text-white hover:text-och-gold"
                            >
                              {mission.code}: {mission.title}
                            </Link>
                          </div>
                          <p className="text-sm text-och-steel line-clamp-2">
                            {mission.description || 'No description'}
                          </p>
                        </div>
                        <Link href={`/dashboard/mentor/missions/${mission.id}`}>
                          <Button variant="defender" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>

                      {hasMappings ? (
                        <div className="mt-3 pt-3 border-t border-och-steel/20">
                          <p className="text-xs text-och-steel mb-2">Framework Mappings:</p>
                          <div className="flex flex-wrap gap-2">
                            {frameworks.map(framework => {
                              const mappings = frameworkMappings[framework.id] || []
                              if (mappings.length === 0) return null
                              return (
                                <Badge key={framework.id} variant={framework.color as any}>
                                  {framework.name} ({mappings.length})
                                </Badge>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 pt-3 border-t border-och-steel/20">
                          <p className="text-xs text-och-steel">
                            No framework mappings defined.
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </RouteGuard>
  )
}

