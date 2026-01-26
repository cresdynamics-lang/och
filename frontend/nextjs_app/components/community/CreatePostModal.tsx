/**
 * Create Post Modal Component
 * Allows users to create posts based on their permissions
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { X, Image, Video, Calendar, Megaphone } from 'lucide-react';
import type { CommunityPermissions } from './CommunityDashboard';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  permissions: CommunityPermissions;
}

type PostType = 'discussion' | 'announcement' | 'event';

export function CreatePostModal({
  isOpen,
  onClose,
  userId,
  permissions,
}: CreatePostModalProps) {
  const [postType, setPostType] = useState<PostType>('discussion');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      // TODO: Call Django API
      // await apiGateway.post('/community/posts', {
      //   title,
      //   content,
      //   post_type: postType,
      //   tags,
      //   event_date: postType === 'event' ? eventDate : undefined,
      //   event_time: postType === 'event' ? eventTime : undefined,
      // });
      console.log('Creating post:', { title, content, postType, tags });
      
      // Reset form
      setTitle('');
      setContent('');
      setTags([]);
      setTagInput('');
      setEventDate('');
      setEventTime('');
      onClose();
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Create New Post</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-och-midnight/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-och-steel" />
            </button>
          </div>

          {/* Post Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">Post Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setPostType('discussion')}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  postType === 'discussion'
                    ? 'border-och-defender bg-och-defender/20 text-white'
                    : 'border-och-steel/20 text-och-steel hover:border-och-defender/50'
                }`}
              >
                Discussion
              </button>
              {permissions.canPinEvents && (
                <button
                  onClick={() => setPostType('announcement')}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                    postType === 'announcement'
                      ? 'border-och-orange bg-och-orange/20 text-white'
                      : 'border-och-steel/20 text-och-steel hover:border-och-orange/50'
                  }`}
                >
                  <Megaphone className="w-4 h-4" />
                  Announcement
                </button>
              )}
              {permissions.canPinEvents && (
                <button
                  onClick={() => setPostType('event')}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                    postType === 'event'
                      ? 'border-och-mint bg-och-mint/20 text-white'
                      : 'border-och-steel/20 text-och-steel hover:border-och-mint/50'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Event
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-white mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title..."
              className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
            />
          </div>

          {/* Content */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-white mb-2">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={6}
              className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender resize-none"
            />
          </div>

          {/* Event Date/Time */}
          {postType === 'event' && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Event Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Event Time</label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                />
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add a tag..."
                className="flex-1 px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
              />
              <Button variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-och-defender/20 text-och-defender rounded text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-och-orange"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="defender"
              onClick={handleSubmit}
              disabled={!title.trim() || !content.trim() || isSubmitting}
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
