'use client'

import { useEffect, useRef, useState } from 'react'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  label: string
  required?: boolean
  min?: string
  max?: string
  className?: string
  placeholder?: string
}

function parseYmd(value: string): Date | null {
  // Avoid `new Date('YYYY-MM-DD')` timezone quirks by constructing a local date.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null
  return new Date(year, month - 1, day)
}

function formatYmd(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isBeforeDay(a: Date, b: Date): boolean {
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()
  return aa < bb
}

export function DatePicker({
  value,
  onChange,
  label,
  required = false,
  min,
  max,
  className = '',
  placeholder = 'Select a date',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? parseYmd(value) : null)
  const [currentMonth, setCurrentMonth] = useState(() => (value ? parseYmd(value) || new Date() : new Date()))
  const pickerRef = useRef<HTMLDivElement>(null)

  const minDate = min ? parseYmd(min) : null
  const maxDate = max ? parseYmd(max) : null

  useEffect(() => {
    if (value) {
      const date = parseYmd(value)
      setSelectedDate(date)
      if (date) setCurrentMonth(date)
    } else {
      setSelectedDate(null)
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null)
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day))
    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const next = new Date(prev)
      next.setMonth(prev.getMonth() + (direction === 'prev' ? -1 : 1))
      return next
    })
  }

  const isDisabled = (date: Date) => {
    if (minDate && isBeforeDay(date, minDate)) return true
    if (maxDate && isBeforeDay(maxDate, date)) return true
    return false
  }

  const days = getDaysInMonth(currentMonth)

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      <label className="block text-sm font-medium text-white mb-2">
        {label} {required && <span className="text-och-orange">*</span>}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-left hover:border-och-defender focus:outline-none focus:border-och-defender transition-colors"
      >
        {value ? new Date(`${value}T00:00:00`).toLocaleDateString() : placeholder}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-och-midnight border border-och-steel/20 rounded-lg shadow-xl p-4 w-[320px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-och-steel/20 rounded-lg transition-colors"
              aria-label="Previous month"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-white font-semibold">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-och-steel/20 rounded-lg transition-colors"
              aria-label="Next month"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Grid */}
          <div className="mb-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((d) => (
                <div key={d} className="text-center text-xs text-och-steel font-medium py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((date, idx) => {
                if (!date) return <div key={`empty-${idx}`} className="aspect-square" />

                const selected = selectedDate ? isSameDay(date, selectedDate) : false
                const today = isSameDay(date, new Date())
                const disabled = isDisabled(date)

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      if (disabled) return
                      setSelectedDate(date)
                      onChange(formatYmd(date))
                      setIsOpen(false)
                    }}
                    className={`
                      aspect-square rounded-lg text-sm transition-colors
                      ${disabled ? 'opacity-40 cursor-not-allowed text-och-steel' : ''}
                      ${selected
                        ? 'bg-och-defender text-white font-semibold'
                        : today
                        ? 'bg-och-steel/30 text-white font-medium hover:bg-och-steel/40'
                        : 'text-och-steel hover:bg-och-steel/20 hover:text-white'
                      }
                    `}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="border-t border-och-steel/20 pt-3 flex items-center justify-between">
            <button
              type="button"
              className="text-xs text-och-steel hover:text-white transition-colors"
              onClick={() => {
                onChange('')
                setSelectedDate(null)
                setIsOpen(false)
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="text-xs text-och-defender hover:text-och-mint transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
