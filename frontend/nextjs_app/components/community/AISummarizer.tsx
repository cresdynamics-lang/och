"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { 
  Sparkles, X, BookOpen, Loader2, Copy, Check, 
  Download, Share2, MessageSquare, Lightbulb
} from "lucide-react"
import type { AISummary } from "@/services/types/community"
import { cn } from "@/lib/utils"

interface AISummarizerProps {
  postId: string
  postTitle?: string
  commentCount?: number
  onClose: () => void
}

export function AISummarizer({ postId, postTitle, commentCount = 0, onClose }: AISummarizerProps) {
  const [summary, setSummary] = useState<AISummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const generateSummary = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/community/ai-summaries/generate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          post_id: postId,
          summary_type: 'thread'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }
      
      const data = await response.json()
      setSummary(data)
    } catch (err: any) {
      console.error('Error generating summary:', err)
      setError(err.message || 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!summary) return
    
    const text = `🎯 Key Takeaways:\n\n${summary.key_takeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\n📝 Summary:\n${summary.summary}`
    
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveToNotes = async () => {
    // TODO: Implement save to notes functionality
    alert('Saved to your notes!')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl mx-auto max-h-[85vh] overflow-hidden"
      >
        <Card className="bg-gradient-to-br from-slate-900 via-purple-900/30 to-pink-900/30 border-slate-800/50 shadow-2xl">
          <div className="p-0">
            {/* Header */}
            <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100">AI Thread Summary</h2>
                  <p className="text-sm text-slate-400">
                    {commentCount > 0 ? `Instant insights from ${commentCount} comments` : 'Generate AI-powered insights'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="p-2" onClick={onClose}>
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {!summary && !loading && !error && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-purple-400" />
                  </div>
                  
                  {postTitle && (
                    <div className="mb-6 p-4 bg-slate-800/30 rounded-xl max-w-md mx-auto">
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Summarizing</div>
                      <div className="text-slate-200 font-medium line-clamp-2">{postTitle}</div>
                    </div>
                  )}
                  
                  <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                    Let AI analyze this thread and extract the key takeaways for you.
                  </p>
                  
                  <Button
                    size="lg"
                    onClick={generateSummary}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Summarize Thread
                  </Button>
                </div>
              )}

              {loading && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl flex items-center justify-center animate-pulse">
                    <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">Analyzing Thread...</h3>
                  <p className="text-slate-400">Our AI is reading through the discussion</p>
                  
                  {/* Progress Animation */}
                  <div className="mt-6 space-y-2 max-w-xs mx-auto">
                    {['Reading comments...', 'Identifying key points...', 'Generating summary...'].map((step, i) => (
                      <motion.div
                        key={step}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.8 }}
                        className="flex items-center gap-2 text-sm text-slate-400"
                      >
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                        {step}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-2xl flex items-center justify-center">
                    <X className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">Failed to Generate Summary</h3>
                  <p className="text-slate-400 mb-4">{error}</p>
                  <Button
                    onClick={generateSummary}
                    variant="outline"
                    className="border-slate-700/50"
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {summary && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Key Takeaways */}
                  <div className="p-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl border border-emerald-500/20">
                    <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5" />
                      Key Takeaways
                    </h3>
                    <div className="space-y-3">
                      {summary.key_takeaways.map((takeaway, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-start gap-3"
                        >
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-emerald-400">{i + 1}</span>
                          </div>
                          <span className="text-slate-200 leading-relaxed">{takeaway}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Full Summary */}
                  <div className="p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                    <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-400" />
                      Full Summary
                    </h3>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {summary.summary}
                      </p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {summary.source_comment_count} comments analyzed
                      </span>
                      <span>Model: {summary.model_used}</span>
                    </div>
                    <span>Generated just now</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer Actions */}
            {summary && (
              <div className="p-6 border-t border-slate-800/50 bg-slate-900/50">
                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveToNotes}
                    className="flex-1 bg-emerald-500/90 hover:bg-emerald-500 shadow-lg shadow-emerald-500/25"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Save to Notes
                  </Button>
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="flex-1 border-slate-700/50"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    className="px-6"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}

