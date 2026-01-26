import { InputHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'outline'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant = 'default', className, ...props }, ref) => {
    const baseStyles = 'w-full px-4 py-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-och-midnight'
    
    const variants = {
      default: 'bg-och-midnight/50 border border-och-defender/20 text-white placeholder-och-steel focus:ring-och-defender focus:border-och-defender',
      outline: 'bg-transparent border-2 border-och-defender text-white placeholder-och-steel focus:ring-och-defender focus:border-och-gold',
    }
    
    return (
      <input
        ref={ref}
        className={clsx(baseStyles, variants[variant], className)}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'


