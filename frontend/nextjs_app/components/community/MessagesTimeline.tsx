'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Plus, Smile, Paperclip, Reply, Flag, MoreVertical, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface CommunityMessage {
  id: string;
  author: {
    id: string;
    email: string;
    display_name: string;
  };
  body: string;
  reply_to_message_id: string | null;
  has_ai_flag: boolean;
  ai_flag_reason?: string;
  created_at: string;
  reactions: MessageReaction[];
}

interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

interface MessagesTimelineProps {
  messages: CommunityMessage[];
  currentUserId: string;
  onSendMessage: (body: string, replyToId?: string) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onFlagMessage: (messageId: string, reason: string) => void;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  readOnly?: boolean;
}

function MessageItem({
  message,
  currentUserId,
  onReply,
  onAddReaction,
  onFlagMessage,
  isReply = false
}: {
  message: CommunityMessage;
  currentUserId: string;
  onReply: (messageId: string) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onFlagMessage: (messageId: string) => void;
  isReply?: boolean;
}) {
  const [showReactions, setShowReactions] = useState(false);
  const [userReaction, setUserReaction] = useState<string | null>(null);

  useEffect(() => {
    // Check if current user has reacted
    const userReaction = message.reactions.find(r => r.users.includes(currentUserId));
    setUserReaction(userReaction?.emoji || null);
  }, [message.reactions, currentUserId]);

  const handleReaction = (emoji: string) => {
    onAddReaction(message.id, emoji);
    setUserReaction(userReaction === emoji ? null : emoji);
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

  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  return (
    <div className={`group hover:bg-slate-800/50 px-4 py-2 transition-colors ${isReply ? 'ml-8 border-l-2 border-slate-600' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-medium text-sm">
            {message.author.display_name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-medium text-sm">
              {message.author.display_name}
            </span>
            <span className="text-slate-500 text-xs">
              {formatTime(message.created_at)}
            </span>
            {message.has_ai_flag && (
              <Badge variant="outline" className="text-xs border-orange-500 text-orange-400">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Flagged
              </Badge>
            )}
          </div>

          <div className="text-slate-100 leading-relaxed">
            {message.body}
          </div>

          {/* Reactions */}
          {message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.map((reaction, index) => (
                <button
                  key={`${reaction.emoji}-${index}`}
                  onClick={() => handleReaction(reaction.emoji)}
                  className={`flex items-center gap-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors ${
                    userReaction === reaction.emoji ? 'ring-1 ring-blue-500' : ''
                  }`}
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-xs text-slate-300">{reaction.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Message Actions */}
          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="text-slate-400 hover:text-slate-300 text-sm flex items-center gap-1"
            >
              <Smile className="w-3 h-3" />
              React
            </button>
            <button
              onClick={() => onReply(message.id)}
              className="text-slate-400 hover:text-slate-300 text-sm flex items-center gap-1"
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>
            <button
              onClick={() => onFlagMessage(message.id)}
              className="text-slate-400 hover:text-red-400 text-sm flex items-center gap-1"
            >
              <Flag className="w-3 h-3" />
              Flag
            </button>
          </div>

          {/* Reaction Picker */}
          {showReactions && (
            <div className="mt-2 p-2 bg-slate-800 rounded-lg border border-slate-600">
              <div className="flex gap-1">
                {commonEmojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      handleReaction(emoji);
                      setShowReactions(false);
                    }}
                    className="w-8 h-8 hover:bg-slate-700 rounded flex items-center justify-center transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageComposer({
  onSendMessage,
  replyToMessage,
  onCancelReply
}: {
  onSendMessage: (body: string, replyToId?: string) => void;
  replyToMessage?: CommunityMessage;
  onCancelReply?: () => void;
}) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim(), replyToMessage?.id);
      setMessage('');
      if (onCancelReply) onCancelReply();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="border-t border-slate-700 bg-slate-900 p-4">
      {/* Reply Preview */}
      {replyToMessage && (
        <div className="mb-3 p-3 bg-slate-800 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Reply className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm font-medium">
                Replying to {replyToMessage.author.display_name}
              </span>
            </div>
            <button
              onClick={onCancelReply}
              className="text-slate-400 hover:text-slate-300"
            >
              ✕
            </button>
          </div>
          <p className="text-slate-300 text-sm mt-1 line-clamp-2">
            {replyToMessage.body}
          </p>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${replyToMessage ? 'reply' : 'channel'}`}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 resize-none min-h-[44px] max-h-32 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            rows={1}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-slate-300"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button
            type="submit"
            disabled={!message.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function MessagesTimeline({
  messages,
  currentUserId,
  onSendMessage,
  onAddReaction,
  onFlagMessage,
  loading = false,
  hasMore = false,
  onLoadMore,
  readOnly = false
}: MessagesTimelineProps) {
  const [replyToMessage, setReplyToMessage] = useState<CommunityMessage | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleReply = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    setReplyToMessage(message);
  };

  const handleFlagMessage = async (messageId: string) => {
    const reason = prompt('Why are you flagging this message?');
    if (reason) {
      onFlagMessage(messageId, reason);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {hasMore && onLoadMore && (
          <div className="p-4 text-center">
            <Button
              variant="outline"
              onClick={onLoadMore}
              disabled={loading}
            >
              Load Earlier Messages
            </Button>
          </div>
        )}

        {loading && (
          <div className="p-4 text-center text-slate-400">
            Loading messages...
          </div>
        )}

        <div className="space-y-1">
          {messages.map(message => (
            <MessageItem
              key={message.id}
              message={message}
              currentUserId={currentUserId}
              onReply={handleReply}
              onAddReaction={onAddReaction}
              onFlagMessage={handleFlagMessage}
            />
          ))}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      {!readOnly ? (
        <MessageComposer
          onSendMessage={onSendMessage}
          replyToMessage={replyToMessage}
          onCancelReply={() => setReplyToMessage(undefined)}
        />
      ) : (
        <div className="border-t border-slate-700 bg-slate-900 p-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg border border-slate-600">
              <span className="text-slate-400">👁️</span>
              <span className="text-slate-400 text-sm">Read-only access</span>
            </div>
            <p className="text-slate-500 text-xs mt-2">
              Employer guests have view-only access to community discussions
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
