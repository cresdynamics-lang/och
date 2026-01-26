'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useCohorts, useTracks, usePrograms } from '@/hooks/usePrograms'
import { programsClient } from '@/services/programsClient'
import { djangoClient } from '@/services/djangoClient'
// Icons are defined below

interface Mentor {
  id: string | number
  email: string
  name?: string
  first_name?: string
  last_name?: string
  username?: string
  is_mentor?: boolean
  mentor_capacity_weekly?: number
  mentor_availability?: any
  mentor_specialties?: string[]
  roles?: Array<{ id: number; role: string; role_id: number; scope: string; scope_ref?: string }>
  account_status?: string
  is_active?: boolean
  active_assignments?: number
  total_mentees?: number
  capacity_utilization?: number
  assigned_cohorts?: Array<{ id: string; name: string; role: string }>
}

const ITEMS_PER_PAGE = 20

// Icon components
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

const ChevronLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

export default function MentorsListClient() {
  const router = useRouter()
  const { cohorts, isLoading: cohortsLoading } = useCohorts({ page: 1, pageSize: 100 })
  const { tracks, isLoading: tracksLoading } = useTracks()
  const { programs, isLoading: programsLoading } = usePrograms()
  
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCohortFilter, setSelectedCohortFilter] = useState<string>('all')
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('all')
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<string>('all')
  const [mentorAssignmentsMap, setMentorAssignmentsMap] = useState<Record<string, Array<{ id: string; name: string; role: string }>>>({})
  const [loadingAssignments, setLoadingAssignments] = useState(false)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Load mentors when page or search changes
  useEffect(() => {
    loadMentors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch])

  // Load mentor assignments from all cohorts when cohorts are loaded
  useEffect(() => {
    if (!cohortsLoading && cohorts.length > 0) {
      loadMentorAssignments()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, [cohorts, cohortsLoading])

  const loadMentors = async (assignmentsMap?: Record<string, Array<{ id: string; name: string; role: string }>>) => {
    setIsLoading(true)
    try {
      // Fetch mentors with pagination and search
      const params: any = {
        page: currentPage,
        page_size: ITEMS_PER_PAGE,
        role: 'mentor',
      }
      
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim()
      }
      
      const response = await djangoClient.users.listUsers(params)
      
      // Use provided assignments map or state
      const assignments = assignmentsMap || mentorAssignmentsMap
      
      // Transform User data to Mentor format
      const mentorsData = (response.results || []).map((user: any) => {
        const mentorId = String(user.id)
        const mentorAssignments = assignments[mentorId] || []
        return {
          id: mentorId, // Ensure ID is a string for routing
          email: user.email,
          name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          is_mentor: user.is_mentor,
          mentor_capacity_weekly: user.mentor_capacity_weekly || 10,
          mentor_availability: user.mentor_availability || {},
          mentor_specialties: user.mentor_specialties || [],
          roles: user.roles || [],
          account_status: user.account_status,
          is_active: user.is_active,
          active_assignments: mentorAssignments.length,
          total_mentees: 0,
          capacity_utilization: 0,
          assigned_cohorts: mentorAssignments,
        }
      })
      
      setMentors(mentorsData)
      setTotalCount(response.count || 0)
    } catch (err) {
      console.error('Failed to load mentors:', err)
      setMentors([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMentorAssignments = async () => {
    if (cohorts.length === 0 || cohortsLoading) return
    
    setLoadingAssignments(true)
    try {
      const assignmentsMap: Record<string, Array<{ id: string; name: string; role: string }>> = {}
      
      // Fetch mentor assignments for each cohort
      const assignmentPromises = cohorts.map(async (cohort) => {
        try {
          const assignments = await programsClient.getCohortMentors(String(cohort.id))
          assignments.forEach((assignment: any) => {
            const mentorId = String(assignment.mentor)
            if (!assignmentsMap[mentorId]) {
              assignmentsMap[mentorId] = []
            }
            assignmentsMap[mentorId].push({
              id: String(cohort.id),
              name: cohort.name,
              role: assignment.role || 'support',
            })
          })
        } catch (err) {
          console.error(`Failed to load assignments for cohort ${cohort.id}:`, err)
        }
      })
      
      await Promise.all(assignmentPromises)
      setMentorAssignmentsMap(assignmentsMap)
      
      // Reload mentors with updated assignments
      loadMentors(assignmentsMap)
    } catch (err) {
      console.error('Failed to load mentor assignments:', err)
    } finally {
      setLoadingAssignments(false)
    }
  }

  // Filter mentors by cohort/program/track (client-side filtering for now)
  const filteredMentors = useMemo(() => {
    const filtered = mentors

    // Note: Cohort/program/track filtering would ideally be done server-side
    // For now, we'll do client-side filtering if mentor assignments data is available
    // This is a simplified version - in production, you'd want backend support for these filters

    return filtered
  }, [mentors, selectedCohortFilter, selectedProgramFilter, selectedTrackFilter])

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleMentorClick = (mentorId: string | number) => {
    const mentorIdStr = String(mentorId)
    console.log('Navigating to mentor:', mentorIdStr)
    router.push(`/dashboard/director/mentors/${mentorIdStr}`)
  }

  const handleFilterChange = () => {
    setCurrentPage(1)
  }

  return (
    <DirectorLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-och-gold flex items-center gap-3">
                <UsersIcon />
                Mentor Management
              </h1>
              <p className="text-och-steel">View and manage all platform mentors</p>
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-och-steel">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Search mentors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                />
              </div>

              {/* Program Filter */}
              <select
                value={selectedProgramFilter}
                onChange={(e) => {
                  setSelectedProgramFilter(e.target.value)
                  handleFilterChange()
                }}
                className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
              >
                <option value="all">All Programs</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>

              {/* Track Filter */}
              <select
                value={selectedTrackFilter}
                onChange={(e) => {
                  setSelectedTrackFilter(e.target.value)
                  handleFilterChange()
                }}
                className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                disabled={selectedProgramFilter === 'all'}
              >
                <option value="all">All Tracks</option>
                {tracks
                  .filter((track) => selectedProgramFilter === 'all' || track.program === selectedProgramFilter)
                  .map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.name}
                    </option>
                  ))}
              </select>

              {/* Cohort Filter */}
              <select
                value={selectedCohortFilter}
                onChange={(e) => {
                  setSelectedCohortFilter(e.target.value)
                  handleFilterChange()
                }}
                className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
              >
                <option value="all">All Cohorts</option>
                {cohorts.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Mentors Grid */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-och-steel">
                  Showing <span className="text-white font-semibold">{filteredMentors.length}</span> of{' '}
                  <span className="text-white font-semibold">{totalCount}</span> mentors
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
                  <p className="text-och-steel">Loading mentors...</p>
                </div>
              </div>
            ) : filteredMentors.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 text-och-steel/50 mx-auto mb-4">
                  <UsersIcon />
                </div>
                <p className="text-och-steel text-lg mt-4 mb-2">No mentors found</p>
                <p className="text-och-steel text-sm">
                  {debouncedSearch ? 'Try adjusting your search query' : 'No mentors are available'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {filteredMentors.map((mentor) => (
                    <div
                      key={mentor.id}
                      onClick={(e) => {
                        e.preventDefault()
                        handleMentorClick(mentor.id)
                      }}
                      className="cursor-pointer group"
                    >
                      <Card className="hover:bg-och-midnight/70 transition-all hover:scale-[1.02] hover:border-och-mint/30 h-full">
                        <div>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-1">
                              {mentor.name || mentor.email}
                            </h3>
                            <p className="text-sm text-och-steel">{mentor.email}</p>
                          </div>
                          <Badge
                            variant={mentor.is_active && mentor.account_status === 'active' ? 'mint' : 'steel'}
                          >
                            {mentor.account_status || (mentor.is_active ? 'Active' : 'Inactive')}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          {mentor.mentor_specialties && mentor.mentor_specialties.length > 0 && (
                            <div>
                              <p className="text-xs text-och-steel mb-1">Specialties</p>
                              <div className="flex flex-wrap gap-1">
                                {mentor.mentor_specialties.slice(0, 3).map((specialty, idx) => (
                                  <Badge key={idx} variant="defender" className="text-xs">
                                    {specialty}
                                  </Badge>
                                ))}
                                {mentor.mentor_specialties.length > 3 && (
                                  <Badge variant="steel" className="text-xs">
                                    +{mentor.mentor_specialties.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-och-steel">Capacity</span>
                            <span className="text-white font-medium">
                              {mentor.mentor_capacity_weekly || 0} hours/week
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-och-steel">Active Assignments</span>
                            <span className="text-white font-medium">{mentor.active_assignments || 0}</span>
                          </div>

                          {mentor.assigned_cohorts && mentor.assigned_cohorts.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-och-steel mb-2">Assigned Cohorts</p>
                              <div className="space-y-1">
                                {mentor.assigned_cohorts.slice(0, 3).map((cohort) => (
                                  <div key={cohort.id} className="flex items-center justify-between text-xs">
                                    <span className="text-och-steel truncate flex-1">{cohort.name}</span>
                                    <Badge 
                                      variant={cohort.role === 'primary' ? 'defender' : cohort.role === 'support' ? 'mint' : 'steel'} 
                                      className="ml-2 text-xs"
                                    >
                                      {cohort.role}
                                    </Badge>
                                  </div>
                                ))}
                                {mentor.assigned_cohorts.length > 3 && (
                                  <p className="text-xs text-och-steel">+{mentor.assigned_cohorts.length - 3} more</p>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="mt-4 pt-3 border-t border-och-steel/20">
                            <span className="text-xs text-och-mint group-hover:text-och-mint/80">
                              View Analytics →
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                    </div>
                  ))}
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
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!hasPrevPage || isLoading}
                      >
                        <span className="mr-1"><ChevronLeftIcon /></span>
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
                              onClick={() => handlePageChange(pageNum)}
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
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!hasNextPage || isLoading}
                      >
                        Next
                        <span className="ml-1"><ChevronRightIcon /></span>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
    </DirectorLayout>
  )
}

