import clsx from 'clsx'

interface ProgressBarProps {
  value: number
  max?: number
  variant?: 'defender' | 'mint' | 'gold' | 'orange'
  showLabel?: boolean
  className?: string
}

export const ProgressBar = ({
  value,
  max = 100,
  variant = 'defender',
  showLabel = true,
  className,
}: ProgressBarProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const variants = {
    defender: 'bg-och-defender',
    mint: 'bg-och-mint',
    gold: 'bg-och-gold',
    orange: 'bg-och-orange',
  }
  
  return (
    <div className={clsx('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-och-steel">Progress</span>
          <span className="text-och-steel">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full bg-och-steel/20 rounded-full h-2.5 overflow-hidden">
        <div
          className={clsx('h-full transition-all duration-500 rounded-full', variants[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

