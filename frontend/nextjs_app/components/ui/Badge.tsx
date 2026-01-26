import { ReactNode } from 'react'
import clsx from 'clsx'

interface BadgeProps {
  children: ReactNode
  variant?: 'defender' | 'mint' | 'gold' | 'orange' | 'steel' | 'outline'
  className?: string
}

export const Badge = ({ children, variant = 'defender', className }: BadgeProps) => {
  const variants = {
    defender: 'bg-och-defender/20 text-och-defender border-och-defender/40',
    mint: 'bg-och-mint/20 text-och-mint border-och-mint/40',
    gold: 'bg-och-gold/20 text-och-gold border-och-gold/40',
    orange: 'bg-och-orange/20 text-och-orange border-och-orange/40',
    steel: 'bg-och-steel/20 text-och-steel border-och-steel/40',
    outline: 'bg-transparent text-white border-och-steel/40',
  }
  
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

