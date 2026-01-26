"use client"

import * as React from "react"
import { X } from "lucide-react"
import clsx from "clsx"

interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined)

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

interface DialogTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

export function DialogTrigger({ children, asChild }: DialogTriggerProps) {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("DialogTrigger must be used within Dialog")
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: () => context.onOpenChange(true),
    } as any)
  }
  
  return (
    <button onClick={() => context.onOpenChange(true)}>
      {children}
    </button>
  )
}

interface DialogOverlayProps {
  className?: string
}

export function DialogOverlay({ className }: DialogOverlayProps) {
  const context = React.useContext(DialogContext)
  if (!context) return null
  
  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 bg-black/80",
        className
      )}
      onClick={() => context.onOpenChange(false)}
    />
  )
}

interface DialogContentProps {
  children: React.ReactNode
  className?: string
}

export function DialogContent({ children, className }: DialogContentProps) {
  const context = React.useContext(DialogContext)
  if (!context || !context.open) return null
  
  return (
    <>
      <DialogOverlay />
      <div
        className={clsx(
          "fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-800 bg-slate-900 p-6 shadow-lg rounded-lg",
          className
        )}
      >
        {children}
        <button
          onClick={() => context.onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </>
  )
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return (
    <div
      className={clsx(
        "flex flex-col space-y-1.5 text-center sm:text-left",
        className
      )}
      {...props}
    />
  )
}

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function DialogFooter({ className, ...props }: DialogFooterProps) {
  return (
    <div
      className={clsx(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
      {...props}
    />
  )
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string
}

export const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={clsx(
        "text-lg font-semibold leading-none tracking-tight text-slate-50",
        className
      )}
      {...props}
    />
  )
)
DialogTitle.displayName = "DialogTitle"

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string
}

export const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={clsx("text-sm text-slate-400", className)}
      {...props}
    />
  )
)
DialogDescription.displayName = "DialogDescription"

export const DialogClose = ({ children }: { children: React.ReactNode }) => {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("DialogClose must be used within Dialog")
  
  return (
    <button onClick={() => context.onOpenChange(false)}>
      {children}
    </button>
  )
}

