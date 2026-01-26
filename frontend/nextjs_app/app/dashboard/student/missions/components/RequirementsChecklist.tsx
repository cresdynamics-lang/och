'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface Requirement {
  id: string
  description: string
  type: 'file' | 'github' | 'notebook' | 'video' | 'screenshot' | 'text'
  required: boolean
}

interface RequirementsChecklistProps {
  requirements: Requirement[]
  completed: {
    files: number
    github?: boolean
    notebook?: boolean
    video?: boolean
    screenshots?: number
  }
}

export function RequirementsChecklist({ requirements, completed }: RequirementsChecklistProps) {
  if (!requirements || requirements.length === 0) {
    return null
  }

  const getRequirementStatus = (req: Requirement): { completed: boolean; count?: number } => {
    switch (req.type) {
      case 'file':
        return { completed: completed.files > 0, count: completed.files }
      case 'github':
        return { completed: completed.github === true }
      case 'notebook':
        return { completed: completed.notebook === true }
      case 'video':
        return { completed: completed.video === true }
      case 'screenshot':
        return { completed: (completed.screenshots || 0) > 0, count: completed.screenshots }
      default:
        return { completed: false }
    }
  }

  const totalRequired = requirements.filter(r => r.required).length
  const completedRequired = requirements.filter(r => {
    if (!r.required) return false
    const status = getRequirementStatus(r)
    return status.completed
  }).length

  return (
    <Card className="bg-och-midnight/50 border border-och-steel/20">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Requirements</h3>
          <Badge variant={completedRequired === totalRequired ? 'mint' : 'steel'}>
            {completedRequired}/{totalRequired} completed
          </Badge>
        </div>

        <div className="space-y-2">
          {requirements.map((req) => {
            const status = getRequirementStatus(req)
            const isCompleted = status.completed
            
            return (
              <div
                key={req.id}
                className={`
                  flex items-start gap-3 p-2 rounded
                  ${isCompleted ? 'bg-och-mint/10 border border-och-mint/20' : 'bg-och-midnight/30'}
                `}
              >
                <div className={`mt-1 ${isCompleted ? 'text-och-mint' : 'text-och-steel'}`}>
                  {isCompleted ? '✓' : '○'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${isCompleted ? 'text-white line-through' : 'text-white'}`}>
                      {req.description}
                    </span>
                    {req.required && (
                      <Badge variant="orange" className="text-xs">Required</Badge>
                    )}
                    {status.count !== undefined && (
                      <Badge variant="steel" className="text-xs">
                        {status.count}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

