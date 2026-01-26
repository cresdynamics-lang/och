'use client'

import { useState, useRef, useEffect } from 'react'

interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  label: string
  required?: boolean
  min?: string
  max?: string
  className?: string
}

export function DateTimePicker({
  value,
  onChange,
  label,
  required = false,
  min,
  max,
  className = '',
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  )
  const [selectedTime, setSelectedTime] = useState<{ hour: number; minute: number }>({
    hour: value ? new Date(value).getHours() : 9,
    minute: value ? new Date(value).getMinutes() : 0,
  })
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      const date = new Date(value)
      setSelectedDate(date)
      setSelectedTime({ hour: date.getHours(), minute: date.getMinutes() })
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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleTimeChange = (type: 'hour' | 'minute', value: number) => {
    setSelectedTime((prev) => ({
      ...prev,
      [type]: value,
    }))
  }

  const handleConfirm = () => {
    if (selectedDate) {
      const dateTime = new Date(selectedDate)
      dateTime.setHours(selectedTime.hour)
      dateTime.setMinutes(selectedTime.minute)
      dateTime.setSeconds(0)
      dateTime.setMilliseconds(0)
      
      // Format as YYYY-MM-DDTHH:mm for datetime-local input
      const year = dateTime.getFullYear()
      const month = String(dateTime.getMonth() + 1).padStart(2, '0')
      const day = String(dateTime.getDate()).padStart(2, '0')
      const hours = String(dateTime.getHours()).padStart(2, '0')
      const minutes = String(dateTime.getMinutes()).padStart(2, '0')
      
      onChange(`${year}-${month}-${day}T${hours}:${minutes}`)
      setIsOpen(false)
    }
  }

  const formatDisplayValue = () => {
    if (!value) return ''
    const date = new Date(value)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const days = getDaysInMonth(currentMonth)
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
        {value ? formatDisplayValue() : 'Select date and time'}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-och-midnight border border-och-steel/20 rounded-lg shadow-xl p-4 w-[320px]">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-och-steel/20 rounded-lg transition-colors"
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
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="mb-4">
            {/* Day names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-xs text-och-steel font-medium py-1">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />
                }
                
                const isDateToday = isToday(date)
                const isDateSelected = isSelected(date)
                
                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => handleDateSelect(date)}
                    className={`
                      aspect-square rounded-lg text-sm transition-colors
                      ${isDateSelected
                        ? 'bg-och-defender text-white font-semibold'
                        : isDateToday
                        ? 'bg-och-steel/30 text-white font-medium'
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

          {/* Time Picker */}
          <div className="border-t border-och-steel/20 pt-4">
            <div className="text-sm text-white font-medium mb-3">Select Time</div>
            <div className="flex items-center gap-4">
              {/* Hour */}
              <div className="flex-1">
                <label className="block text-xs text-och-steel mb-1">Hour</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTimeChange('hour', Math.max(0, selectedTime.hour - 1))}
                    className="p-1 hover:bg-och-steel/20 rounded transition-colors"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={selectedTime.hour}
                    onChange={(e) => handleTimeChange('hour', Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                    className="w-16 px-2 py-1 bg-och-midnight/50 border border-och-steel/20 rounded text-white text-center focus:outline-none focus:border-och-defender"
                  />
                  <button
                    type="button"
                    onClick={() => handleTimeChange('hour', Math.min(23, selectedTime.hour + 1))}
                    className="p-1 hover:bg-och-steel/20 rounded transition-colors"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Minute */}
              <div className="flex-1">
                <label className="block text-xs text-och-steel mb-1">Minute</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTimeChange('minute', Math.max(0, selectedTime.minute - 15))}
                    className="p-1 hover:bg-och-steel/20 rounded transition-colors"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="15"
                    value={selectedTime.minute}
                    onChange={(e) => handleTimeChange('minute', Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-16 px-2 py-1 bg-och-midnight/50 border border-och-steel/20 rounded text-white text-center focus:outline-none focus:border-och-defender"
                  />
                  <button
                    type="button"
                    onClick={() => handleTimeChange('minute', Math.min(59, selectedTime.minute + 15))}
                    className="p-1 hover:bg-och-steel/20 rounded transition-colors"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick time buttons */}
            <div className="mt-3 flex gap-2 flex-wrap">
              {[
                { label: '9:00 AM', hour: 9, minute: 0 },
                { label: '12:00 PM', hour: 12, minute: 0 },
                { label: '2:00 PM', hour: 14, minute: 0 },
                { label: '5:00 PM', hour: 17, minute: 0 },
              ].map((quickTime) => (
                <button
                  key={quickTime.label}
                  type="button"
                  onClick={() => {
                    setSelectedTime({ hour: quickTime.hour, minute: quickTime.minute })
                  }}
                  className="px-3 py-1 text-xs bg-och-steel/20 hover:bg-och-steel/30 text-white rounded transition-colors"
                >
                  {quickTime.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-och-steel/20">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm text-och-steel hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedDate}
              className="px-4 py-2 text-sm bg-och-defender hover:bg-och-defender/80 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

















