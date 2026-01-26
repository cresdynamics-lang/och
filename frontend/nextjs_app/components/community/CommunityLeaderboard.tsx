/**
 * Community Leaderboard Component
 * Shows rankings for individual and university-wide leaderboards
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Trophy, Medal, Award, Users, TrendingUp } from 'lucide-react';
import type { CommunityPermissions } from './CommunityDashboard';
import type { Role } from '@/utils/rbac';

interface CommunityLeaderboardProps {
  userId?: string;
  permissions: CommunityPermissions;
  roles: Role[];
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  user_email: string;
  university_name: string;
  points: number;
  posts_count: number;
  reactions_received: number;
  comments_count: number;
  badges: string[];
  phase?: string;
  circle?: string;
  is_current_user?: boolean;
}

type LeaderboardType = 'individual' | 'university';

export function CommunityLeaderboard({
  userId,
  permissions,
  roles,
}: CommunityLeaderboardProps) {
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('individual');
  const [individualRankings, setIndividualRankings] = useState<LeaderboardEntry[]>([]);
  const [universityRankings, setUniversityRankings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    // TODO: Fetch from Django API
    // const fetchLeaderboard = async () => {
    //   try {
    //     if (leaderboardType === 'individual') {
    //       const response = await apiGateway.get('/community/leaderboard/individual');
    //       setIndividualRankings(response.results || []);
    //       const userEntry = response.results?.find((e: LeaderboardEntry) => e.user_id === userId);
    //       setUserRank(userEntry?.rank || null);
    //     } else {
    //       const response = await apiGateway.get('/community/leaderboard/university');
    //       setUniversityRankings(response.results || []);
    //     }
    //   } catch (error) {
    //     console.error('Failed to fetch leaderboard:', error);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    // fetchLeaderboard();

    // Mock data
    setTimeout(() => {
      setIndividualRankings([
        {
          rank: 1,
          user_id: 'user-1',
          user_name: 'Top Contributor',
          user_email: 'top@university.edu',
          university_name: 'University A',
          points: 1250,
          posts_count: 45,
          reactions_received: 320,
          comments_count: 89,
          badges: ['top_contributor', 'active_member'],
          phase: 'Phase 2',
          circle: 'Circle 3',
        },
        {
          rank: 2,
          user_id: userId || 'user-2',
          user_name: 'You',
          user_email: 'you@university.edu',
          university_name: 'Your University',
          points: 980,
          posts_count: 32,
          reactions_received: 245,
          comments_count: 67,
          badges: ['active_member'],
          phase: 'Phase 1',
          circle: 'Circle 2',
          is_current_user: true,
        },
      ]);
      setUserRank(2);
      setIsLoading(false);
    }, 500);
  }, [leaderboardType, userId]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-och-gold" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-och-steel" />;
    if (rank === 3) return <Award className="w-5 h-5 text-och-orange" />;
    return <span className="text-och-steel font-bold">#{rank}</span>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-och-midnight/50 rounded w-3/4"></div>
              <div className="h-4 bg-och-midnight/50 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Type Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLeaderboardType('individual')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
              leaderboardType === 'individual'
                ? 'bg-och-defender text-white'
                : 'bg-och-midnight/50 text-och-steel hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Individual Rankings
          </button>
          <button
            onClick={() => setLeaderboardType('university')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
              leaderboardType === 'university'
                ? 'bg-och-defender text-white'
                : 'bg-och-midnight/50 text-och-steel hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            University Rankings
          </button>
        </div>
      </Card>

      {/* User Rank Card */}
      {leaderboardType === 'individual' && userRank && (
        <Card className="border-och-defender/50 bg-och-defender/10">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-och-steel mb-1">Your Rank</p>
                <p className="text-3xl font-bold text-och-defender">#{userRank}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-och-steel mb-1">Total Points</p>
                <p className="text-2xl font-bold text-white">
                  {individualRankings.find((e) => e.is_current_user)?.points || 0}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Individual Leaderboard */}
      {leaderboardType === 'individual' && (
        <div className="space-y-3">
          {individualRankings.map((entry) => (
            <Card
              key={entry.user_id}
              className={entry.is_current_user ? 'border-och-defender bg-och-defender/10' : ''}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">
                          {entry.is_current_user ? 'You' : entry.user_name}
                        </span>
                        {entry.phase && (
                          <Badge variant="mint" className="text-xs">
                            {entry.phase}
                          </Badge>
                        )}
                        {entry.circle && (
                          <Badge variant="gold" className="text-xs">
                            Circle {entry.circle}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-och-steel">
                        {entry.university_name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-och-defender">{entry.points}</div>
                    <div className="text-xs text-och-steel">points</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-och-steel/20 text-xs text-och-steel">
                  <span>{entry.posts_count} posts</span>
                  <span>{entry.reactions_received} reactions</span>
                  <span>{entry.comments_count} comments</span>
                  {entry.badges.length > 0 && (
                    <div className="flex items-center gap-1 ml-auto">
                      {entry.badges.map((badge) => (
                        <Badge key={badge} variant="gold" className="text-xs">
                          {badge.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* University Leaderboard */}
      {leaderboardType === 'university' && (
        <div className="space-y-3">
          {universityRankings.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-och-steel">University rankings coming soon!</p>
            </Card>
          ) : (
            universityRankings.map((university, index) => (
              <Card key={university.id}>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12">
                        {getRankIcon(index + 1)}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{university.name}</div>
                        <div className="text-xs text-och-steel">
                          {university.total_members} members
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-och-defender">
                        {university.total_points}
                      </div>
                      <div className="text-xs text-och-steel">points</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}




