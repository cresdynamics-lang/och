"use client"

import * as React from "react"
import clsx from "clsx"

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined)

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={clsx(
        "inline-flex h-10 items-center justify-center rounded-md bg-slate-800/50 p-1 text-slate-400",
        className
      )}
    >
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("TabsTrigger must be used within Tabs")
  
  const isActive = context.value === value
  
  return (
    <button
      onClick={() => context.onValueChange(value)}
      className={clsx(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:pointer-events-none disabled:opacity-50",
        isActive ? "bg-slate-700 text-slate-50" : "text-slate-400 hover:text-slate-200",
        className
      )}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("TabsContent must be used within Tabs")
  
  if (context.value !== value) return null
  
  return (
    <div className={clsx("mt-2", className)}>
      {children}
    </div>
  )
}

