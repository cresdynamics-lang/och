'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Users, Send, Hash, ExternalLink, HelpCircle, ThumbsUp, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import Link from 'next/link';

interface DiscussionMessage {
  id: string;
  author: {
    id: string;
    email: string;
    display_name: string;
    role?: string;
  };
  body: string;
  created_at: string;
  helpful_votes?: number;
  is_solution?: boolean;
}

interface RecipeDiscussionProps {
  recipeSlug: string;
  recipeTitle: string;
}

function DiscussionThread({
  messages,
  onSendMessage,
  onMarkHelpful,
  onMarkSolution
}: {
  messages: DiscussionMessage[];
  onSendMessage: (message: string) => void;
  onMarkHelpful: (messageId: string) => void;
  onMarkSolution: (messageId: string) => void;
}) {
  const [newMessage, setNewMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
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
    <div className="space-y-4">
      {/* Messages */}
      <div className="space-y-4">
        {messages.map(message => (
          <Card key={message.id} className="p-4 bg-slate-900/50 border-slate-700">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium text-sm">
                  {message.author.display_name.charAt(0).toUpperCase()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white font-medium">
                    {message.author.display_name}
                  </span>
                  {message.author.role && (
                    <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
                      {message.author.role}
                    </Badge>
                  )}
                  {message.is_solution && (
                    <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                      Solution
                    </Badge>
                  )}
                  <span className="text-slate-500 text-sm">
                    {formatTime(message.created_at)}
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed mb-3">
                  {message.body}
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onMarkHelpful(message.id)}
                    className="flex items-center gap-1 text-slate-400 hover:text-green-400 transition-colors text-sm"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>Helpful ({message.helpful_votes || 0})</span>
                  </button>

                  {!message.is_solution && (
                    <button
                      onClick={() => onMarkSolution(message.id)}
                      className="flex items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors text-sm"
                    >
                      <Lightbulb className="w-4 h-4" />
                      Mark as Solution
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* New Message Form */}
      <Card className="p-4 bg-slate-900/50 border-slate-700">
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Share your experience, ask a question, or help others with this recipe..."
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 resize-none min-h-[100px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            rows={4}
          />

          <div className="flex items-center justify-between">
            <p className="text-slate-500 text-sm">
              Be respectful and helpful • Messages are moderated
            </p>
            <Button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4 mr-2" />
              Post Discussion
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function RecipeDiscussion({ recipeSlug, recipeTitle }: RecipeDiscussionProps) {
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discussion');

  useEffect(() => {
    // Mock loading discussion data
    const mockMessages: DiscussionMessage[] = [
      {
        id: 'msg-1',
        author: {
          id: 'user-1',
          email: 'student1@och.edu',
          display_name: 'Maria Garcia',
          role: 'Student'
        },
        body: 'This recipe helped me understand log parsing much better! The regex examples are really clear. Has anyone tried adapting this for Windows event logs?',
        created_at: '2026-01-26T10:30:00Z',
        helpful_votes: 5,
        is_solution: false
      },
      {
        id: 'msg-2',
        author: {
          id: 'mentor-1',
          email: 'mentor@och.edu',
          display_name: 'David Chen',
          role: 'Mentor'
        },
        body: 'Great question Maria! Yes, you can adapt this for Windows logs. The key difference is that Windows Event Logs use XML structure instead of plain text. Here\'s a modified version that works with .evtx files...',
        created_at: '2026-01-26T11:15:00Z',
        helpful_votes: 8,
        is_solution: true
      },
      {
        id: 'msg-3',
        author: {
          id: 'user-2',
          email: 'student2@och.edu',
          display_name: 'Alex Johnson',
          role: 'Student'
        },
        body: 'Thanks for the detailed explanation David! I\'m going to try this with the failed login hunt mission. The XML parsing part was the missing piece for me.',
        created_at: '2026-01-26T14:20:00Z',
        helpful_votes: 3,
        is_solution: false
      }
    ];

    setTimeout(() => {
      setMessages(mockMessages);
      setLoading(false);
    }, 1000);
  }, [recipeSlug]);

  const handleSendMessage = async (message: string) => {
    const newMessage: DiscussionMessage = {
      id: `msg-${Date.now()}`,
      author: {
        id: 'current-user',
        email: 'user@och.edu',
        display_name: 'You',
        role: 'Student'
      },
      body: message,
      created_at: new Date().toISOString(),
      helpful_votes: 0,
      is_solution: false
    };

    setMessages(prev => [newMessage, ...prev]);
  };

  const handleMarkHelpful = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, helpful_votes: (msg.helpful_votes || 0) + 1 }
          : msg
      )
    );
  };

  const handleMarkSolution = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg => ({ ...msg, is_solution: msg.id === messageId }))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-blue-400" />
          <div>
            <h3 className="text-xl font-bold text-white">Recipe Discussion</h3>
            <p className="text-slate-400 text-sm">{recipeTitle}</p>
          </div>
        </div>

        <Link href={`/community/spaces/defender-beginner?channel=recipes&thread=recipe-${recipeSlug}`}>
          <Button variant="outline" className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in Community
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-slate-800">
          <TabsTrigger value="discussion" className="data-[state=active]:bg-blue-600">
            <MessageSquare className="w-4 h-4 mr-2" />
            Discussion ({messages.length})
          </TabsTrigger>
          <TabsTrigger value="tips" className="data-[state=active]:bg-blue-600">
            <Lightbulb className="w-4 h-4 mr-2" />
            Tips & Tricks
          </TabsTrigger>
          <TabsTrigger value="help" className="data-[state=active]:bg-blue-600">
            <HelpCircle className="w-4 h-4 mr-2" />
            Need Help?
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discussion" className="mt-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400">Loading discussions...</p>
            </div>
          ) : (
            <DiscussionThread
              messages={messages}
              onSendMessage={handleSendMessage}
              onMarkHelpful={handleMarkHelpful}
              onMarkSolution={handleMarkSolution}
            />
          )}
        </TabsContent>

        <TabsContent value="tips" className="mt-6">
          <Card className="p-6 bg-slate-900/50 border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <h4 className="text-white font-semibold">Community Tips & Tricks</h4>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <h5 className="text-white font-medium mb-2">Performance Optimization</h5>
                <p className="text-slate-300 text-sm">
                  Use buffered reading for large log files to avoid memory issues. The community has shared several optimized versions.
                </p>
              </div>

              <div className="p-4 bg-slate-800/50 rounded-lg">
                <h5 className="text-white font-medium mb-2">Cross-Platform Compatibility</h5>
                <p className="text-slate-300 text-sm">
                  Check out the Windows-specific adaptations shared in the discussion thread for better event log parsing.
                </p>
              </div>

              <div className="p-4 bg-slate-800/50 rounded-lg">
                <h5 className="text-white font-medium mb-2">Error Handling</h5>
                <p className="text-slate-300 text-sm">
                  Always add try-catch blocks around file operations. Several users have shared robust error handling patterns.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="help" className="mt-6">
          <Card className="p-6 bg-slate-900/50 border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle className="w-5 h-5 text-red-400" />
              <h4 className="text-white font-semibold">Need Help with this Recipe?</h4>
            </div>

            <div className="space-y-4">
              <p className="text-slate-300">
                Having trouble with this recipe? The community is here to help! Here are some quick ways to get assistance:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <Link href={`/community/spaces/defender-beginner?channel=help`}>
                  <Card className="p-4 bg-slate-800/50 border-slate-600 hover:border-blue-400 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                      <Hash className="w-5 h-5 text-blue-400" />
                      <h5 className="text-white font-medium">Ask in #help</h5>
                    </div>
                    <p className="text-slate-400 text-sm">
                      Post your question in the help channel for quick responses from mentors and peers.
                    </p>
                  </Card>
                </Link>

                <Link href={`/community/spaces/defender-beginner?channel=recipes&thread=recipe-${recipeSlug}`}>
                  <Card className="p-4 bg-slate-800/50 border-slate-600 hover:border-green-400 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                      <MessageSquare className="w-5 h-5 text-green-400" />
                      <h5 className="text-white font-medium">Recipe-Specific Thread</h5>
                    </div>
                    <p className="text-slate-400 text-sm">
                      Join others discussing this specific recipe and share your challenges.
                    </p>
                  </Card>
                </Link>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <p className="text-slate-400 text-sm text-center">
                  💡 Pro tip: Include error messages and what you've tried so far for faster help!
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Community Stats */}
      <Card className="p-4 bg-slate-900/50 border-slate-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-400">{messages.length}</div>
            <div className="text-slate-400 text-sm">Discussions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">
              {messages.reduce((acc, msg) => acc + (msg.helpful_votes || 0), 0)}
            </div>
            <div className="text-slate-400 text-sm">Helpful Votes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">
              {messages.filter(m => m.is_solution).length}
            </div>
            <div className="text-slate-400 text-sm">Solutions</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
