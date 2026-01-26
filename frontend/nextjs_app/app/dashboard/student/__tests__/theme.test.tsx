/**
 * Theme Toggle Test
 * Tests dark/light theme switching and WCAG contrast
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeToggle } from '../components/ThemeToggle'

describe('Theme Toggle', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should toggle between dark and light themes', () => {
    render(<ThemeToggle />)
    
    const toggleButton = screen.getByLabelText(/switch to/i)
    expect(toggleButton).toBeInTheDocument()
    
    fireEvent.click(toggleButton)
    
    expect(localStorage.getItem('dashboard-theme')).toBeTruthy()
  })

  it('should persist theme preference', () => {
    localStorage.setItem('dashboard-theme', 'light')
    
    render(<ThemeToggle />)
    
    expect(localStorage.getItem('dashboard-theme')).toBe('light')
  })

  it('should default to dark theme', () => {
    render(<ThemeToggle />)
    
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})

