/**
 * Community Dashboard Component
 * Role-based community interface with University Communities and Global Feed
 * Implements RBAC for different role entitlements
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getUserRoles, getPrimaryRole, type Role } from '@/utils/rbac';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { UniversityCommunityView } from './UniversityCommunityView';
import { GlobalFeedView } from './GlobalFeedView';
import { CommunityLeaderboard } from './CommunityLeaderboard';
import { CreatePostModal } from './CreatePostModal';
import { Users, Globe, Trophy, Plus, Settings, Shield, MessageCircle, UserCircle, ChevronRight, ExternalLink, MessageSquare } from 'lucide-react';
import { apiGateway } from '@/services/apiGateway';
import { programsClient } from '@/services/programsClient';
import { communityClient } from '@/services/communityClient';

type TabType = 'university' | 'global' | 'leaderboard';

export interface CommunityPermissions {
  canPost: boolean;
  canComment: boolean;
  canReact: boolean;
  canModerate: boolean;
  canPinEvents: boolean;
  canApproveTracks: boolean;
  canManageMentors: boolean;
  canViewAnalytics: boolean;
  canModerateAll: boolean;
  canManageUniversities: boolean;
  readOnlyAccess: boolean; // For students viewing other universities
}

/**
 * Get community permissions based on user role
 */
function getCommunityPermissions(roles: Role[], primaryRole: Role | null): CommunityPermissions {
  const hasRole = (role: Role) => roles.includes(role);
  const isStudent = hasRole('student') || hasRole('mentee');
  const isMentor = hasRole('mentor');
  const isFaculty = hasRole('mentor'); // Faculty uses mentor role
  const isDirector = hasRole('program_director');
  const isAdmin = hasRole('admin');
  const isEmployer = hasRole('employer');
  const isFinance = hasRole('finance');

  // Employers and Finance have no community access
  if (isEmployer || isFinance) {
    return {
      canPost: false,
      canComment: false,
      canReact: false,
      canModerate: false,
      canPinEvents: false,
      canApproveTracks: false,
      canManageMentors: false,
      canViewAnalytics: false,
      canModerateAll: false,
      canManageUniversities: false,
      readOnlyAccess: false,
    };
  }

  // Students: Full access to their university, read-only for others
  if (isStudent) {
    return {
      canPost: true,
      canComment: true,
      canReact: true,
      canModerate: false,
      canPinEvents: false,
      canApproveTracks: false,
      canManageMentors: false,
      canViewAnalytics: false,
      canModerateAll: false,
      canManageUniversities: false,
      readOnlyAccess: true, // Read-only for other universities
    };
  }

  // Faculty/Mentors: Moderate their university
  if (isFaculty || isMentor) {
    return {
      canPost: true,
      canComment: true,
      canReact: true,
      canModerate: true, // Their university only
      canPinEvents: true,
      canApproveTracks: false,
      canManageMentors: false,
      canViewAnalytics: true, // Their university analytics
      canModerateAll: false,
      canManageUniversities: false,
      readOnlyAccess: false,
    };
  }

  // Program Directors: Beyond faculty permissions
  if (isDirector) {
    return {
      canPost: true,
      canComment: true,
      canReact: true,
      canModerate: true,
      canPinEvents: true,
      canApproveTracks: true,
      canManageMentors: true,
      canViewAnalytics: true, // Track-level analytics
      canModerateAll: false,
      canManageUniversities: false,
      readOnlyAccess: false,
    };
  }

  // Admins: Full platform oversight
  if (isAdmin) {
    return {
      canPost: true,
      canComment: true,
      canReact: true,
      canModerate: true,
      canPinEvents: true,
      canApproveTracks: true,
      canManageMentors: true,
      canViewAnalytics: true,
      canModerateAll: true, // All content
      canManageUniversities: true,
      readOnlyAccess: false,
    };
  }

  // Default: minimal access
  return {
    canPost: false,
    canComment: false,
    canReact: false,
    canModerate: false,
    canPinEvents: false,
    canApproveTracks: false,
    canManageMentors: false,
    canViewAnalytics: false,
    canModerateAll: false,
    canManageUniversities: false,
    readOnlyAccess: true,
  };
}

