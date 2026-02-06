'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { ResumeGenerateResponse } from '@/types/analyst-career';

interface AutoResumeGeneratorProps {
  userId: string;
  readinessBadge: 'ready' | 'almost' | 'building';
  resumeUrl: string | null;
  resumeExpiry: string | null;
  onGenerate?: () => void;
}

export const AutoResumeGenerator = ({
  userId,
  readinessBadge,
  resumeUrl,
  resumeExpiry,
  onGenerate,
}: AutoResumeGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const isExpired = resumeExpiry ? new Date(resumeExpiry) < new Date() : false;
  const daysUntilExpiry = resumeExpiry
    ? Math.ceil((new Date(resumeExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/analyst/${userId}/resume/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includePortfolio: true }),
      });

      const data: ResumeGenerateResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error('Failed to generate resume');
      }

      // Download the resume
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }

      onGenerate?.();
    } catch (error: any) {
      alert(`❌ Failed to generate resume: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (resumeUrl) {
      window.open(resumeUrl, '_blank');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-white/80 uppercase tracking-wider font-medium">
          AUTO-RESUME
        </div>
        {readinessBadge === 'ready' && (
          <Badge className="bg-och-cyber-mint text-black text-xs">
            Ready for MTN HR
          </Badge>
        )}
        {readinessBadge === 'almost' && (
          <Badge className="bg-och-sahara-gold text-black text-xs">
            Almost Ready
          </Badge>
        )}
        {readinessBadge === 'building' && (
          <Badge className="bg-och-steel-grey text-white text-xs">
            Building
          </Badge>
        )}
      </div>

      {resumeUrl && !isExpired ? (
        <div className="p-3 bg-och-cyber-mint/10 border border-och-cyber-mint/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-och-cyber-mint" />
              <span className="text-sm text-och-cyber-mint">Resume Generated</span>
            </div>
            <span className="text-xs text-white/70">
              {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''} left
            </span>
          </div>
          <Button
            className="w-full bg-och-cyber-mint hover:bg-och-cyber-mint/90 text-black h-9 text-xs"
            onClick={handleDownload}
          >
            <Download className="w-3 h-3 mr-2" />
            Download Resume PDF
          </Button>
        </div>
      ) : (
        <div className="p-3 bg-och-steel-grey/20 border border-och-steel-grey/30 rounded-lg">
          {isExpired && (
            <div className="flex items-center gap-2 mb-2 text-xs text-och-signal-orange">
              <AlertTriangle className="w-3 h-3" />
              Resume expired. Generate a new one.
            </div>
          )}
          <Button
            className="w-full bg-gradient-to-r from-och-defender-blue to-och-cyber-mint hover:from-och-defender-blue/90 hover:to-och-cyber-mint/90 text-white font-medium h-9 text-xs"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              'Generating...'
            ) : (
              <>
                <Download className="w-3 h-3 mr-2" />
                GENERATE RESUME PDF
              </>
            )}
          </Button>
          <div className="text-xs text-white/70 mt-2 text-center">
            7-day expiry • Auto-includes portfolio
          </div>
        </div>
      )}
    </div>
  );
};

