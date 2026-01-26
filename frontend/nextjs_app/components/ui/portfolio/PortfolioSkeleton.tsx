/**
 * Portfolio Skeleton Loaders
 * Loading states for async operations
 */

import { Card } from '@/components/ui/Card';

export function PortfolioItemSkeleton() {
  return (
    <Card className="border-slate-800/50 animate-pulse">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-3">
            <div className="h-6 w-20 bg-slate-700 rounded" />
            <div className="h-6 w-16 bg-slate-700 rounded" />
          </div>
          <div className="h-4 w-24 bg-slate-700 rounded" />
        </div>
        <div className="h-6 w-3/4 bg-slate-700 rounded mb-2" />
        <div className="h-4 w-full bg-slate-700 rounded mb-4" />
        <div className="flex gap-2 mb-4">
          <div className="h-5 w-16 bg-slate-700 rounded" />
          <div className="h-5 w-20 bg-slate-700 rounded" />
          <div className="h-5 w-14 bg-slate-700 rounded" />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="aspect-square bg-slate-700 rounded" />
          <div className="aspect-square bg-slate-700 rounded" />
          <div className="aspect-square bg-slate-700 rounded" />
        </div>
        <div className="h-12 bg-slate-700 rounded" />
      </div>
    </Card>
  );
}

export function PortfolioDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 lg:p-12">
      {/* Hero Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <Card className="lg:col-span-2 border-indigo-500/50 animate-pulse">
          <div className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-slate-700 rounded" />
              <div>
                <div className="h-8 w-32 bg-slate-700 rounded mb-2" />
                <div className="h-4 w-48 bg-slate-700 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-8">
              <div className="h-16 bg-slate-700 rounded" />
              <div className="h-16 bg-slate-700 rounded" />
              <div className="h-16 bg-slate-700 rounded" />
            </div>
          </div>
        </Card>
        <Card className="border-indigo-500/50 animate-pulse">
          <div className="p-6">
            <div className="h-4 w-32 bg-slate-700 rounded mb-4" />
            <div className="h-16 w-16 bg-slate-700 rounded mx-auto mb-4" />
            <div className="space-y-3">
              <div className="h-4 bg-slate-700 rounded" />
              <div className="h-4 bg-slate-700 rounded" />
              <div className="h-4 bg-slate-700 rounded" />
            </div>
          </div>
        </Card>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <PortfolioItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function MarketplaceProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 animate-pulse">
      <div className="bg-gradient-to-r from-indigo-900/50 to-emerald-900/50 border-b border-indigo-500/30">
        <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
          <div className="text-center">
            <div className="w-32 h-32 bg-slate-700 rounded-full mx-auto mb-6" />
            <div className="h-10 w-64 bg-slate-700 rounded mx-auto mb-4" />
            <div className="h-6 w-96 bg-slate-700 rounded mx-auto mb-6" />
            <div className="flex gap-4 justify-center mb-8">
              <div className="h-8 w-24 bg-slate-700 rounded" />
              <div className="h-8 w-32 bg-slate-700 rounded" />
            </div>
            <div className="h-12 w-48 bg-slate-700 rounded mx-auto" />
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <PortfolioItemSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

