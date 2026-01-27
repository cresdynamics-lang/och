'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Users, ExternalLink, Send, Hash, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

interface CommunityMessage {
  id: string;
  author: {
    id: string;
    email: string;
    display_name: string;
  };
  body: string;
  created_at: string;
  reactions: Array<{
    emoji: string;
    count: number;
    users: string[];
  }>;
}

interface MissionCommunitySidebarProps {
  missionId: string;
  missionTitle: string;
  className?: string;
}

export default function MissionCommunitySidebar({
  missionId,
  missionTitle,
  className = ''
}: MissionCommunitySidebarProps) {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    // In production, fetch the mission's community thread
    // For now, simulate finding or creating a thread
    const mockThreadId = `mission-${missionId}-thread`;
    setThreadId(mockThreadId);

    // Mock recent messages
    const mockMessages: CommunityMessage[] = [
      {
        id: 'msg-1',
        author: { id: 'user-1', email: 'mentor@och.edu', display_name: 'Sarah Mentor' },
        body: 'Great question! The key is to look at the event logs first. Check Event ID 4625 for failed logins.',
        created_at: '2026-01-27T14:30:00Z',
        reactions: [{ emoji: '👍', count: 3, users: ['user-2', 'user-3', 'user-4'] }]
      },
      {
        id: 'msg-2',
        author: { id: 'user-2', email: 'student2@och.edu', display_name: 'Alex Chen' },
        body: 'Thanks Sarah! That helped me identify the suspicious IPs. Now working on the correlation part.',
        created_at: '2026-01-27T15:45:00Z',
        reactions: [{ emoji: '✅', count: 1, users: ['user-1'] }]
      }
    ];

    setMessages(mockMessages);
    setMessageCount(12); // Total messages in thread
    setLoading(false);
  }, [missionId]);

  const handleSendMessage = async (message: string) => {
    if (!threadId) return;

    try {
      // Mock sending message
      const newMessage: CommunityMessage = {
        id: `msg-${Date.now()}`,
        author: { id: 'current-user', email: 'user@och.edu', display_name: 'You' },
        body: message,
        created_at: new Date().toISOString(),
        reactions: []
      };

      setMessages(prev => [newMessage, ...prev.slice(0, 4)]); // Keep only recent 5
      setMessageCount(prev => prev + 1);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className={`bg-slate-900 border border-slate-700 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold">Mission Discussion</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-white"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </div>

        <p className="text-slate-400 text-sm mt-1 truncate" title={missionTitle}>
          {missionTitle}
        </p>

        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
            {messageCount} messages
          </Badge>
          <Badge variant="outline" className="text-xs text-green-400 border-green-400">
            Active discussion
          </Badge>
        </div>
      </div>

      {/* Collapsed State */}
      {!isExpanded && (
        <div className="p-4">
          <p className="text-slate-400 text-sm mb-3">
            Join the conversation about this mission with other students and mentors.
          </p>
          <div className="space-y-2">
            {messages.slice(0, 2).map(message => (
              <div key={message.id} className="text-xs">
                <span className="text-white font-medium">{message.author.display_name}:</span>
                <span className="text-slate-400 ml-1 line-clamp-1">{message.body}</span>
              </div>
            ))}
            {messageCount > 2 && (
              <p className="text-slate-500 text-xs">+{messageCount - 2} more messages...</p>
            )}
          </div>
        </div>
      )}

      {/* Expanded State */}
      {isExpanded && (
        <>
          {/* Recent Messages */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-slate-400">
                Loading discussion...
              </div>
            ) : messages.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No discussions yet</p>
                <p className="text-xs mt-1">Be the first to ask a question!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {messages.map(message => (
                  <div key={message.id} className="p-3 hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-medium">
                          {message.author.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white text-sm font-medium">
                            {message.author.display_name}
                          </span>
                          <span className="text-slate-500 text-xs">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed">
                          {message.body}
                        </p>
                        {message.reactions.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {message.reactions.map((reaction, idx) => (
                              <span key={idx} className="text-xs bg-slate-700 px-2 py-1 rounded">
                                {reaction.emoji} {reaction.count}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Message Input */}
          <div className="p-3 border-t border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask a question or share your approach..."
                className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    handleSendMessage(e.currentTarget.value.trim());
                    e.currentTarget.value = '';
                  }
                }}
              />
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-slate-500 text-xs mt-1">
              Press Enter to send • Messages are moderated
            </p>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-slate-700 bg-slate-900/50">
        <Link href={`/community/spaces/defender-beginner?channel=missions&thread=mission-${missionId}-thread`}>
          <Button variant="outline" size="sm" className="w-full text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Full Discussion
          </Button>
        </Link>
      </div>
    </div>
  );
}
