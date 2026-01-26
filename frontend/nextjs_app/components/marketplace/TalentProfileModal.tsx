'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { type MarketplaceProfile } from '@/services/marketplaceClient'
import { Heart, Bookmark, Mail, X, TrendingUp, Clock, User, MapPin, Briefcase } from 'lucide-react'

interface TalentProfileModalProps {
  profile: MarketplaceProfile | null
  open: boolean
  onClose: () => void
  onFavorite?: (profileId: string) => void
  onShortlist?: (profileId: string) => void
  onContact?: (profileId: string) => void
  isFavorited?: boolean
  isShortlisted?: boolean
  actionLoading?: Record<string, 'favorite' | 'shortlist' | 'contact_request' | null>
}

export function TalentProfileModal({
  profile,
  open,
  onClose,
  onFavorite,
  onShortlist,
  onContact,
  isFavorited = false,
  isShortlisted = false,
  actionLoading = {},
}: TalentProfileModalProps) {
  if (!profile) {
    return null
  }

  console.log('TalentProfileModal render:', { open, profileId: profile.id, profileName: profile.mentee_name })

  const getReadinessColor = (score: number | null) => {
    if (!score) return 'steel'
    if (score >= 80) return 'mint'
    if (score >= 60) return 'gold'
    return 'steel'
  }

  const getReadinessLabel = (score: number | null) => {
    if (!score) return 'Not Available'
    if (score >= 80) return 'High'
    if (score >= 60) return 'Medium'
    return 'Low'
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'mint' | 'gold' | 'steel'> = {
      job_ready: 'mint',
      emerging_talent: 'gold',
      foundation_mode: 'steel',
    }
    return variants[status] || 'steel'
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-och-midnight border-och-defender/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-och-gold flex items-center justify-between">
            <span>{profile.mentee_name}</span>
            <Badge variant={profile.tier === 'professional' ? 'mint' : 'steel'} className="ml-4">
              {profile.tier === 'professional' ? 'Professional' : profile.tier === 'starter' ? 'Starter' : 'Free'}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-och-steel">
            {profile.primary_role || 'Cybersecurity Professional'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Header Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-5 h-5 text-och-steel" />
                <span className="text-sm text-och-steel">Primary Role</span>
              </div>
              <p className="text-white font-medium">
                {profile.primary_role || 'Cybersecurity Professional'}
              </p>
            </div>
          </div>

          {/* Readiness Scores */}
          <div className="bg-och-midnight/50 rounded-lg p-6 border border-och-defender/20">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-och-gold" />
              Career Readiness
            </h3>
            
            <div className="space-y-4">
              {/* Overall Readiness Score */}
              {profile.readiness_score !== null && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-och-steel">Overall Readiness Score</span>
                    <Badge variant={getReadinessColor(profile.readiness_score)} className="text-base">
                      {profile.readiness_score}% - {getReadinessLabel(profile.readiness_score)}
                    </Badge>
                  </div>
                  <div className="w-full bg-och-midnight rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        profile.readiness_score >= 80
                          ? 'bg-och-mint'
                          : profile.readiness_score >= 60
                          ? 'bg-och-gold'
                          : 'bg-och-steel'
                      }`}
                      style={{ width: `${profile.readiness_score}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Job Fit Score */}
              {profile.job_fit_score !== null && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-och-steel">Job Fit Score</span>
                    <Badge variant={getReadinessColor(profile.job_fit_score)}>
                      {profile.job_fit_score}%
                    </Badge>
                  </div>
                  <div className="w-full bg-och-midnight rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        profile.job_fit_score >= 80
                          ? 'bg-och-mint'
                          : profile.job_fit_score >= 60
                          ? 'bg-och-gold'
                          : 'bg-och-steel'
                      }`}
                      style={{ width: `${profile.job_fit_score}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Hiring Timeline */}
              {profile.hiring_timeline_days !== null && (
                <div className="flex items-center gap-2 text-och-steel">
                  <Clock className="w-5 h-5" />
                  <span>
                    Estimated hiring timeline: <strong className="text-white">{profile.hiring_timeline_days} days</strong>
                  </span>
                </div>
              )}

              {/* Profile Status */}
              <div>
                <span className="text-sm text-och-steel mr-2">Profile Status:</span>
                <Badge variant={getStatusBadge(profile.profile_status)}>
                  {profile.profile_status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Skills Section */}
          {profile.skills && profile.skills.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <Badge key={skill} variant="defender">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Depth */}
          <div className="bg-och-midnight/50 rounded-lg p-4 border border-och-defender/20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-och-steel">Portfolio Depth</span>
                <Badge variant="gold" className="ml-2">
                  {profile.portfolio_depth}
                </Badge>
              </div>
              <p className="text-xs text-och-steel">
                {profile.portfolio_depth === 'deep'
                  ? 'Comprehensive portfolio with extensive work'
                  : profile.portfolio_depth === 'moderate'
                  ? 'Good portfolio depth with multiple items'
                  : 'Basic portfolio with foundational items'}
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-och-steel">Primary Track:</span>
              <p className="text-white">{profile.primary_track_key || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-och-steel">Last Updated:</span>
              <p className="text-white">{new Date(profile.updated_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-och-defender/20">
            {onFavorite && (
              <Button
                variant={isFavorited ? 'gold' : 'outline'}
                className="flex-1"
                onClick={() => onFavorite(profile.id)}
                disabled={!!actionLoading[`${profile.id}-favorite`]}
              >
                <Heart className="w-4 h-4 mr-2" />
                {isFavorited ? 'Favorited' : 'Favorite'}
              </Button>
            )}
            {onShortlist && (
              <Button
                variant={isShortlisted ? 'gold' : 'outline'}
                className="flex-1"
                onClick={() => onShortlist(profile.id)}
                disabled={!!actionLoading[`${profile.id}-shortlist`]}
              >
                <Bookmark className="w-4 h-4 mr-2" />
                {isShortlisted ? 'Shortlisted' : 'Shortlist'}
              </Button>
            )}
            {profile.tier === 'professional' && onContact && (
              <Button
                variant="gold"
                className="flex-1"
                onClick={() => onContact(profile.id)}
                disabled={!!actionLoading[`${profile.id}-contact_request`]}
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
