'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, X, MessageSquare, Zap, Target, Brain } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useCoachingStore } from '@/lib/coaching/store'
import type { AICoachMessage } from '@/lib/coaching/types'
import clsx from 'clsx'

interface AICoachChatProps {
  className?: string
  isInline?: boolean
}

export function AICoachChat({ className, isInline = false }: AICoachChatProps) {
  const { aiMessages, addAIMessage, metrics, habits, goals } = useCoachingStore()
  const [isOpen, setIsOpen] = useState(isInline)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [aiMessages, isOpen])
  
  // Initialize with contextual welcome message if empty
  useEffect(() => {
    if (aiMessages && aiMessages.length === 0) {
      const isNewUser = metrics && metrics.alignmentScore === 0 &&
                       (!habits || habits.length === 0) &&
                       (!goals || goals.length === 0)

      let welcomeContent: string

      if (isNewUser) {
        welcomeContent = "🚀 Welcome to your Defender track! I'm your AI Coach, here to guide you through mastering cybersecurity defense. Let's start by building your foundation:\n\n1. **Daily Learning Habit** - Commit to 30 minutes of cybersecurity study daily\n2. **Practice Sessions** - Work through hands-on labs and CTF challenges\n3. **Weekly Goals** - Set achievable milestones like completing your first vulnerability assessment\n\nClick 'Start with Habits' above to begin your journey. What's your first priority?"
      } else if (metrics?.totalStreakDays > 0) {
        welcomeContent = `🔥 ${metrics.totalStreakDays}-day streak! You're crushing it on your Defender track. ${metrics.activeHabits > 0 ? `You have ${metrics.activeHabits} active habits keeping you on track.` : 'Ready to add some powerful habits?'} ${metrics.completedGoals > 0 ? `You've completed ${metrics.completedGoals} goals so far.` : 'Let\'s set some ambitious goals for your cybersecurity journey.'} What's on your mind today?`
      } else {
        welcomeContent = "Welcome back to your Defender track! Ready to strengthen your cybersecurity defenses today? Whether you need help with habits, goals, or just want to reflect on your progress, I'm here to help. What would you like to focus on?"
      }

      const welcomeMessage: AICoachMessage = {
        id: 'welcome',
        role: 'assistant',
        content: welcomeContent,
        timestamp: new Date().toISOString(),
        context: 'general',
      }
      addAIMessage(welcomeMessage)
    }
  }, [aiMessages?.length, addAIMessage, metrics, habits, goals])
  
  const handleSend = async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim() || isLoading) return
    
    const userMessage: AICoachMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    }
    
    addAIMessage(userMessage)
    setInput('')
    setIsLoading(true)
    
    // Contextual AI Responses for Defender track
    setTimeout(() => {
      let response = 'Great question! As a Defender, your focus should be on building robust defense skills. What specific area of cybersecurity defense interests you most?'

      const lowerMessage = messageText.toLowerCase()

      if (isNewUser) {
        if (lowerMessage.includes('habit')) {
          response = "Perfect! For your Defender track, I recommend starting with these core habits:\n\n• **Daily Study** (30 mins) - Focus on threat detection and incident response\n• **Practice Sessions** (45 mins) - Work through SIEM labs and log analysis exercises\n• **Weekly Deep Dive** - Research one advanced defense technique\n\nWhich one resonates with you most?"
        } else if (lowerMessage.includes('goal')) {
          response = "Excellent! Here are Defender-track goals to consider:\n\n• **Complete CompTIA Security+** - Foundation certification\n• **Master SIEM Tools** - Learn Splunk or ELK stack\n• **First CTF Win** - Participate in a cybersecurity capture-the-flag event\n• **Incident Response Plan** - Create a comprehensive IR playbook\n\nWhat's your primary goal for the next 3 months?"
        } else if (lowerMessage.includes('start') || lowerMessage.includes('begin')) {
          response = "Let's get you started on your Defender journey! I recommend beginning with habit formation - it's the foundation of all progress. Click 'Start with Habits' above to set up your daily cybersecurity practice routine. Once that's established, we'll move on to setting ambitious goals. Ready to begin?"
        }
      } else {
        if (lowerMessage.includes('mission')) {
          response = "Based on your Defender track, here are your optimal next missions:\n\n1. **SIEM Log Analysis Mastery** - Your highest priority (92% alignment)\n2. **Threat Hunting Fundamentals** - Build detection skills\n3. **Incident Response Simulation** - Practice real-world scenarios\n\nWhich mission interests you most?"
        } else if (lowerMessage.includes('habit')) {
          const streakMsg = metrics?.totalStreakDays > 0
            ? `Your ${metrics.totalStreakDays}-day streak is impressive! `
            : "Consistency is key in cybersecurity defense. "
          response = `${streakMsg}For Defenders, maintaining daily practice habits is crucial. Focus on:\n\n• Log analysis exercises\n• Threat pattern recognition\n• Tool proficiency (SIEM, IDS, etc.)\n\nWhat habit would you like to strengthen today?`
        } else if (lowerMessage.includes('goal')) {
          response = `Your ${metrics?.completedGoals || 0} completed goals show great progress! For your next Defender milestone, consider:\n\n• Advanced persistent threat detection\n• Zero-trust architecture implementation\n• Cloud security posture management\n\nWhat's your next big goal?`
        }
      }

      const aiResponse: AICoachMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        context: 'general',
      }
      addAIMessage(aiResponse)
      setIsLoading(false)
    }, 1200)
  }
  
  // Dynamic quick actions based on user progress
  const isNewUser = metrics && metrics.alignmentScore === 0 &&
                   (!habits || habits.length === 0) &&
                   (!goals || goals.length === 0)

  const quickActions = isNewUser ? [
    { label: 'Start Habits', icon: Zap },
    { label: 'Set Goals', icon: Target },
    { label: 'Track Progress', icon: Brain },
  ] : [
    { label: 'Next Mission?', icon: Target },
    { label: 'Check Habits', icon: Zap },
    { label: 'Identity Strategy', icon: Brain },
  ]

  const chatContent = (
    <div className="h-full flex flex-col">
      {/* Header - Only if floating */}
      {!isInline && (
        <div className="p-4 border-b border-och-steel/10 flex items-center justify-between bg-och-midnight/60 backdrop-blur-md">
            <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-och-defender animate-glow-pulse" />
            <h3 className="font-black text-white text-xs uppercase tracking-widest">AI Coach</h3>
            <Badge variant="defender" className="text-[8px] px-1 font-black">Online</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
            className="h-7 w-7 p-0 border-och-steel/20 text-och-steel hover:bg-och-steel/10"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
      )}
          
          {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
        <AnimatePresence initial={false}>
              {(aiMessages || []).map((message) => (
                <motion.div
                  key={message.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={clsx(
                "flex items-start gap-2",
                    message.role === 'user' ? 'flex-row-reverse' : ''
              )}
                >
                  {message.role === 'assistant' && (
                <div className="w-6 h-6 rounded-lg bg-och-defender/20 flex items-center justify-center flex-shrink-0 border border-och-defender/30">
                  <Sparkles className="w-3 h-3 text-och-defender" />
                    </div>
                  )}
                  <div
                className={clsx(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
                      message.role === 'assistant'
                    ? "bg-och-steel/10 text-slate-200 rounded-tl-none border border-och-steel/5"
                    : "bg-och-defender text-white rounded-tr-none shadow-lg shadow-och-defender/20"
                )}
              >
                <p>{message.content}</p>
                <p className="text-[9px] opacity-40 mt-1 font-mono">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
          <div className="flex items-center gap-1.5 p-2 bg-och-steel/5 rounded-2xl w-fit">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-och-defender rounded-full" />
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-och-defender rounded-full" />
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-och-defender rounded-full" />
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

      {/* Quick Actions */}
      <div className="px-3 pb-1.5 flex gap-1.5 overflow-x-auto scrollbar-hide">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => handleSend(action.label)}
            className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-och-steel/5 border border-och-steel/10 text-[9px] font-bold text-och-steel hover:text-white hover:border-och-defender/50 transition-all whitespace-nowrap"
          >
            <action.icon className="w-2.5 h-2.5" />
            {action.label}
          </button>
        ))}
      </div>
          
          {/* Input */}
      <div className="p-3 bg-och-midnight/60 border-t border-och-steel/10">
        <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your coach..."
            className="w-full bg-och-midnight border border-och-steel/20 rounded-xl py-2 pl-3 pr-10 text-xs text-white placeholder-och-steel focus:outline-none focus:border-och-defender transition-all shadow-inner"
              />
          <button
            onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-och-defender hover:text-och-mint disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
          </button>
        </div>
            </div>
          </div>
  )

  if (isInline) {
    return (
      <div className={clsx("overflow-hidden rounded-2xl", className)}>
        {chatContent}
      </div>
    )
  }
  
  // Chat button (minimized state)
  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-2xl bg-och-defender text-white shadow-2xl shadow-och-defender/40 flex items-center justify-center hover:scale-110 transition-transform group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <MessageSquare className="w-7 h-7" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-och-orange border-2 border-och-midnight rounded-full animate-pulse" />
        </button>
      </motion.div>
    )
  }
  
  // Chat interface (open state)
  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20, filter: 'blur(10px)' }}
        animate={{ scale: 1, opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ scale: 0.9, opacity: 0, y: 20, filter: 'blur(10px)' }}
        className={clsx("fixed bottom-6 right-6 w-96 h-[600px] z-50", className)}
      >
        <Card className="h-full border-och-defender/30 bg-och-midnight/90 backdrop-blur-2xl shadow-2xl overflow-hidden ring-1 ring-white/10">
          {chatContent}
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
