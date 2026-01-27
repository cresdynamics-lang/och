'use client';

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, X, Eye, MessageSquare, Flag, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

interface FlaggedMessage {
  id: string;
  body: string;
  author: {
    id: string;
    email: string;
    display_name: string;
  };
  thread: {
    id: string;
    title: string;
    channel_title: string;
    space_title: string;
  };
  has_ai_flag: boolean;
  ai_flag_reason: string;
  ai_confidence_score: number;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'edited';
}

interface ModerationStats {
  total_flagged: number;
  pending_review: number;
  approved_today: number;
  rejected_today: number;
  ai_accuracy: number;
}

export default function ModerationDashboard() {
  const [flaggedMessages, setFlaggedMessages] = useState<FlaggedMessage[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<FlaggedMessage | null>(null);

  useEffect(() => {
    const fetchModerationData = async () => {
      try {
        // Mock data - replace with API calls
        const mockStats: ModerationStats = {
          total_flagged: 24,
          pending_review: 8,
          approved_today: 12,
          rejected_today: 3,
          ai_accuracy: 87.5
        };

        const mockMessages: FlaggedMessage[] = [
          {
            id: 'msg-1',
            body: 'This is clearly a violation of community guidelines. Students should not share mission solutions directly.',
            author: {
              id: 'user-1',
              email: 'student1@och.edu',
              display_name: 'Alex Johnson'
            },
            thread: {
              id: 'thread-1',
              title: 'Help with Failed Login Hunt',
              channel_title: '#defender-beginner-help',
              space_title: 'Defender Beginner'
            },
            has_ai_flag: true,
            ai_flag_reason: 'Potential cheating - sharing mission solutions',
            ai_confidence_score: 0.92,
            created_at: '2026-01-27T10:30:00Z',
            status: 'pending'
          },
          {
            id: 'msg-2',
            body: 'Anyone know how to hack into the system? I need the admin password.',
            author: {
              id: 'user-2',
              email: 'student2@och.edu',
              display_name: 'Maria Garcia'
            },
            thread: {
              id: 'thread-2',
              title: 'General Questions',
              channel_title: '#defender-beginner-general',
              space_title: 'Defender Beginner'
            },
            has_ai_flag: true,
            ai_flag_reason: 'Potentially harmful content - hacking references',
            ai_confidence_score: 0.78,
            created_at: '2026-01-27T09:15:00Z',
            status: 'pending'
          }
        ];

        setStats(mockStats);
        setFlaggedMessages(mockMessages);
      } catch (error) {
        console.error('Failed to fetch moderation data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModerationData();
  }, []);

  const handleModerateMessage = async (messageId: string, action: 'approve' | 'reject' | 'edit', reason?: string) => {
    try {
      // Mock API call
      console.log(`Moderating message ${messageId} with action: ${action}`, { reason });

      // Update local state
      setFlaggedMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'edited' }
            : msg
        )
      );

      setSelectedMessage(null);
    } catch (error) {
      console.error('Failed to moderate message:', error);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-red-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">Rejected</Badge>;
      case 'edited':
        return <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">Edited</Badge>;
      default:
        return <Badge variant="outline" className="text-yellow-400 border-yellow-400">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading moderation dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Community Moderation</h1>
              <p className="text-slate-400">Review flagged content and maintain community standards</p>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="p-4 bg-slate-900/50 border-slate-700">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <div>
                    <div className="text-xl font-bold text-white">{stats.total_flagged}</div>
                    <div className="text-xs text-slate-400">Total Flagged</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-slate-900/50 border-slate-700">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-orange-400" />
                  <div>
                    <div className="text-xl font-bold text-white">{stats.pending_review}</div>
                    <div className="text-xs text-slate-400">Pending Review</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-slate-900/50 border-slate-700">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-xl font-bold text-white">{stats.approved_today}</div>
                    <div className="text-xs text-slate-400">Approved Today</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-slate-900/50 border-slate-700">
                <div className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-400" />
                  <div>
                    <div className="text-xl font-bold text-white">{stats.rejected_today}</div>
                    <div className="text-xs text-slate-400">Rejected Today</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-slate-900/50 border-slate-700">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-xl font-bold text-white">{stats.ai_accuracy}%</div>
                    <div className="text-xs text-slate-400">AI Accuracy</div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Flagged Messages List */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 border-slate-700">
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Flag className="w-5 h-5 text-red-400" />
                  Flagged Content
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Review messages flagged by AI or community reports
                </p>
              </div>

              <div className="divide-y divide-slate-700">
                {flaggedMessages.map(message => (
                  <div
                    key={message.id}
                    className="p-4 hover:bg-slate-800/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-white font-medium">{message.author.display_name}</span>
                          {getStatusBadge(message.status)}
                          <span className={`text-sm ${getConfidenceColor(message.ai_confidence_score)}`}>
                            {Math.round(message.ai_confidence_score * 100)}% confidence
                          </span>
                        </div>

                        <p className="text-slate-300 text-sm line-clamp-2 mb-2">
                          {message.body}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>{message.thread.space_title} → {message.thread.channel_title}</span>
                          <span>{new Date(message.created_at).toLocaleDateString()}</span>
                        </div>

                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs text-red-400 border-red-400">
                            {message.ai_flag_reason}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {flaggedMessages.length === 0 && (
                  <div className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <p className="text-slate-400">No flagged content to review</p>
                    <p className="text-slate-500 text-sm mt-1">All community content is clean!</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Message Detail & Actions */}
          <div>
            {selectedMessage ? (
              <Card className="bg-slate-900/50 border-slate-700">
                <div className="p-6 border-b border-slate-700">
                  <h3 className="text-lg font-bold text-white">Review Message</h3>
                  <p className="text-slate-400 text-sm mt-1">Take moderation action</p>
                </div>

                <div className="p-6">
                  {/* Message Details */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {selectedMessage.author.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{selectedMessage.author.display_name}</p>
                        <p className="text-slate-400 text-sm">{selectedMessage.author.email}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-800 rounded-lg mb-4">
                      <p className="text-slate-300">{selectedMessage.body}</p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Posted in:</span>
                        <span className="text-slate-300">{selectedMessage.thread.channel_title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">AI Confidence:</span>
                        <span className={getConfidenceColor(selectedMessage.ai_confidence_score)}>
                          {Math.round(selectedMessage.ai_confidence_score * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Reason:</span>
                        <span className="text-red-400">{selectedMessage.ai_flag_reason}</span>
                      </div>
                    </div>
                  </div>

                  {/* Moderation Actions */}
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleModerateMessage(selectedMessage.id, 'approve')}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Content
                    </Button>

                    <Button
                      onClick={() => handleModerateMessage(selectedMessage.id, 'reject', 'Violates community guidelines')}
                      variant="outline"
                      className="w-full border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject & Remove
                    </Button>

                    <Button
                      onClick={() => handleModerateMessage(selectedMessage.id, 'edit')}
                      variant="outline"
                      className="w-full border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Edit Content
                    </Button>

                    <Button
                      onClick={() => setSelectedMessage(null)}
                      variant="ghost"
                      className="w-full text-slate-400 hover:text-slate-300"
                    >
                      Cancel Review
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="bg-slate-900/50 border-slate-700 p-8 text-center">
                <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Select a Message</h3>
                <p className="text-slate-400 text-sm">
                  Choose a flagged message from the list to review and take moderation action
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
