/**
 * Mobile Swipe Gestures Test
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { NextActionsCarousel } from '../components/NextActionsCarousel'

describe('Swipe Gestures', () => {
  it('should handle touch start', () => {
    render(<NextActionsCarousel />)
    
    const carousel = screen.getByRole('region', { name: /next actions/i })
    
    fireEvent.touchStart(carousel, {
      targetTouches: [{ clientX: 100 }],
    })
    
    expect(carousel).toBeInTheDocument()
  })

  it('should handle touch move', () => {
    render(<NextActionsCarousel />)
    
    const carousel = screen.getByRole('region', { name: /next actions/i })
    
    fireEvent.touchStart(carousel, {
      targetTouches: [{ clientX: 100 }],
    })
    
    fireEvent.touchMove(carousel, {
      targetTouches: [{ clientX: 50 }],
    })
    
    expect(carousel).toBeInTheDocument()
  })

  it('should handle touch end with swipe', () => {
    render(<NextActionsCarousel />)
    
    const carousel = screen.getByRole('region', { name: /next actions/i })
    
    fireEvent.touchStart(carousel, {
      targetTouches: [{ clientX: 100 }],
    })
    
    fireEvent.touchMove(carousel, {
      targetTouches: [{ clientX: 30 }],
    })
    
    fireEvent.touchEnd(carousel)
    
    expect(carousel).toBeInTheDocument()
  })
})

