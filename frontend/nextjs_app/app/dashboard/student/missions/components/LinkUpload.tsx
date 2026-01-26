'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface LinkUploadProps {
  type: 'github' | 'notebook' | 'video'
  label: string
  placeholder: string
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
}

const validateURL = (url: string, type: string): string | null => {
  if (!url.trim()) return null // Empty is OK
  
  try {
    const urlObj = new URL(url)
    
    switch (type) {
      case 'github':
        if (!urlObj.hostname.includes('github.com')) {
          return 'Must be a GitHub URL'
        }
        break
      case 'notebook':
        if (!urlObj.hostname.includes('colab.research.google.com') && 
            !urlObj.hostname.includes('jupyter.org') &&
            !urlObj.hostname.includes('kaggle.com')) {
          return 'Must be a Jupyter/Colab/Kaggle notebook URL'
        }
        break
      case 'video':
        if (!urlObj.hostname.includes('youtube.com') && 
            !urlObj.hostname.includes('youtu.be') &&
            !urlObj.hostname.includes('vimeo.com')) {
          return 'Must be a YouTube or Vimeo URL'
        }
        break
    }
    
    return null
  } catch {
    return 'Invalid URL format'
  }
}

export function LinkUpload({
  type,
  label,
  placeholder,
  value = '',
  onChange,
  onRemove,
}: LinkUploadProps) {
  const [url, setUrl] = useState(value)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (newUrl: string) => {
    setUrl(newUrl)
    setError(null)
    
    const validationError = validateURL(newUrl, type)
    if (validationError) {
      setError(validationError)
    } else {
      onChange(newUrl)
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'github': return '🔗'
      case 'notebook': return '📓'
      case 'video': return '🎥'
      default: return '🔗'
    }
  }

  return (
    <Card className="bg-och-midnight/50 border border-och-steel/20">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-white flex items-center gap-2">
            <span>{getIcon()}</span>
            {label}
          </label>
          {value && onRemove && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRemove}
              className="text-xs"
            >
              Remove
            </Button>
          )}
        </div>
        
        <input
          type="url"
          value={url}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-defender"
        />
        
        {error && (
          <p className="text-xs text-och-orange">{error}</p>
        )}
        
        {value && !error && (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-och-defender hover:text-och-defender/80 underline"
          >
            Open link →
          </a>
        )}
      </div>
    </Card>
  )
}

