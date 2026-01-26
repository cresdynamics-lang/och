'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface MobileUploadProps {
  onFilesSelected: (files: FileList) => Promise<void>
  onCameraCapture?: (file: File) => Promise<void>
  uploading?: boolean
}

export function MobileUpload({ onFilesSelected, uploading = false }: MobileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  
  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files)
    }
  }

  const handleCameraCapture = () => {
    cameraInputRef.current?.click()
  }
  
  const handleCameraInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files)
    }
  }

  const handleGalleryPick = () => {
    fileInputRef.current?.click()
  }

  if (!isMobile) {
    return null // Don't show on desktop
  }

  return (
    <Card className="bg-och-midnight/50 border border-och-steel/20">
      <div className="p-4 space-y-3">
        <p className="text-sm font-semibold text-white mb-2">Mobile Upload</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCameraCapture}
            disabled={uploading}
            className="flex-1"
          >
            📷 Camera
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGalleryPick}
            disabled={uploading}
            className="flex-1"
          >
            🖼️ Gallery
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileInput}
          className="hidden"
          multiple
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraInput}
          className="hidden"
        />
      </div>
    </Card>
  )
}

