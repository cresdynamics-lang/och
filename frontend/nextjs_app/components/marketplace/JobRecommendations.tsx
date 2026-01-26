'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useMarketplace } from '@/hooks/useMarketplace'
import { useAuth } from '@/hooks/useAuth'

export function JobRecommendations() {
  const { user } = useAuth()
  const menteeId = user?.id?.toString()
  const { recommendations, isLoading, error } = useMarketplace(menteeId)

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'mint'
    if (score >= 60) return 'defender'
    if (score >= 40) return 'gold'
    return 'steel'
  }

  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'full_time':
        return 'defender'
      case 'part_time':
        return 'mint'
      case 'contract':
        return 'gold'
      case 'internship':
        return 'orange'
      default:
        return 'steel'
    }
  }

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="text-och-steel">Loading job recommendations...</div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-4 border-och-orange">
        <div className="text-och-orange text-sm">{error}</div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="p-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Job Recommendations</h3>
          <Badge variant="mint">{recommendations.length} matches</Badge>
        </div>
      </Card>

      {recommendations.length === 0 ? (
        <Card className="p-8">
          <div className="text-center text-och-steel">
            <div className="text-4xl mb-2">💼</div>
            <div>No job recommendations yet</div>
            <div className="text-sm mt-2">Complete more portfolio items to get better matches</div>
          </div>
        </Card>
      ) : (
        recommendations.map((job) => (
          <Card key={job.id}>
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-white">{job.title}</h4>
                    <Badge variant={getMatchColor(job.match_score) as any}>
                      {job.match_score}% match
                    </Badge>
                  </div>
                  <div className="text-sm text-och-steel mb-2">
                    {job.employer?.company_name || 'Company'} • {job.location || 'Remote'}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getJobTypeColor(job.job_type) as any} className="text-xs">
                      {job.job_type.replace('_', ' ')}
                    </Badge>
                    {(job.salary_min && job.salary_max) && (
                      <span className="text-sm text-och-steel">
                        {job.salary_currency} {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-sm text-och-steel mb-3 line-clamp-2">{job.description}</p>

              <div className="mb-3">
                <div className="text-xs text-och-steel mb-1">Required Skills:</div>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills.map((skill) => (
                    <Badge key={skill} variant="steel" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-och-steel">
                  Posted: {new Date(job.posted_at).toLocaleDateString()}
                  {job.application_deadline && (
                    <span className="ml-2">
                      • Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">View Details</Button>
                  <Button variant="defender" size="sm">Apply Now</Button>
                </div>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}

