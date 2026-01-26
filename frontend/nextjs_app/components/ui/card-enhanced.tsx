import { ReactNode } from 'react'
import clsx from 'clsx'

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={clsx('pb-4', className)}>
      {children}
    </div>
  )
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={clsx('pb-6', className)}>
      {children}
    </div>
  )
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={clsx('pt-4 border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-sm', className)}>
      {children}
    </div>
  )
}

interface CardEnhancedProps {
  children: ReactNode
  className?: string
  glow?: boolean
  gradient?: 'defender' | 'leadership' | 'none'
}

export function CardEnhanced({ children, className, glow = false, gradient = 'none' }: CardEnhancedProps) {
  const gradientClasses = {
    defender: 'bg-defender-gradient',
    leadership: 'bg-leadership-gradient',
    none: 'bg-slate-900/70 border border-slate-800/60',
  }
  
  return (
    <div
      className={clsx(
        'rounded-xl p-6 shadow-lg group hover:bg-slate-900/90 hover:border-indigo-500/50 transition-all duration-300 overflow-hidden',
        gradientClasses[gradient],
        glow && 'animate-pulse-glow',
        className
      )}
    >
      {children}
    </div>
  )
}

CardEnhanced.Header = CardHeader
CardEnhanced.Content = CardContent
CardEnhanced.Footer = CardFooter

