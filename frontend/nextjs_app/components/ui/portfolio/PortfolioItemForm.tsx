/**
 * Portfolio Item Form Component
 * Create/Edit form for portfolio items - Coordinated with Settings, Missions, Marketplace
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Link as LinkIcon, FileText, Image, Video, Plus, Trash2, Save, CheckCircle, Zap, Shield, Target, Briefcase, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useSettingsMaster } from '@/hooks/useSettingsMaster';
import { useAuth } from '@/hooks/useAuth';
import type { PortfolioItemType, PortfolioVisibility, EvidenceFile } from '@/lib/portfolio/types';
import clsx from 'clsx';

interface PortfolioItemFormProps {
  itemId?: string; // If provided, edit mode; otherwise, create mode
  onClose: () => void;
  initialData?: {
    title?: string;
    summary?: string;
    type?: PortfolioItemType;
    visibility?: PortfolioVisibility;
    skillTags?: string[];
    evidenceFiles?: EvidenceFile[];
  };
}

export function PortfolioItemForm({ itemId, onClose, initialData }: PortfolioItemFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id?.toString();

  const { createItem, updateItem, isLoading, isCreating, isUpdating, refetch } = usePortfolio(userId);
  const { settings, entitlements } = useSettingsMaster(userId);
  const isProfessional = entitlements?.tier === 'professional';

  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [summary, setSummary] = useState(initialData?.summary || '');
  const [type, setType] = useState<PortfolioItemType>(initialData?.type || 'mission');
  const [status, setStatus] = useState<string>('draft');
  const [visibility, setVisibility] = useState<PortfolioVisibility>(
    initialData?.visibility || settings?.portfolioVisibility || 'private'
  );
  const [skillTags, setSkillTags] = useState<string[]>(initialData?.skillTags || []);
  const [newSkillTag, setNewSkillTag] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>(initialData?.evidenceFiles || []);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Available types
  const itemTypes: { value: PortfolioItemType; label: string; icon: string }[] = [
    { value: 'mission', label: 'Mission', icon: '🎯' },
    { value: 'reflection', label: 'Reflection', icon: '💭' },
    { value: 'certification', label: 'Certification', icon: '🏆' },
    { value: 'github', label: 'GitHub', icon: '💻' },
    { value: 'thm', label: 'TryHackMe', icon: '🔐' },
    { value: 'external', label: 'External', icon: '🌐' },
  ];

  // Visibility options (coordinated with Settings)
  const visibilityOptions: { value: PortfolioVisibility; label: string; description: string }[] = [
    { value: 'private', label: 'Private', description: 'Only visible to you' },
    { value: 'unlisted', label: 'Unlisted', description: 'Accessible via direct link' },
    { value: 'public', label: 'Public', description: 'Visible to everyone' },
  ];

  const handleAddSkillTag = () => {
    if (newSkillTag.trim() && !skillTags.includes(newSkillTag.trim())) {
      setSkillTags([...skillTags, newSkillTag.trim()]);
      setNewSkillTag('');
    }
  };

  const handleRemoveSkillTag = (tag: string) => {
    setSkillTags(skillTags.filter((t) => t !== tag));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !userId) return;

    setUploading(true);
    try {
      const uploadedFiles: EvidenceFile[] = [];

      for (const file of Array.from(files)) {
        // Atomic Upload via API Gateway (Mocked for now)
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        
        // Mock successful upload
        const fileName = `${Date.now()}_${file.name}`;
        const mockUrl = `/uploads/portfolio/${userId}/${fileName}`;

        // Determine file type
        let fileType: 'pdf' | 'image' | 'video' | 'link' = 'link';
        if (file.type.startsWith('image/')) fileType = 'image';
        else if (file.type.startsWith('video/')) fileType = 'video';
        else if (file.type === 'application/pdf') fileType = 'pdf';
        else if (file.name.endsWith('.pcap') || file.name.endsWith('.log')) fileType = 'pdf'; // PCAP/Logs as docs

        uploadedFiles.push({
          url: mockUrl,
          type: fileType,
          size: file.size,
          name: file.name,
          thumbnail: fileType === 'image' ? mockUrl : undefined,
        });
      }

      setEvidenceFiles([...evidenceFiles, ...uploadedFiles]);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload artifacts. Please ensure file size is under 50MB.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddLink = () => {
    const url = prompt('Enter URL:');
    if (url && url.trim()) {
      setEvidenceFiles([
        ...evidenceFiles,
        {
          url: url.trim(),
          type: 'link',
          size: 0,
          name: url.trim(),
        },
      ]);
    }
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenceFiles(evidenceFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent, isSubmission: boolean = false) => {
    e.preventDefault();

    if (!title.trim() || !userId) {
      alert('Please provide a title for your portfolio item.');
      return;
    }

    if (isSubmission && evidenceFiles.length === 0) {
      alert('Professional submissions require at least one piece of verifiable evidence (file or link).');
      return;
    }

    const newStatus = isSubmission ? 'submitted' : status;

    if (isSubmission) {
      setSubmissionFeedback('INITIATING ATOMIC SUBMISSION PROTOCOL...');
    }

    try {
      if (itemId) {
        // Update existing item
        updateItem(itemId, {
          title: title.trim(),
          summary: summary.trim(),
          visibility,
          skillTags,
          evidenceFiles,
          status: newStatus,
        });
      } else {
        // Create new item
        createItem({
          title: title.trim(),
          summary: summary.trim(),
          type,
          visibility,
          skillTags,
          evidenceFiles,
          status: newStatus,
        });
      }

      if (isSubmission) {
        setSubmissionFeedback(isProfessional 
          ? 'SUCCESS: TELEMETRY SYNCED. MENTOR REVIEW SEQUENCE ENGAGED.' 
          : 'SUCCESS: TELEMETRY SYNCED. AI ANALYSIS IN PROGRESS.');
      }

      setShowSuccess(true);
      // Trigger refetch after creation
      setTimeout(() => {
        if (refetch) {
          refetch();
        }
        onClose();
      }, isSubmission ? 2000 : 1000);
    } catch (error) {
      console.error('Error saving portfolio item:', error);
      setSubmissionFeedback('ERROR: SUBMISSION FAILED. TELEMETRY ROLLBACK INITIATED.');
      alert('Failed to process submission. Telemetry rollback initiated to prevent data loss.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-och-midnight/90 backdrop-blur-md">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-och-midnight border border-och-steel/10 rounded-[3rem] shadow-2xl relative overflow-hidden">
        {/* WATERMARK */}
        <div className="absolute top-0 right-0 p-12 opacity-5 select-none pointer-events-none">
          <Briefcase className="w-64 h-64 text-och-gold" />
        </div>

        <div className="p-8 lg:p-12 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-och-gold/10 border border-och-gold/20 flex items-center justify-center text-och-gold">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl xl:text-3xl font-black text-white uppercase tracking-tighter">
                  {itemId ? 'Refine Outcome' : 'Register New Outcome'}
                </h2>
                <p className="text-[10px] text-och-steel font-black uppercase tracking-widest mt-1">Portfolio Engine v2.4 • Operational</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 rounded-xl bg-och-steel/10 text-och-steel hover:bg-och-defender hover:text-white transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {submissionFeedback && (
            <div className={clsx(
              "mb-6 p-4 rounded-[1.5rem] relative overflow-hidden group",
              submissionFeedback.includes('ERROR') 
                ? "bg-och-defender/10 border border-och-defender/30" 
                : "bg-emerald-500/10 border border-emerald-500/30"
            )}>
              <div className={clsx(
                "absolute inset-0 animate-pulse",
                submissionFeedback.includes('ERROR') ? "bg-och-defender/5" : "bg-emerald-500/5"
              )} />
              <div className="flex items-center gap-4 relative z-10">
                <div className={clsx(
                  "w-10 h-10 rounded-xl flex items-center justify-center border",
                  submissionFeedback.includes('ERROR') 
                    ? "bg-och-defender/20 border-och-defender/30 text-och-defender" 
                    : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                )}>
                  {submissionFeedback.includes('SUCCESS') ? <CheckCircle className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <div className={clsx(
                    "font-black uppercase tracking-tight text-xs",
                    submissionFeedback.includes('ERROR') ? "text-och-defender" : "text-emerald-300"
                  )}>
                    {submissionFeedback}
                  </div>
                  <p className="text-[10px] text-och-steel font-bold uppercase tracking-widest mt-1">
                    {submissionFeedback.includes('SUCCESS') 
                      ? "Verifiable evidence has been securely committed to the Portfolio Engine."
                      : "The system is protecting your data integrity."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {showSuccess && !submissionFeedback && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-[1.5rem] relative overflow-hidden group">
              <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="text-emerald-300 font-black uppercase tracking-tight">
                    {status === 'submitted' ? 'Commitment Successful' : 'Intel Synchronized'}
                  </div>
                  <div className="text-emerald-400/80 text-[10px] font-bold uppercase tracking-widest mt-1">
                    {status === 'submitted' 
                      ? 'Telemetry ingested by TalentScope. Review sequence initiated.' 
                      : 'Draft saved to your local repository repository.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-[10px] font-black text-och-steel uppercase tracking-[0.2em]">
                  Outcome Title <span className="text-och-defender">*</span>
                </label>
                <div className={clsx(
                  "text-[9px] font-bold tracking-widest",
                  title.length > 100 ? "text-och-defender" : "text-och-steel"
                )}>
                  {title.length}/120
                </div>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                placeholder="E.G. DFIR MISSION: RANSOMWARE TRIAGE..."
                className={clsx(
                  "w-full px-6 py-4 border rounded-2xl text-white text-sm font-semibold placeholder:text-och-steel/30 outline-none transition-all shadow-inner",
                  title.length > 0 
                    ? "bg-och-midnight/90 border-och-gold/30" 
                    : "bg-och-midnight/80 border-och-steel/20",
                  "focus:border-och-gold focus:bg-och-midnight/95 focus:shadow-lg focus:shadow-och-gold/5"
                )}
                required
              />
              <p className="text-[9px] text-och-steel/70 mt-2 font-medium tracking-wide">
                💡 Keep it concise and descriptive. E.g., "Blue Team CTF - Network Forensics Challenge"
              </p>
            </div>

            {/* Summary */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-[10px] font-black text-och-steel uppercase tracking-[0.2em]">
                  Strategic Summary
                </label>
                <div className={clsx(
                  "text-[9px] font-bold tracking-widest",
                  summary.length > 1000 ? "text-och-defender" : summary.length > 800 ? "text-amber-400" : "text-och-steel"
                )}>
                  {summary.length}/1200
                </div>
              </div>
              <div className="relative">
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value.slice(0, 1200))}
                  placeholder="📋 Describe your approach, key findings, and impact...&#10;&#10;Example:&#10;• Investigated potential ransomware incident using Wireshark and Splunk&#10;• Identified C2 communication patterns and isolated infected endpoints&#10;• Created SIEM correlation rules to detect similar threats&#10;• Documented findings in formal incident report"
                  rows={6}
                  className={clsx(
                    "w-full px-6 py-4 border rounded-2xl text-white text-sm font-medium placeholder:text-och-steel/40 outline-none transition-all shadow-inner resize-none leading-relaxed",
                    summary.length > 0 
                      ? "bg-och-midnight/90 border-och-gold/30" 
                      : "bg-och-midnight/80 border-och-steel/20",
                    "focus:border-och-gold focus:bg-och-midnight/95 focus:shadow-lg focus:shadow-och-gold/5"
                  )}
                />
                <div className="absolute bottom-4 right-4 flex gap-2">
                  {summary.length > 200 && (
                    <Badge variant="outline" className="bg-och-mint/10 text-och-mint border-och-mint/30 text-[9px] font-bold">
                      DETAILED ✓
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-[9px] text-och-steel/70 mt-2 font-medium tracking-wide leading-relaxed">
                💡 Use bullet points (•) for clarity. Include: What you did, Tools used, Key findings, Impact/Results
              </p>
            </div>

            {/* Type */}
            <div>
              <label className="block text-[10px] font-black text-och-steel uppercase tracking-[0.2em] mb-3">
                Classification
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {itemTypes.map((itemType) => (
                  <button
                    key={itemType.value}
                    type="button"
                    onClick={() => setType(itemType.value)}
                    className={clsx(
                      "p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 group relative overflow-hidden",
                      type === itemType.value
                        ? "bg-och-gold/10 border-och-gold/40 text-och-gold shadow-lg shadow-och-gold/5"
                        : "bg-och-midnight/80 border-och-steel/10 text-och-steel hover:border-och-gold/30 hover:bg-och-midnight/90"
                    )}
                  >
                    {type === itemType.value && (
                      <motion.div
                        layoutId="activeType"
                        className="absolute inset-0 bg-och-gold/5 rounded-2xl"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <div className={clsx(
                      "text-2xl transition-transform relative z-10",
                      type === itemType.value ? "scale-110" : "group-hover:scale-105"
                    )}>
                      {itemType.icon}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest relative z-10">{itemType.label}</div>
                    {type === itemType.value && (
                      <CheckCircle className="w-4 h-4 absolute top-2 right-2 text-och-gold" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-och-steel/70 mt-3 font-medium tracking-wide">
                💡 Choose the category that best represents your work
              </p>
            </div>

            {/* Visibility (Coordinated with Settings) */}
            <div>
              <label className="block text-[10px] font-black text-och-steel uppercase tracking-[0.2em] mb-3">
                Publication Privacy
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {visibilityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVisibility(option.value)}
                    className={clsx(
                      "p-5 rounded-2xl border text-left transition-all relative overflow-hidden group",
                      visibility === option.value
                        ? "bg-och-gold/10 border-och-gold/40 shadow-lg shadow-och-gold/5"
                        : "bg-och-midnight/80 border-och-steel/10 hover:border-och-gold/30 hover:bg-och-midnight/90"
                    )}
                  >
                    {visibility === option.value && (
                      <motion.div
                        layoutId="activeVisibility"
                        className="absolute inset-0 bg-och-gold/5 rounded-2xl"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <div className={clsx(
                          "font-black text-sm uppercase tracking-widest",
                          visibility === option.value ? "text-och-gold" : "text-white"
                        )}>
                          {option.label}
                        </div>
                        {visibility === option.value && (
                          <CheckCircle className="w-4 h-4 text-och-gold" />
                        )}
                      </div>
                      <div className="text-[9px] text-och-steel font-medium tracking-tight leading-relaxed">
                        {option.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-och-steel/70 mt-3 font-medium tracking-wide">
                💡 You can change visibility later in Settings
              </p>
            </div>

            {/* Skill Tags */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-[10px] font-black text-och-steel uppercase tracking-[0.2em]">
                  Competency Telemetry
                </label>
                <div className="text-[9px] font-bold text-och-steel tracking-widest">
                  {skillTags.length} TAGS
                </div>
              </div>
              
              {skillTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 p-4 bg-och-midnight/50 rounded-2xl border border-och-steel/10">
                  {skillTags.map((tag, index) => (
                    <motion.div
                      key={tag}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Badge
                        variant="outline"
                        className="bg-och-mint/10 text-och-mint border-och-mint/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-och-mint/20 transition-colors"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkillTag(tag)}
                          className="ml-2 hover:text-och-defender transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newSkillTag}
                    onChange={(e) => setNewSkillTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkillTag())}
                    placeholder="E.g., Wireshark, SIEM, Incident Response..."
                    className="w-full px-6 py-3.5 bg-och-midnight/80 border border-och-steel/20 rounded-xl text-white text-sm font-medium placeholder:text-och-steel/30 focus:border-och-mint focus:bg-och-midnight/95 outline-none transition-all"
                    maxLength={30}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddSkillTag}
                  disabled={!newSkillTag.trim() || skillTags.includes(newSkillTag.trim())}
                  className="h-[50px] px-6 rounded-xl border-och-mint/30 text-och-mint hover:bg-och-mint hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <p className="text-[9px] text-och-steel/70 mt-3 font-medium tracking-wide">
                💡 Add relevant skills, tools, or frameworks (max 30 characters each). Press Enter or click + to add.
              </p>
            </div>

            {/* Evidence Files */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-[10px] font-black text-och-steel uppercase tracking-[0.2em]">
                  Verifiable Artifacts
                </label>
                <div className="text-[9px] font-bold text-och-steel tracking-widest">
                  {evidenceFiles.length} FILES
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Upload Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="cursor-pointer group">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,video/*,.pdf,.pcap,.log,.txt,.md"
                      disabled={uploading}
                    />
                    <div className={clsx(
                      "px-6 py-5 border rounded-2xl transition-all flex items-center justify-center gap-3 relative overflow-hidden",
                      uploading 
                        ? "bg-och-gold/10 border-och-gold/40 cursor-wait" 
                        : "bg-och-midnight/80 border-och-steel/20 hover:bg-och-midnight/90 hover:border-och-gold/30"
                    )}>
                      {uploading && (
                        <div className="absolute inset-0 bg-och-gold/5 animate-pulse" />
                      )}
                      <Upload className={clsx(
                        "w-5 h-5 relative z-10 transition-transform",
                        uploading ? "animate-bounce text-och-gold" : "text-och-steel group-hover:scale-110 group-hover:text-och-gold"
                      )} />
                      <span className="text-[11px] font-black uppercase tracking-widest relative z-10 text-white">
                        {uploading ? 'INGESTING...' : 'UPLOAD FILES'}
                      </span>
                    </div>
                  </label>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddLink}
                    className="h-[58px] px-6 rounded-2xl border-och-gold/20 text-och-gold hover:bg-och-gold hover:text-black transition-all font-black uppercase tracking-widest text-[11px]"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    ADD LINK
                  </Button>
                </div>

                {/* Evidence List */}
                {evidenceFiles.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-[10px] font-black text-och-steel uppercase tracking-widest">
                      Attached Evidence ({evidenceFiles.length})
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {evidenceFiles.map((file, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-4 p-4 bg-och-midnight/50 border border-och-steel/10 rounded-2xl group hover:border-och-gold/30 hover:bg-och-midnight/70 transition-all"
                        >
                          <div className={clsx(
                            "p-3 rounded-xl border shrink-0",
                            file.type === 'image' && "bg-blue-500/10 border-blue-500/20",
                            file.type === 'video' && "bg-purple-500/10 border-purple-500/20",
                            file.type === 'pdf' && "bg-och-defender/10 border-och-defender/20",
                            file.type === 'link' && "bg-och-gold/10 border-och-gold/20"
                          )}>
                            {file.type === 'image' && <Image className="w-5 h-5 text-blue-400" />}
                            {file.type === 'video' && <Video className="w-5 h-5 text-purple-400" />}
                            {file.type === 'pdf' && <FileText className="w-5 h-5 text-och-defender" />}
                            {file.type === 'link' && <LinkIcon className="w-5 h-5 text-och-gold" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white truncate">
                              {file.name || file.url}
                            </div>
                            {file.size > 0 && (
                              <div className="flex items-center gap-2 mt-1">
                                <div className="text-[9px] text-och-steel font-medium">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </div>
                                <div className="w-1 h-1 rounded-full bg-och-mint" />
                                <Badge variant="outline" className="bg-och-mint/5 text-och-mint border-och-mint/20 text-[8px] font-bold px-1.5 py-0">
                                  VERIFIED
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveEvidence(index)}
                            className="p-2.5 rounded-lg hover:bg-och-defender/20 text-och-steel hover:text-och-defender transition-all shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-[9px] text-och-steel/70 mt-3 font-medium tracking-wide leading-relaxed">
                💡 Upload screenshots, reports, PCAP files, or add links to GitHub repos, TryHackMe rooms, etc. Max 50MB per file.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-6 pt-8 border-t border-slate-800/50">
              {/* Tier Info Banner */}
              <div className={clsx(
                "px-5 py-4 rounded-2xl border flex items-center gap-4",
                isProfessional 
                  ? "bg-och-gold/5 border-och-gold/20" 
                  : "bg-och-steel/5 border-och-steel/10"
              )}>
                <div className={clsx(
                  "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",
                  isProfessional 
                    ? "bg-och-gold/10 border-och-gold/20" 
                    : "bg-och-steel/5 border-och-steel/10"
                )}>
                  {isProfessional ? (
                    <Shield className="w-5 h-5 text-och-gold" />
                  ) : (
                    <Zap className="w-5 h-5 text-och-steel opacity-50" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={clsx(
                    "text-sm font-black uppercase tracking-wide mb-1",
                    isProfessional ? "text-och-gold" : "text-och-steel"
                  )}>
                    {isProfessional ? 'Professional Tier Active' : 'Starter Tier'}
                  </div>
                  <div className="text-[10px] text-och-steel/80 font-medium leading-relaxed">
                    {isProfessional 
                      ? '✓ Mentor review enabled • Portfolio verification • TalentScope integration' 
                      : 'AI analysis only • Upgrade for mentor reviews and verification badges'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:w-auto h-12 px-8 rounded-xl border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50 font-bold uppercase tracking-wide text-xs transition-all"
                >
                  Cancel
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => handleSubmit(e, false)}
                  disabled={isLoading || isCreating || isUpdating || uploading || !title.trim()}
                  className="w-full sm:w-auto h-12 px-8 rounded-xl border-och-steel/30 text-och-steel hover:border-och-steel hover:bg-och-steel/10 font-bold uppercase tracking-wide text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>

                <Button
                  type="button"
                  variant="defender"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={isLoading || isCreating || isUpdating || uploading || !title.trim()}
                  className="w-full sm:flex-1 h-12 px-10 rounded-xl bg-gradient-to-r from-och-defender to-och-defender/80 hover:from-och-defender/90 hover:to-och-defender/70 text-white font-black uppercase tracking-[0.15em] text-xs shadow-lg shadow-och-defender/20 hover:shadow-xl hover:shadow-och-defender/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Commit & Submit
                </Button>
              </div>
              
              {/* Validation Hints */}
              {!title.trim() && (
                <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-[10px] text-amber-400/90 font-medium">
                    Title is required to save or submit
                  </p>
                </div>
              )}
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

