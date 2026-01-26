'use client'

import { useState, useRef, DragEvent, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { MobileUpload } from './MobileUpload'

interface ArtifactUploadProps {
  onFilesSelected: (files: FileList) => Promise<void>
  maxSize?: number // in MB
  acceptedTypes?: string[]
  uploading?: boolean
  uploadProgress?: number
}

export function ArtifactUpload({
  onFilesSelected,
  maxSize = 10,
  acceptedTypes = ['.pdf', '.zip', '.png', '.jpg', '.jpeg', '.txt', '.log'],
  uploading = false,
  uploadProgress = 0,
}: ArtifactUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
  }, [])

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File ${file.name} exceeds ${maxSize}MB limit`
    }
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (acceptedTypes.length > 0 && !acceptedTypes.some(type => file.name.toLowerCase().endsWith(type.toLowerCase()))) {
      return `File type not accepted. Accepted: ${acceptedTypes.join(', ')}`
    }
    return null
  }

  const handleFiles = async (files: FileList) => {
    setError(null)
    const fileArray = Array.from(files)
    
    // Validate all files
    for (const file of fileArray) {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    try {
      await onFilesSelected(files)
    } catch (err: any) {
      setError(err.message || 'Failed to upload files')
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  return (
    <div className="space-y-4">
      {/* Mobile Upload */}
      {isMobile && (
        <MobileUpload
          onFilesSelected={handleFiles}
          onCameraCapture={async (file) => {
            const fileList = {
              length: 1,
              0: file,
              item: (index: number) => index === 0 ? file : null,
              [Symbol.iterator]: function* () { yield file; }
            } as FileList
            await handleFiles(fileList)
          }}
          uploading={uploading}
        />
      )}

      {/* Desktop Upload */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging 
            ? 'border-och-defender bg-och-defender/10' 
            : 'border-och-steel/30 bg-och-midnight/30 hover:border-och-steel/50'
          }
          ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
          ${isMobile ? 'hidden' : ''}
        `}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={uploading}
        />
        
        <div className="space-y-2">
          <div className="text-4xl">📎</div>
          <p className="text-white font-semibold">
            {isDragging ? 'Drop files here' : 'Drag & drop files or click to browse'}
          </p>
          <p className="text-sm text-och-steel">
            Accepted: {acceptedTypes.join(', ')} (max {maxSize}MB each)
          </p>
        </div>
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-och-steel">Uploading...</span>
            <span className="text-white font-semibold">{uploadProgress}%</span>
          </div>
          <ProgressBar value={uploadProgress} className="h-2" />
        </div>
      )}

      {error && (
        <div className="p-3 bg-och-orange/20 border border-och-orange/40 rounded text-sm text-och-orange">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          Browse Files
        </Button>
      </div>
    </div>
  )
}

