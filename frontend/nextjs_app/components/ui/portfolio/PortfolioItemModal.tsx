/**
 * Portfolio Item Detail Modal
 * Immersive view for portfolio item details
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Eye,
  Star,
  Target,
  Github,
  Award,
  FileText,
  ExternalLink,
  Shield,
  Zap,
  BookOpen,
  CheckCircle2,
  FileCode,
  Calendar,
  Clock,
  Edit,
  Trash2,
  MessageSquare,
  Download,
  Share2,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { PortfolioItem } from '@/hooks/usePortfolio';
import clsx from 'clsx';

interface PortfolioItemModalProps {
  item: PortfolioItem;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onRequestReview?: () => void;
  canRequestReview?: boolean;
}

export function PortfolioItemModal({
  item,
  onClose,
  onEdit,
  onDelete,
  onRequestReview,
  canRequestReview = false,
}: PortfolioItemModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'feedback'>('overview');

  const typeIcons: Record<string, any> = {
    mission: Target,
    reflection: BookOpen,
    certification: Award,
    github: Github,
    lab_report: FileCode,
    external: ExternalLink,
  };

  const TypeIcon = typeIcons[item.type] || FileText;

  const isApproved = item.status === 'approved';
  const isPending = item.status === 'in_review' || item.status === 'submitted' || item.status === 'pending';
  const isDraft = item.status === 'draft';

  const getStatusTheme = () => {
    if (isApproved) return { color: 'text-och-mint', bg: 'bg-och-mint/10', border: 'border-och-mint/30' };
    if (isPending) return { color: 'text-och-gold', bg: 'bg-och-gold/10', border: 'border-och-gold/30' };
    return { color: 'text-och-steel', bg: 'bg-och-steel/10', border: 'border-och-steel/30' };
  };

  const theme = getStatusTheme();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-och-midnight/90 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-och-midnight border border-och-steel/10 rounded-[3rem] shadow-2xl relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-3 rounded-xl bg-och-steel/10 text-och-steel hover:bg-och-defender hover:text-white transition-all z-20"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 lg:p-12">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start gap-6 mb-6">
              <div className={clsx(
                "w-16 h-16 rounded-2xl border-2 flex items-center justify-center shrink-0",
                theme.bg,
                theme.border
              )}>
                <TypeIcon className={clsx("w-8 h-8", theme.color)} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant={isApproved ? "mint" : isPending ? "gold" : "steel"} className="text-[9px] font-black tracking-widest px-3 py-1">
                    {item.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] font-black tracking-widest px-3 py-1 border-white/10 bg-white/5">
                    {item.type.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] font-black tracking-widest px-3 py-1 border-white/10 bg-white/5">
                    {item.visibility?.toUpperCase() || 'PRIVATE'}
                  </Badge>
                </div>

                <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
                  {item.title || 'Untitled Outcome'}
                </h2>

                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Created {new Date(item.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-600" />
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Updated {new Date(item.updatedAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {onEdit && (
                <Button
                  variant="outline"
                  onClick={onEdit}
                  className="h-10 px-5 rounded-xl border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50 font-medium text-xs"
                >
                  <Edit className="w-3.5 h-3.5 mr-2" />
                  Edit
                </Button>
              )}

              {canRequestReview && (isDraft || item.status === 'submitted') && onRequestReview && (
                <Button
                  variant="outline"
                  onClick={onRequestReview}
                  className="h-10 px-5 rounded-xl border-och-gold/30 text-och-gold hover:bg-och-gold hover:text-black font-medium text-xs"
                >
                  <Zap className="w-3.5 h-3.5 mr-2 fill-current" />
                  Request Mentor Review
                </Button>
              )}

              <Button
                variant="outline"
                className="h-10 px-5 rounded-xl border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50 font-medium text-xs"
              >
                <Share2 className="w-3.5 h-3.5 mr-2" />
                Share
              </Button>

              {onDelete && (
                <Button
                  variant="outline"
                  onClick={onDelete}
                  className="ml-auto h-10 px-5 rounded-xl border-och-defender/30 text-och-defender hover:bg-och-defender hover:text-white font-medium text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-800 mb-8">
            <div className="flex gap-6">
              {['overview', 'evidence', 'feedback'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={clsx(
                    "pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative",
                    activeTab === tab ? "text-och-gold" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-och-gold"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px]">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Summary */}
                <div>
                  <h3 className="text-xs font-black text-och-steel uppercase tracking-widest mb-3">Summary</h3>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {item.summary || 'No summary provided.'}
                  </p>
                </div>

                {/* Skills */}
                {(item.skillTags?.length || 0) > 0 && (
                  <div>
                    <h3 className="text-xs font-black text-och-steel uppercase tracking-widest mb-3">Skills & Competencies</h3>
                    <div className="flex flex-wrap gap-2">
                      {item.skillTags?.map((tag: string) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="bg-och-mint/10 text-och-mint border-och-mint/30 px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                  <div>
                    <p className="text-[10px] font-black text-och-steel uppercase tracking-widest mb-1">Item ID</p>
                    <p className="text-sm font-mono text-white">{item.id.slice(0, 8)}...</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-och-steel uppercase tracking-widest mb-1">Visibility</p>
                    <p className="text-sm font-semibold text-white">{item.visibility || 'Private'}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'evidence' && (
              <div>
                {(item.evidenceFiles?.length || 0) > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.evidenceFiles?.map((file: any, index: number) => {
                      const getFileIcon = () => {
                        switch (file.type) {
                          case 'image': return <ImageIcon className="w-5 h-5 text-blue-400" />;
                          case 'video': return <Video className="w-5 h-5 text-purple-400" />;
                          case 'pdf': return <FileText className="w-5 h-5 text-och-defender" />;
                          case 'link': return <LinkIcon className="w-5 h-5 text-och-gold" />;
                          default: return <FileCode className="w-5 h-5 text-white" />;
                        }
                      };

                      return (
                        <div
                          key={index}
                          className="p-5 bg-slate-900/50 rounded-2xl border border-slate-800 hover:border-och-gold/30 transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={clsx(
                              "p-3 rounded-xl border shrink-0",
                              file.type === 'image' && "bg-blue-500/10 border-blue-500/20",
                              file.type === 'video' && "bg-purple-500/10 border-purple-500/20",
                              file.type === 'pdf' && "bg-och-defender/10 border-och-defender/20",
                              file.type === 'link' && "bg-och-gold/10 border-och-gold/20",
                              !file.type && "bg-slate-800/50 border-slate-700"
                            )}>
                              {getFileIcon()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate mb-1">
                                {file.name || file.url || 'Unnamed file'}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                {file.size > 0 && (
                                  <span>{(file.size / 1024).toFixed(0)} KB</span>
                                )}
                                {file.type && (
                                  <>
                                    {file.size > 0 && <span>•</span>}
                                    <span className="uppercase">{file.type}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Open file in new tab
                                window.open(file.url, '_blank');
                              }}
                              className="h-9 px-4 rounded-lg border-slate-700 text-slate-300 hover:border-och-gold hover:text-och-gold text-xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileCode className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-sm text-slate-400">No evidence files attached</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'feedback' && (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-sm text-slate-400 mb-2">No mentor feedback yet</p>
                <p className="text-xs text-slate-500">Submit for review to receive feedback</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
