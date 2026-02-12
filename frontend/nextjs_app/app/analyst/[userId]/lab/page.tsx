'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import {
  ArrowLeft,
  Play,
  Shield,
  Network,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Target
} from 'lucide-react'

interface LabTemplate {
  id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: string
  category: string
  objectives: string[]
  prerequisites: string[]
  estimatedCompletion: string
  points: number
  icon: any
}

const labTemplates: LabTemplate[] = [
  {
    id: 'ryuk-ransomware',
    title: 'Ryuk Ransomware Investigation',
    description: 'Investigate a sophisticated ransomware attack targeting a corporate network',
    difficulty: 'advanced',
    duration: '2-3 hours',
    category: 'Ransomware',
    objectives: [
      'Analyze initial infection vectors',
      'Trace lateral movement patterns',
      'Identify encryption processes',
      'Develop containment strategies'
    ],
    prerequisites: ['SIEM Fundamentals', 'Network Analysis Basics'],
    estimatedCompletion: '2.5 hours',
    points: 250,
    icon: Shield
  },
  {
    id: 'phishing-campaign',
    title: 'Corporate Phishing Campaign Analysis',
    description: 'Analyze and respond to a targeted spear-phishing campaign',
    difficulty: 'intermediate',
    duration: '1-2 hours',
    category: 'Social Engineering',
    objectives: [
      'Identify phishing indicators',
      'Trace email delivery paths',
      'Assess compromise scope',
      'Implement remediation steps'
    ],
    prerequisites: ['Email Security', 'Basic Forensics'],
    estimatedCompletion: '1.5 hours',
    points: 150,
    icon: AlertTriangle
  },
  {
    id: 'network-anomaly',
    title: 'Network Anomaly Detection',
    description: 'Detect and investigate unusual network traffic patterns',
    difficulty: 'intermediate',
    duration: '1.5-2 hours',
    category: 'Network Security',
    objectives: [
      'Configure traffic monitoring',
      'Identify anomalous patterns',
      'Correlate with threat intelligence',
      'Document findings'
    ],
    prerequisites: ['Network Fundamentals', 'Traffic Analysis'],
    estimatedCompletion: '1.75 hours',
    points: 175,
    icon: Network
  },
  {
    id: 'insider-threat',
    title: 'Insider Threat Simulation',
    description: 'Investigate suspicious activity from an authorized user',
    difficulty: 'advanced',
    duration: '2.5-3 hours',
    category: 'Insider Threats',
    objectives: [
      'Analyze user behavior patterns',
      'Identify privilege escalation',
      'Trace data exfiltration',
      'Implement access controls'
    ],
    prerequisites: ['Access Control', 'User Behavior Analytics'],
    estimatedCompletion: '2.75 hours',
    points: 300,
    icon: Users
  },
  {
    id: 'ddos-mitigation',
    title: 'DDoS Attack Mitigation',
    description: 'Respond to and mitigate a distributed denial of service attack',
    difficulty: 'beginner',
    duration: '45-60 minutes',
    category: 'Infrastructure',
    objectives: [
      'Identify attack signatures',
      'Implement rate limiting',
      'Configure WAF rules',
      'Monitor attack impact'
    ],
    prerequisites: ['Web Security Basics'],
    estimatedCompletion: '50 minutes',
    points: 100,
    icon: Target
  },
  {
    id: 'malware-analysis',
    title: 'Malware Sample Analysis',
    description: 'Perform static and dynamic analysis of a malicious file',
    difficulty: 'advanced',
    duration: '3-4 hours',
    category: 'Malware Analysis',
    objectives: [
      'Extract file metadata',
      'Perform static analysis',
      'Execute in sandbox environment',
      'Generate YARA signatures'
    ],
    prerequisites: ['Malware Fundamentals', 'YARA Rules', 'Sandbox Usage'],
    estimatedCompletion: '3.5 hours',
    points: 400,
    icon: Shield
  }
]

