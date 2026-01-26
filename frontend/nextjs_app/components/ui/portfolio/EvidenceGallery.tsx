/**
 * Evidence Gallery Component
 * Displays portfolio evidence files (PDF, images, videos, links)
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FileText, Image as ImageIcon, Video, Link as LinkIcon, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { EvidenceFile } from '@/lib/portfolio/types';

interface EvidenceGalleryProps {
  files: EvidenceFile[];
  maxVisible?: number;
  onRemove?: (index: number) => void;
  editable?: boolean;
}

export function EvidenceGallery({
  files,
  maxVisible = 3,
  onRemove,
  editable = false,
}: EvidenceGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  if (files.length === 0) {
    return (
      <div className="text-sm text-slate-500 italic">
        No evidence files attached
      </div>
    );
  }

  const visibleFiles = showAll ? files : files.slice(0, maxVisible);
  const hasMore = files.length > maxVisible;

  const getFileIcon = (type: EvidenceFile['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      case 'image':
        return <ImageIcon className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'link':
        return <LinkIcon className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const handleFileClick = (file: EvidenceFile, index: number) => {
    if (file.type === 'link' && file.url) {
      window.open(file.url, '_blank', 'noopener,noreferrer');
    } else {
      setSelectedIndex(index);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {visibleFiles.map((file, index) => (
          <div
            key={index}
            className="relative group cursor-pointer"
            onClick={() => handleFileClick(file, index)}
          >
            <Card className="p-2 hover:border-indigo-500/50 transition-colors">
              {file.type === 'image' && file.thumbnail ? (
                <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                  <Image
                    src={file.thumbnail}
                    alt={file.name || `Evidence ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center aspect-square bg-slate-800/50 rounded-lg">
                  <div className="text-indigo-400 mb-2">
                    {getFileIcon(file.type)}
                  </div>
                  {file.name && (
                    <p className="text-xs text-slate-400 text-center px-2 truncate w-full">
                      {file.name}
                    </p>
                  )}
                </div>
              )}
              
              {editable && onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(index);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </Card>
          </div>
        ))}
      </div>

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-sm text-indigo-400 hover:text-indigo-300 mt-2"
        >
          View {files.length - maxVisible} more files
        </button>
      )}

      {showAll && hasMore && (
        <button
          onClick={() => setShowAll(false)}
          className="text-sm text-slate-500 hover:text-slate-400 mt-2"
        >
          Show less
        </button>
      )}

      {/* Full-screen preview modal */}
      {selectedIndex !== null && files[selectedIndex] && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedIndex(null)}
        >
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
            
            {files[selectedIndex].type === 'image' ? (
              <Image
                src={files[selectedIndex].url}
                alt={files[selectedIndex].name || 'Evidence'}
                width={1200}
                height={800}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            ) : files[selectedIndex].type === 'video' ? (
              <video
                src={files[selectedIndex].url}
                controls
                className="max-w-full max-h-[90vh] rounded-lg"
              />
            ) : (
              <iframe
                src={files[selectedIndex].url}
                className="w-full h-[90vh] rounded-lg"
                title={files[selectedIndex].name || 'Evidence'}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

