import { ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  children: ReactNode | ReactNode[]
  className?: string
  glow?: boolean
  gradient?: 'defender' | 'leadership' | 'none'
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
}

export const Card = ({ children, className, glow = false, gradient = 'none', onClick }: CardProps) => {
  const gradientClasses = {
    defender: 'bg-defender-gradient',
    leadership: 'bg-leadership-gradient',
    none: 'bg-och-midnight border border-och-steel/20',
  }
  
  return (
    <div
      className={clsx(
        'rounded-xl p-6 shadow-lg',
        gradientClasses[gradient],
        glow && 'animate-pulse-glow',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