export function CommunityDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('university');
  const [showCreatePost, setShowCreatePost] = useState(false);
  
  // Cohort data state
  const [cohortId, setCohortId] = useState<string | null>(null);
  const [cohortName, setCohortName] = useState<string | null>(null);
  const [cohortDiscussions, setCohortDiscussions] = useState<any[]>([]);
  const [cohortMentors, setCohortMentors] = useState<any[]>([]);
  const [loadingCohortData, setLoadingCohortData] = useState(true);

  const roles = useMemo(() => getUserRoles(user), [user]);
  const primaryRole = useMemo(() => getPrimaryRole(user), [user]);
  const permissions = useMemo(() => getCommunityPermissions(roles, primaryRole), [roles, primaryRole]);
  
  // Fetch cohort data (only for students)
  useEffect(() => {
    const fetchCohortData = async () => {
      if (!user?.id || !roles.includes('student') && !roles.includes('mentee')) {
        setLoadingCohortData(false);
        return;
      }

      setLoadingCohortData(true);
      try {
        // Get student profile to find cohort
        const profileResponse = await apiGateway.get<any>('/student/profile');
        const enrollment = profileResponse?.enrollment;
        
        if (enrollment?.cohort_id) {
          const cohortIdStr = String(enrollment.cohort_id);
          setCohortId(cohortIdStr);
          setCohortName(enrollment.cohort_name || null);

          // Fetch cohort discussions/feed
          try {
            const feedResponse = await communityClient.getFeed({ 
              page: 1, 
              page_size: 5 
            });
            setCohortDiscussions(feedResponse.results || []);
          } catch (feedError) {
            console.error('Failed to fetch cohort discussions:', feedError);
            setCohortDiscussions([]);
          }

          // Fetch cohort mentors
          try {
            const mentors = await programsClient.getCohortMentors(cohortIdStr);
            setCohortMentors(mentors.filter((m: any) => m.active !== false) || []);
          } catch (mentorError) {
            console.error('Failed to fetch cohort mentors:', mentorError);
            setCohortMentors([]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch cohort data:', error);
      } finally {
        setLoadingCohortData(false);
      }
    };

    fetchCohortData();
  }, [user?.id, roles]);

  // Don't show community for employers or finance
  if (roles.includes('employer') || roles.includes('finance')) {
    return (
      <Card className="border-och-orange/50">
        <div className="p-6 text-center">
          <Shield className="w-12 h-12 text-och-orange mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Community Access Restricted</h3>
          <p className="text-och-steel">
            {roles.includes('employer')
              ? 'Employers access student profiles through the Marketplace integration.'
              : 'Finance role does not have access to community features.'}
          </p>
        </div>
      </Card>
    );
  }

  const roleDisplayName = primaryRole
    ? primaryRole.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    : 'User';

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-defender">Community</h1>
            <p className="text-och-steel">
              Connect, learn, and grow with your university and the OCH ecosystem
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="defender">{roleDisplayName}</Badge>
              {permissions.canModerate && (
                <Badge variant="mint" className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Moderator
                </Badge>
              )}
              {permissions.canModerateAll && (
                <Badge variant="gold" className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Platform Admin
                </Badge>
              )}
            </div>
          </div>
          {permissions.canPost && (
            <Button
              variant="defender"
              onClick={() => setShowCreatePost(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Post
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-och-steel/20">
          <button
            onClick={() => setActiveTab('university')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'university'
                ? 'text-och-defender border-och-defender'
                : 'text-och-steel border-transparent hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              My University
            </div>
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'global'
                ? 'text-och-defender border-och-defender'
                : 'text-och-steel border-transparent hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Global Feed
              {permissions.readOnlyAccess && (
                <Badge variant="steel" className="text-xs ml-1">Read Only</Badge>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'leaderboard'
                ? 'text-och-defender border-och-defender'
                : 'text-och-steel border-transparent hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Leaderboard
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'university' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <UniversityCommunityView
                userId={String(user?.id)}
                permissions={permissions}
                roles={roles}
              />
            </div>
            
            {/* Sidebar - Cohort & Mentors (only for students) */}
            {(roles.includes('student') || roles.includes('mentee')) && (
              <div className="lg:col-span-1 space-y-6">
                {/* My Cohort Section */}
                <Card className="p-5 bg-och-midnight/60 border border-och-steel/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-och-steel uppercase tracking-wider">
                      My Cohort
                    </h3>
                    {cohortName && (
                      <Badge variant="defender" className="text-xs">
                        {cohortName}
                      </Badge>
                    )}
                  </div>
                  
                  {loadingCohortData ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : cohortDiscussions.length > 0 ? (
                    <div className="space-y-3">
                      {cohortDiscussions.slice(0, 3).map((discussion: any) => (
                        <button
                          key={discussion.id}
                          onClick={() => {
                            // Scroll to post if it exists in the feed, or navigate
                            const postElement = document.querySelector(`[data-post-id="${discussion.id}"]`);
                            if (postElement) {
                              postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            } else {
                              // Could navigate to a specific post view if available
                              window.location.hash = `post-${discussion.id}`;
                            }
                          }}
                          className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all group"
                        >
                          <div className="flex items-start gap-2">
                            <MessageCircle className="w-4 h-4 text-och-gold mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white uppercase tracking-wide truncate mb-1">
                                {discussion.title || 'Discussion'}
                              </p>
                              <p className="text-xs text-och-steel line-clamp-2">
                                {discussion.content || discussion.excerpt || ''}
                              </p>
                              {discussion.comment_count > 0 && (
                                <div className="flex items-center gap-2 mt-2">
                                  <MessageSquare className="w-3 h-3 text-och-steel" />
                                  <span className="text-xs text-och-steel">
                                    {discussion.comment_count} {discussion.comment_count === 1 ? 'reply' : 'replies'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-och-steel group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0" />
                          </div>
                        </button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-och-steel/30 text-och-steel hover:bg-white/10 text-xs mt-3"
                        onClick={() => router.push('/dashboard/student')}
                      >
                        <ExternalLink className="w-3 h-3 mr-2" />
                        View All Discussions
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <MessageCircle className="w-8 h-8 text-och-steel/50 mx-auto mb-2" />
                      <p className="text-xs text-och-steel mb-3">
                        {cohortName ? `No discussions in ${cohortName} yet` : 'No cohort discussions available'}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-och-steel/30 text-och-steel hover:bg-white/10 text-xs"
                        onClick={() => setShowCreatePost(true)}
                      >
                        Start Discussion
                      </Button>
                    </div>
                  )}
                </Card>

                {/* Reach Out to Mentors Section */}
                <Card className="p-5 bg-och-midnight/60 border border-och-steel/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-och-steel uppercase tracking-wider">
                      Reach Out to Mentors
                    </h3>
                    {cohortMentors.length > 0 && (
                      <Badge variant="mint" className="text-xs">
                        {cohortMentors.length} {cohortMentors.length === 1 ? 'Mentor' : 'Mentors'}
                      </Badge>
                    )}
                  </div>
                  
                  {loadingCohortData ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : cohortMentors.length > 0 ? (
                    <div className="space-y-2">
                      {cohortMentors.slice(0, 4).map((mentor: any) => {
                        const mentorName = mentor.mentor_name || 
                          (mentor.mentor?.first_name && mentor.mentor?.last_name 
                            ? `${mentor.mentor.first_name} ${mentor.mentor.last_name}`
                            : mentor.mentor?.email || 'Mentor');
                        const mentorRole = mentor.role || 'Mentor';
                        
                        return (
                          <button
                            key={mentor.id || mentor.mentor?.id}
                            onClick={() => router.push(`/dashboard/student/mentorship?mentor=${mentor.mentor?.id || mentor.mentor_id}`)}
                            className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all group"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-och-mint/20 flex items-center justify-center flex-shrink-0">
                                <UserCircle className="w-5 h-5 text-och-mint" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white uppercase tracking-wide truncate">
                                  {mentorName}
                                </p>
                                <p className="text-xs text-och-steel capitalize">
                                  {mentorRole}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-och-steel group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0" />
                          </button>
                        );
                      })}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-och-steel/30 text-och-steel hover:bg-white/10 text-xs mt-3"
                        onClick={() => router.push('/dashboard/student/mentorship')}
                      >
                        <ExternalLink className="w-3 h-3 mr-2" />
                        View All Mentors
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <UserCircle className="w-8 h-8 text-och-steel/50 mx-auto mb-2" />
                      <p className="text-xs text-och-steel mb-3">
                        {cohortName ? `No mentors assigned to ${cohortName} yet` : 'No mentors available'}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-och-steel/30 text-och-steel hover:bg-white/10 text-xs"
                        onClick={() => router.push('/dashboard/student/mentorship')}
                      >
                        View Mentorship
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        ) : (
          <>
            {activeTab === 'global' && (
              <GlobalFeedView
                userId={String(user?.id)}
                permissions={permissions}
                roles={roles}
              />
            )}
            {activeTab === 'leaderboard' && (
              <CommunityLeaderboard
                userId={String(user?.id)}
                permissions={permissions}
                roles={roles}
              />
            )}
          </>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && permissions.canPost && (
        <CreatePostModal
          isOpen={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          userId={String(user?.id)}
          permissions={permissions}
        />
      )}
    </div>
  );
}




