import { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'defender' | 'mint' | 'gold' | 'orange' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  glow?: boolean
  children: ReactNode
}

export const Button = ({
  variant = 'defender',
  size = 'md',
  glow = false,
  className,
  children,
  ...props
}: ButtonProps) => {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-och-midnight'
  
  const variants = {
    defender: 'bg-och-defender text-white hover:bg-opacity-90 focus:ring-och-defender',
    mint: 'bg-och-mint text-och-midnight hover:bg-opacity-90 focus:ring-och-mint',
    gold: 'bg-och-gold text-och-midnight hover:bg-opacity-90 focus:ring-och-gold',
    orange: 'bg-och-orange text-white hover:bg-opacity-90 focus:ring-och-orange',
    outline: 'border-2 border-och-defender text-och-defender hover:bg-och-defender hover:text-white focus:ring-och-defender',
    ghost: 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 focus:ring-slate-400',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }
  
  return (
    <button
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        glow && 'animate-glow',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}




