'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { djangoClient } from '@/services/djangoClient'
import { useCohorts, usePrograms, useTracks } from '@/hooks/usePrograms'
import { useUsers } from '@/hooks/useUsers'

interface MentorReview {
  id: string
  mentor_id: string
  mentor_name?: string
  mentor_email?: string
  student_id?: string
  student_name?: string
  student_email?: string
  cohort_id?: string
  cohort_name?: string
  rating: number
  feedback: string
  reviewed_at: string
  director_comments?: Array<{
    id: string
    comment: string
    director_name?: string
    director_email?: string
    created_at: string
  }>
  status?: 'pending' | 'approved' | 'flagged'
}

const FilterIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const StarIcon = ({ filled }: { filled?: boolean }) => (
  <svg 
    className={`w-5 h-5 ${filled ? 'text-och-gold' : 'text-och-steel/30'}`} 
    fill={filled ? 'currentColor' : 'none'} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
)

const MessageSquareIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

export default function MentorReviewsPage() {
  const { cohorts, isLoading: cohortsLoading } = useCohorts({ page: 1, pageSize: 500 })
  const { programs, isLoading: programsLoading } = usePrograms()
  const { tracks } = useTracks()
  const { users: mentors, isLoading: mentorsLoading } = useUsers({ page: 1, page_size: 500, role: 'mentor' })
  
  const [reviews, setReviews] = useState<MentorReview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedMentor, setSelectedMentor] = useState<string>('all')
  const [selectedCohort, setSelectedCohort] = useState<string>('all')
  const [selectedProgram, setSelectedProgram] = useState<string>('all')
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const [expandedReview, setExpandedReview] = useState<string | null>(null)
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [isSubmittingComment, setIsSubmittingComment] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Load reviews
  useEffect(() => {
    loadReviews()
  }, [debouncedSearch, selectedMentor, selectedCohort, selectedProgram, ratingFilter, statusFilter])

  const loadReviews = async () => {
    setIsLoading(true)
    try {
      // Fetch all mentor reviews (aggregated from student session feedback)
      const response = await djangoClient.mentorship.getMentorReviews()
      const apiReviews = response.reviews || []

      // Map API response directly into MentorReview shape
      const mapped: MentorReview[] = apiReviews.map((review: any) => ({
        id: review.id,
        mentor_id: review.mentor_id,
        mentor_name: review.mentor_name,
        mentor_email: review.mentor_email,
        student_id: review.student_id,
        student_name: review.student_name,
        student_email: review.student_email,
        cohort_id: review.cohort_id,
        cohort_name: review.cohort_name,
        rating: review.rating,
        feedback: review.feedback,
        reviewed_at: review.reviewed_at,
        director_comments: review.director_comments || [],
        status: review.status || 'approved',
      }))

      setReviews(mapped)
    } catch (error) {
      console.error('Failed to load reviews:', error)
      setReviews([])
    } finally {
      setIsLoading(false)
    }
  }

  // Filter reviews
  const filteredReviews = useMemo(() => {
    let filtered = reviews

    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase()
      filtered = filtered.filter(review =>
        review.mentor_name?.toLowerCase().includes(query) ||
        review.mentor_email?.toLowerCase().includes(query) ||
        review.feedback?.toLowerCase().includes(query) ||
        review.cohort_name?.toLowerCase().includes(query)
      )
    }

    if (selectedMentor !== 'all') {
      filtered = filtered.filter(review => review.mentor_id === selectedMentor)
    }

    if (selectedCohort !== 'all') {
      filtered = filtered.filter(review => review.cohort_id === selectedCohort)
    }

    if (selectedProgram !== 'all') {
      const programCohorts = cohorts.filter(c => c.track && tracks.find(t => String(t.id) === String(c.track) && String(t.program) === selectedProgram))
      const cohortIds = programCohorts.map(c => String(c.id))
      filtered = filtered.filter(review => review.cohort_id && cohortIds.includes(review.cohort_id))
    }

    if (ratingFilter !== 'all') {
      const minRating = parseInt(ratingFilter)
      filtered = filtered.filter(review => review.rating >= minRating)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(review => review.status === statusFilter)
    }

    return filtered.sort((a, b) => new Date(b.reviewed_at).getTime() - new Date(a.reviewed_at).getTime())
  }, [reviews, debouncedSearch, selectedMentor, selectedCohort, selectedProgram, ratingFilter, statusFilter, cohorts, tracks])

  const handleAddComment = async (reviewId: string) => {
    const comment = commentText[reviewId]?.trim()
    if (!comment) return

    setIsSubmittingComment(reviewId)
    try {
      // TODO: Call API to add director comment to review
      // For now, we'll update locally
      setReviews(reviews.map(review => {
        if (review.id === reviewId) {
          return {
            ...review,
            director_comments: [
              ...(review.director_comments || []),
              {
                id: `comment-${Date.now()}`,
                comment,
                director_name: 'Director',
                created_at: new Date().toISOString(),
              }
            ]
          }
        }
        return review
      }))
      setCommentText({ ...commentText, [reviewId]: '' })
      setExpandedReview(null)
    } catch (error) {
      console.error('Failed to add comment:', error)
      alert('Failed to add comment')
    } finally {
      setIsSubmittingComment(null)
    }
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon key={i} filled={i < rating} />
    ))
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-och-gold flex items-center gap-3">
              <MessageSquareIcon />
              Mentor Reviews
            </h1>
            <p className="text-och-steel">View and manage student reviews of mentors</p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <FilterIcon />
                <h2 className="text-lg font-semibold text-white">Filters</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Search */}
                <div className="lg:col-span-2 relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-och-steel">
                    <SearchIcon />
                  </div>
                  <input
                    type="text"
                    placeholder="Search reviews..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                  />
                </div>

                {/* Mentor Filter */}
                <select
                  value={selectedMentor}
                  onChange={(e) => setSelectedMentor(e.target.value)}
                  className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                >
                  <option value="all">All Mentors</option>
                  {mentors.map((mentor) => (
                    <option key={mentor.id} value={String(mentor.id)}>
                      {`${mentor.first_name || ''} ${mentor.last_name || ''}`.trim() || mentor.email}
                    </option>
                  ))}
                </select>

                {/* Program Filter */}
                <select
                  value={selectedProgram}
                  onChange={(e) => {
                    setSelectedProgram(e.target.value)
                    setSelectedCohort('all')
                  }}
                  className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                >
                  <option value="all">All Programs</option>
                  {programs.map((program) => (
                    <option key={program.id} value={String(program.id)}>
                      {program.name}
                    </option>
                  ))}
                </select>

                {/* Cohort Filter */}
                <select
                  value={selectedCohort}
                  onChange={(e) => setSelectedCohort(e.target.value)}
                  className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                  disabled={selectedProgram === 'all'}
                >
                  <option value="all">All Cohorts</option>
                  {cohorts
                    .filter((cohort) => {
                      if (selectedProgram === 'all') return true
                      const track = tracks.find(t => String(t.id) === String(cohort.track))
                      return track && String(track.program) === selectedProgram
                    })
                    .map((cohort) => (
                      <option key={cohort.id} value={String(cohort.id)}>
                        {cohort.name}
                      </option>
                    ))}
                </select>

                {/* Rating Filter */}
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="1">1+ Stars</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Reviews List */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-och-steel">
                    Showing <span className="text-white font-semibold">{filteredReviews.length}</span> reviews
                  </p>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
                    <p className="text-och-steel">Loading reviews...</p>
                  </div>
                </div>
              ) : filteredReviews.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquareIcon />
                  <p className="text-och-steel text-lg mt-4 mb-2">No reviews found</p>
                  <p className="text-och-steel text-sm">
                    {debouncedSearch || selectedMentor !== 'all' ? 'Try adjusting your filters' : 'No reviews available yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-5 bg-och-midnight/50 rounded-lg border border-och-steel/20 hover:border-och-mint/30 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{review.mentor_name || review.mentor_email}</h3>
                            <Badge variant="mint">{review.cohort_name || 'N/A'}</Badge>
                            {review.status && (
                              <Badge 
                                variant={
                                  review.status === 'approved' ? 'defender' :
                                  review.status === 'flagged' ? 'orange' : 'steel'
                                }
                              >
                                {review.status}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-1">
                              {getRatingStars(review.rating)}
                            </div>
                            <span className="text-och-steel text-sm">
                              {new Date(review.reviewed_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <p className="text-och-steel mb-4">{review.feedback}</p>

                          {/* Director Comments */}
                          {review.director_comments && review.director_comments.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-och-steel/20">
                              <h4 className="text-sm font-semibold text-white mb-2">Director Comments</h4>
                              <div className="space-y-2">
                                {review.director_comments.map((comment) => (
                                  <div key={comment.id} className="p-3 bg-och-midnight rounded-lg">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-och-steel">{comment.director_name || 'Director'}</span>
                                      <span className="text-xs text-och-steel">
                                        {new Date(comment.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-sm text-white">{comment.comment}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Add Comment */}
                          {expandedReview === review.id ? (
                            <div className="mt-4 pt-4 border-t border-och-steel/20">
                              <textarea
                                value={commentText[review.id] || ''}
                                onChange={(e) => setCommentText({ ...commentText, [review.id]: e.target.value })}
                                placeholder="Add a comment..."
                                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint mb-2"
                                rows={3}
                              />
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="defender"
                                  size="sm"
                                  onClick={() => handleAddComment(review.id)}
                                  disabled={!commentText[review.id]?.trim() || isSubmittingComment === review.id}
                                >
                                  {isSubmittingComment === review.id ? 'Adding...' : 'Add Comment'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setExpandedReview(null)
                                    setCommentText({ ...commentText, [review.id]: '' })
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setExpandedReview(review.id)}
                              className="mt-4"
                            >
                              <MessageSquareIcon />
                              <span className="ml-2">Add Comment</span>
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
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