export default function LabCreationPage() {
  const router = useRouter()
  const { userId } = useParams() as { userId: string }
  const [selectedTemplate, setSelectedTemplate] = useState<LabTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateLab = async (template: LabTemplate) => {
    setIsCreating(true)

    try {
      // Simulate API call to create lab
      await new Promise(resolve => setTimeout(resolve, 2000))

      // In production, this would create the lab session and redirect
      console.log('Creating lab:', template.title)

      // Navigate back to dashboard with success message
      router.push(`/analyst/${userId}/dashboard?success=lab-created&lab=${template.id}`)

    } catch (error) {
      console.error('Failed to create lab:', error)
      setIsCreating(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'och-cyber-mint'
      case 'intermediate': return 'och-sahara-gold'
      case 'advanced': return 'och-signal-orange'
      default: return 'och-steel-grey'
    }
  }

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '🟢'
      case 'intermediate': return '🟡'
      case 'advanced': return '🔴'
      default: return '⚪'
    }
  }

  return (
    <div className="min-h-screen bg-och-midnight-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-och-midnight-black to-och-steel-grey/50 border-b border-och-defender-blue/30 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-och-steel-grey hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <h1 className="text-4xl font-bold mb-2 text-och-cyber-mint">SOC Lab Creation</h1>
          <p className="text-och-steel">Choose a cybersecurity scenario to practice real-world incident response</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Lab Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {labTemplates.map((template) => {
            const IconComponent = template.icon
            const isSelected = selectedTemplate?.id === template.id

            return (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                  isSelected
                    ? `border-och-defender-blue bg-och-defender-blue/10`
                    : `border-och-steel-grey/30 hover:border-och-defender-blue/50`
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-${getDifficultyColor(template.difficulty)}/20`}>
                        <IconComponent className={`w-6 h-6 text-${getDifficultyColor(template.difficulty)}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{template.title}</h3>
                        <p className="text-sm text-och-steel-grey">{template.category}</p>
                      </div>
                    </div>
                    <Badge variant={template.difficulty === 'beginner' ? 'mint' : template.difficulty === 'intermediate' ? 'gold' : 'orange'}>
                      {getDifficultyIcon(template.difficulty)} {template.difficulty}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-och-steel-grey mb-4">{template.description}</p>

                  {/* Metadata */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-och-steel-grey" />
                      <span className="text-och-steel-grey">{template.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-och-cyber-mint" />
                      <span className="text-och-cyber-mint">{template.points} points</span>
                    </div>
                  </div>

                  {/* Objectives Preview */}
                  <div className="mb-4">
                    <p className="text-xs text-och-steel-grey mb-2">Key Objectives:</p>
                    <ul className="text-xs text-och-steel-grey space-y-1">
                      {template.objectives.slice(0, 2).map((objective, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-och-cyber-mint mt-1">•</span>
                          <span>{objective}</span>
                        </li>
                      ))}
                      {template.objectives.length > 2 && (
                        <li className="text-och-steel-grey/60">+{template.objectives.length - 2} more...</li>
                      )}
                    </ul>
                  </div>

                  {/* Action */}
                  <Button
                    className={`w-full ${isSelected ? 'bg-och-defender-blue' : 'bg-och-steel-grey/50 hover:bg-och-defender-blue/50'}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCreateLab(template)
                    }}
                    disabled={isCreating}
                  >
                    {isCreating && selectedTemplate?.id === template.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Creating Lab...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Lab
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Lab Details Panel */}
        {selectedTemplate && (
          <div className="mt-8">
            <Card className="border-och-defender-blue/30 bg-och-defender-blue/5">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-${getDifficultyColor(selectedTemplate.difficulty)}/20`}>
                    <selectedTemplate.icon className={`w-8 h-8 text-${getDifficultyColor(selectedTemplate.difficulty)}`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-white">{selectedTemplate.title}</h2>
                      <Badge variant={selectedTemplate.difficulty === 'beginner' ? 'mint' : selectedTemplate.difficulty === 'intermediate' ? 'gold' : 'orange'}>
                        {selectedTemplate.difficulty.toUpperCase()}
                      </Badge>
                    </div>

                    <p className="text-och-steel-grey mb-4">{selectedTemplate.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-3 bg-och-steel-grey/20 rounded-lg">
                        <div className="text-2xl font-bold text-och-cyber-mint">{selectedTemplate.points}</div>
                        <div className="text-sm text-och-steel-grey">Points</div>
                      </div>
                      <div className="text-center p-3 bg-och-steel-grey/20 rounded-lg">
                        <div className="text-2xl font-bold text-och-sahara-gold">{selectedTemplate.estimatedCompletion}</div>
                        <div className="text-sm text-och-steel-grey">Estimated Time</div>
                      </div>
                      <div className="text-center p-3 bg-och-steel-grey/20 rounded-lg">
                        <div className="text-2xl font-bold text-och-defender-blue">{selectedTemplate.objectives.length}</div>
                        <div className="text-sm text-och-steel-grey">Objectives</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Learning Objectives</h3>
                        <ul className="space-y-2">
                          {selectedTemplate.objectives.map((objective, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-och-cyber-mint mt-1 flex-shrink-0" />
                              <span className="text-sm text-och-steel-grey">{objective}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Prerequisites</h3>
                        <ul className="space-y-2">
                          {selectedTemplate.prerequisites.map((prereq, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Shield className="w-4 h-4 text-och-sahara-gold mt-1 flex-shrink-0" />
                              <span className="text-sm text-och-steel-grey">{prereq}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
