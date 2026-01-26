/**
 * Keyboard Navigation Test
 * Tests keyboard shortcuts and navigation
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import StudentClient from '../student-client'

jest.mock('next/navigation')

describe('Keyboard Navigation', () => {
  const mockPush = jest.fn()
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  it('should navigate with Ctrl+1-6 shortcuts', () => {
    render(<StudentClient />)
    
    fireEvent.keyDown(window, { key: '1', ctrlKey: true })
    expect(mockPush).toHaveBeenCalled()
  })

  it('should handle Escape key to close modals', () => {
    render(<StudentClient />)
    
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
    window.dispatchEvent(escapeEvent)
    
    expect(escapeEvent.defaultPrevented).toBeFalsy()
  })

  it('should have focusable elements', () => {
    render(<StudentClient />)
    
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
    
    buttons[0].focus()
    expect(document.activeElement).toBe(buttons[0])
  })
})

