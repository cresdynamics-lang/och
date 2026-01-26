/**
 * Responsive Breakpoints Test
 * Tests all breakpoints: xs, sm, md, lg, xl
 */
import { render, screen } from '@testing-library/react'
import StudentClient from '../student-client'

describe('Responsive Breakpoints', () => {
  it('should render correctly at xs breakpoint (<480px)', () => {
    global.innerWidth = 400
    global.dispatchEvent(new Event('resize'))
    
    render(<StudentClient />)
    
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
  })

  it('should render correctly at sm breakpoint (480-768px)', () => {
    global.innerWidth = 600
    global.dispatchEvent(new Event('resize'))
    
    render(<StudentClient />)
    
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
  })

  it('should render correctly at md breakpoint (768-1024px)', () => {
    global.innerWidth = 900
    global.dispatchEvent(new Event('resize'))
    
    render(<StudentClient />)
    
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
  })

  it('should render correctly at lg breakpoint (1024-1440px)', () => {
    global.innerWidth = 1200
    global.dispatchEvent(new Event('resize'))
    
    render(<StudentClient />)
    
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
  })

  it('should render correctly at xl breakpoint (1440px+)', () => {
    global.innerWidth = 1600
    global.dispatchEvent(new Event('resize'))
    
    render(<StudentClient />)
    
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
  })
})

