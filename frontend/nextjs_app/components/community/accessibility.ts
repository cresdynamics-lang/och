/**
 * Community Module Accessibility Utilities
 * 
 * WCAG 2.1 AA compliance utilities for the community module.
 * Ensures proper accessibility for all users including those using
 * screen readers, keyboard navigation, and other assistive technologies.
 */

// Keyboard navigation keys
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const

/**
 * ARIA live region announcement types
 */
export type LiveRegionPoliteness = 'polite' | 'assertive' | 'off'

/**
 * Announce message to screen readers via live region
 */
export function announceToScreenReader(
  message: string,
  politeness: LiveRegionPoliteness = 'polite'
): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', politeness)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Remove after announcement is made
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Generate unique ID for accessibility associations
 */
export function generateA11yId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Focus trap utilities for modals and dialogs
 */
export function createFocusTrap(containerRef: HTMLElement | null) {
  if (!containerRef) return { activate: () => {}, deactivate: () => {} }
  
  const focusableElements = containerRef.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  const firstFocusable = focusableElements[0]
  const lastFocusable = focusableElements[focusableElements.length - 1]
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== KEYBOARD_KEYS.TAB) return
    
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault()
        lastFocusable?.focus()
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault()
        firstFocusable?.focus()
      }
    }
  }
  
  return {
    activate: () => {
      containerRef.addEventListener('keydown', handleKeyDown)
      firstFocusable?.focus()
    },
    deactivate: () => {
      containerRef.removeEventListener('keydown', handleKeyDown)
    }
  }
}

/**
 * Props for accessible buttons/interactive elements
 */
export interface AccessibleButtonProps {
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaExpanded?: boolean
  ariaHasPopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
  ariaPressed?: boolean
  ariaDisabled?: boolean
  role?: string
}

/**
 * Get ARIA props for buttons
 */
export function getButtonA11yProps({
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaHasPopup,
  ariaPressed,
  ariaDisabled,
  role,
}: AccessibleButtonProps): Record<string, string | boolean | undefined> {
  return {
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-expanded': ariaExpanded,
    'aria-haspopup': ariaHasPopup,
    'aria-pressed': ariaPressed,
    'aria-disabled': ariaDisabled,
    role,
  }
}

/**
 * Handle keyboard interaction for custom interactive elements
 */
export function handleKeyboardInteraction(
  event: React.KeyboardEvent,
  onActivate: () => void
): void {
  if (event.key === KEYBOARD_KEYS.ENTER || event.key === KEYBOARD_KEYS.SPACE) {
    event.preventDefault()
    onActivate()
  }
}

/**
 * Props for list/feed navigation
 */
export interface ListNavigationProps {
  currentIndex: number
  itemCount: number
  onNavigate: (index: number) => void
}

/**
 * Handle keyboard navigation in lists/feeds
 */
export function handleListNavigation(
  event: React.KeyboardEvent,
  { currentIndex, itemCount, onNavigate }: ListNavigationProps
): void {
  let newIndex = currentIndex
  
  switch (event.key) {
    case KEYBOARD_KEYS.ARROW_DOWN:
      event.preventDefault()
      newIndex = Math.min(currentIndex + 1, itemCount - 1)
      break
    case KEYBOARD_KEYS.ARROW_UP:
      event.preventDefault()
      newIndex = Math.max(currentIndex - 1, 0)
      break
    case KEYBOARD_KEYS.HOME:
      event.preventDefault()
      newIndex = 0
      break
    case KEYBOARD_KEYS.END:
      event.preventDefault()
      newIndex = itemCount - 1
      break
    default:
      return
  }
  
  if (newIndex !== currentIndex) {
    onNavigate(newIndex)
  }
}

/**
 * Skip link component props
 */
export interface SkipLinkProps {
  href: string
  children: React.ReactNode
}

/**
 * Color contrast check (WCAG AA: 4.5:1 for normal text, 3:1 for large text)
 */
export function meetsContrastRatio(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  // This is a simplified check - in production, use a proper color contrast library
  const requiredRatio = isLargeText ? 3 : 4.5
  // Implementation would calculate actual contrast ratio
  return true // Placeholder - implement with actual color math
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * ARIA descriptions for common community actions
 */
export const ARIA_LABELS = {
  // Navigation
  communityNav: 'Community navigation',
  feedTabs: 'Feed type selection',
  
  // Posts
  postCard: (title: string) => `Post: ${title}`,
  createPost: 'Create new post',
  deletePost: 'Delete this post',
  editPost: 'Edit this post',
  pinPost: 'Pin this post',
  
  // Reactions
  reactionButton: (type: string, count: number) => `${type} reaction, ${count} total`,
  addReaction: 'Add reaction',
  removeReaction: 'Remove reaction',
  
  // Comments
  commentSection: (count: number) => `${count} comments`,
  addComment: 'Add a comment',
  replyToComment: 'Reply to this comment',
  
  // Events
  eventCard: (title: string) => `Event: ${title}`,
  registerEvent: 'Register for this event',
  unregisterEvent: 'Cancel registration',
  
  // Leaderboard
  leaderboard: 'Community leaderboard',
  leaderboardRank: (rank: number, name: string) => `Rank ${rank}: ${name}`,
  
  // Search
  searchInput: 'Search community',
  searchResults: (count: number) => `${count} search results`,
  
  // Moderation
  moderationActions: 'Moderation actions',
  hideContent: 'Hide this content',
  reportContent: 'Report this content',
} as const

/**
 * Live region messages for dynamic updates
 */
export const LIVE_MESSAGES = {
  postCreated: 'Your post has been published',
  postDeleted: 'Post deleted',
  commentAdded: 'Comment added',
  reactionAdded: (type: string) => `${type} reaction added`,
  reactionRemoved: 'Reaction removed',
  eventRegistered: 'You are now registered for this event',
  eventUnregistered: 'Registration cancelled',
  feedLoading: 'Loading more posts',
  feedLoaded: (count: number) => `${count} new posts loaded`,
  searchCompleted: (count: number) => `Found ${count} results`,
  error: (message: string) => `Error: ${message}`,
} as const

/**
 * CSS class for visually hidden but screen reader accessible content
 */
export const SR_ONLY_CLASS = 'sr-only'

/**
 * Tailwind CSS for screen reader only content
 * Use this in your components: className={SR_ONLY_STYLES}
 */
export const SR_ONLY_STYLES = 'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 [clip:rect(0,0,0,0)]'

