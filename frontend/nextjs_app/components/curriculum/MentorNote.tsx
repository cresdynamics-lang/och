/**
 * MentorNote Component
 * 
 * Professional tier exclusive mentor guidance for curriculum modules.
 */
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, User, Sparkles, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiGateway } from '@/services/apiGateway';

interface MentorNoteProps {
  moduleId: string;
  moduleTitle: string;
}

interface MentorNoteData {
  note: string;
  mentor_name?: string;
  mentor_avatar?: string;
  updated_at?: string;
}

export function MentorNote({ moduleId, moduleTitle }: MentorNoteProps) {
  const [note, setNote] = useState<MentorNoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const fetchMentorNote = async () => {
      if (!moduleId) return;
      
      setLoading(true);
      try {
        const response = await apiGateway.get<{ mentor_notes?: string }>(
          `/curriculum/modules/${moduleId}/`
        );
        
        if (response.mentor_notes) {
          setNote({
            note: response.mentor_notes,
            mentor_name: 'Prof. Kariuki',
            updated_at: new Date().toISOString(),
          });
        } else {
          setNote(null);
        }
      } catch (err) {
        console.error('Error fetching mentor note:', err);
        setNote(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMentorNote();
  }, [moduleId]);

  if (loading) {
    return (
      <div className="mb-8 p-6 lg:p-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl lg:rounded-3xl animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-500/20 rounded-full" />
          <div className="h-4 w-32 bg-purple-500/20 rounded" />
        </div>
        <div className="h-16 bg-purple-500/10 rounded-xl" />
      </div>
    );
  }

  if (!note) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="p-5 lg:p-6 bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-purple-500/10 border border-purple-500/30 rounded-2xl lg:rounded-3xl backdrop-blur-sm shadow-xl shadow-purple-500/10">
        {/* Header */}
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Mentor Avatar */}
            <div className="relative">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                {note.mentor_avatar ? (
                  <img 
                    src={note.mentor_avatar} 
                    alt={note.mentor_name} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center border-2 border-slate-900">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-purple-300 text-sm lg:text-base">
                  {note.mentor_name || 'Mentor'}
                </span>
                <span className="text-[10px] lg:text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full font-medium">
                  PRO
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Guidance for: {moduleTitle}
              </div>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 lg:mt-5 pt-4 border-t border-purple-500/20">
                <div className="flex gap-3">
                  <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div className="text-slate-300 text-sm lg:text-base leading-relaxed">
                    {note.note}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

