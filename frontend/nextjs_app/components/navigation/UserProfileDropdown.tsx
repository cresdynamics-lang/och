'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { getPrimaryRole } from '@/utils/rbac'
import { getProfilePath, getSettingsPath } from '@/utils/navigation'

// Helper function to get role display name
function getRoleDisplayName(role: string | null): string {
  if (!role) return 'User'

  const roleMap: Record<string, string> = {
    'student': 'Student',
    'mentee': 'Student',
    'mentor': 'Mentor',
    'admin': 'Admin',
    'program_director': 'Program Director',
    'sponsor_admin': 'Sponsor',
    'employer': 'Employer',
    'analyst': 'Analyst',
    'finance': 'Finance Director',
  }

  return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ')
}

export function UserProfileDropdown() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get primary role dynamically
  const primaryRole = useMemo(() => getPrimaryRole(user), [user])
  const roleDisplayName = useMemo(() => getRoleDisplayName(primaryRole), [primaryRole])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleLogout = async () => {
    setIsOpen(false)
    await logout()
  }

  const userInitials = user?.first_name && user?.last_name
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : user?.email?.[0].toUpperCase() || 'U'

  const userName = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.email || 'User'

  const profilePath = getProfilePath(user)
  const settingsPath = getSettingsPath(user)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-och-defender/20 transition-colors"
        aria-label="User menu"
      >
        <div className="w-10 h-10 rounded-full bg-och-defender flex items-center justify-center text-white font-semibold">
          {userInitials}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-white">{userName}</div>
          <div className="text-xs text-och-steel">{roleDisplayName}</div>
        </div>
        <svg
          className={`w-4 h-4 text-och-steel transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-och-midnight border border-och-steel/20 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-och-steel/20">
            <div className="text-sm font-medium text-white">{user?.email || userName}</div>
            <div className="text-xs text-och-steel mt-1">{roleDisplayName}</div>
          </div>
          <div className="py-2">
            <Link
              href={profilePath}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-och-steel hover:bg-och-defender/20 hover:text-och-mint transition-colors"
            >
              Profile
            </Link>
            <Link
              href={settingsPath}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-och-steel hover:bg-och-defender/20 hover:text-och-mint transition-colors"
            >
              Settings
            </Link>
            <Link
              href="/help"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-och-steel hover:bg-och-defender/20 hover:text-och-mint transition-colors"
            >
              Help
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-och-orange hover:bg-och-orange/20 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
