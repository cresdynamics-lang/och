/**
 * Community Feed Component
 * Displays trending intelligence and achievements from local or global feeds.
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Heart, Share2, MoreHorizontal, User, Zap, Star } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import clsx from 'clsx';

export function CommunityFeed({ type }: { type: 'university' | 'global' }) {
  const posts = [
    {
      id: 1,
      user: 'Sarah Miller',
      role: 'Defender Pilot',
      university: 'Strathmore University',
      content: 'Just deployed my first SIEM configuration for the Ransomware Response mission. The Recipe Engine was a lifesaver for the log analysis part! 🚀',
      likes: 24,
      comments: 6,
      tags: ['SIEM', 'Defense'],
      isVerified: true
    },
    {
      id: 2,
      user: 'Dr. James Okoro',
      role: 'Program Director',
      university: 'University of Nairobi',
      content: 'Local News: The upcoming Cyber Hackathon is set for next Friday. Ensure your Readiness Score is at least 650 to qualify for the elite track.',
      likes: 89,
      comments: 12,
      tags: ['Hackathon', 'Announcement'],
      isAnnouncement: true
    }
  ];

  const filteredPosts = type === 'university' ? posts : [...posts].reverse();

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {filteredPosts.map((post) => (
          <motion.div
            key={`${type}-${post.id}`}
            layout
            initial={{ opacity: 0, x: type === 'university' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={clsx(
              "p-6 rounded-[2rem] bg-och-steel/5 border border-white/5 hover:border-white/10 transition-all group",
              post.isAnnouncement && "bg-gradient-to-r from-och-mint/5 to-transparent border-och-mint/10"
            )}
          >
            <div className="flex justify-between items-start mb-4">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-och-midnight border border-white/10 flex items-center justify-center">
                     <User className="w-5 h-5 text-och-steel" />
                  </div>
                  <div>
                     <div className="flex items-center gap-2">
                        <h5 className="text-xs font-black text-white uppercase tracking-tight leading-none">{post.user}</h5>
                        {post.isVerified && <Zap className="w-3 h-3 text-och-gold" />}
                     </div>
                     <p className="text-[9px] text-och-steel font-black uppercase tracking-widest mt-1">
                        {post.role} • {post.university}
                     </p>
                  </div>
               </div>
               <button className="text-och-steel hover:text-white transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
               </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4 italic">
               "{post.content}"
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
               {post.tags.map(tag => (
                 <Badge key={tag} variant="outline" className="text-[8px] font-black uppercase tracking-tighter border-och-steel/20 text-och-steel">
                    #{tag}
                 </Badge>
               ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
               <div className="flex items-center gap-6">
                  <button className="flex items-center gap-1.5 text-[10px] text-och-steel hover:text-och-gold transition-colors font-black">
                     <Heart className="w-4 h-4" />
                     {post.likes}
                  </button>
                  <button className="flex items-center gap-1.5 text-[10px] text-och-steel hover:text-och-gold transition-colors font-black">
                     <MessageSquare className="w-4 h-4" />
                     {post.comments}
                  </button>
               </div>
               <button className="text-och-steel hover:text-white transition-colors">
                  <Share2 className="w-4 h-4" />
               </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

