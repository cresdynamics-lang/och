'use client';

import { useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function TrackDetailPage() {
  const params = useParams();
  const trackSlug = params.track as string;

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/curriculum" className="text-slate-400 hover:text-white mb-4 inline-flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" />
          Back to Curriculum
        </Link>
        <h1 className="text-3xl font-bold text-white mb-4">{trackSlug.charAt(0).toUpperCase() + trackSlug.slice(1)} Track</h1>
        <p className="text-slate-300 mb-8">Track details will be implemented here with full curriculum structure.</p>
        <Link href={`/curriculum/learn/${trackSlug}`}>
          <Button>Start Learning</Button>
        </Link>
      </div>
    </div>
  );
}