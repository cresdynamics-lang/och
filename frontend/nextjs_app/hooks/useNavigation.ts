'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'

interface UseNavigationOptions {
  storageKey?: string
  autoExpandActive?: boolean
}

export function useNavigation(options: UseNavigationOptions = {}) {
  const { storageKey = 'nav-expanded', autoExpandActive = true } = options
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  // Load expanded state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          const savedSet = new Set(JSON.parse(saved) as string[])
          setExpandedItems(savedSet)
        }
      } catch (err) {
        console.error('Failed to load navigation state:', err)
      }
    }
  }, [storageKey])

  // Save expanded state to localStorage
  const saveExpandedState = useCallback(
    (items: Set<string>) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, JSON.stringify(Array.from(items)))
        } catch (err) {
          console.error('Failed to save navigation state:', err)
        }
      }
    },
    [storageKey]
  )

  // Auto-expand items with active children
  useEffect(() => {
    if (autoExpandActive && pathname) {
      // This will be handled by the navigation component
    }
  }, [pathname, autoExpandActive])

  const toggleExpanded = useCallback(
    (label: string) => {
      setExpandedItems((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(label)) {
          newSet.delete(label)
        } else {
          newSet.add(label)
        }
        saveExpandedState(newSet)
        return newSet
      })
    },
    [saveExpandedState]
  )

  const expandAll = useCallback(() => {
    setExpandedItems((prev) => {
      // This will be handled by the component with the full list
      return prev
    })
  }, [])

  const collapseAll = useCallback(() => {
    setExpandedItems(new Set())
    saveExpandedState(new Set())
  }, [saveExpandedState])

  const setExpanded = useCallback(
    (label: string, expanded: boolean) => {
      setExpandedItems((prev) => {
        const newSet = new Set(prev)
        if (expanded) {
          newSet.add(label)
        } else {
          newSet.delete(label)
        }
        saveExpandedState(newSet)
        return newSet
      })
    },
    [saveExpandedState]
  )

  return {
    expandedItems,
    toggleExpanded,
    expandAll,
    collapseAll,
    setExpanded,
    searchQuery,
    setSearchQuery,
  }
}


