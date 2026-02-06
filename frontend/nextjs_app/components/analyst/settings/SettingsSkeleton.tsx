'use client';

export const SettingsSkeleton = () => {
  return (
    <div className="min-h-screen bg-och-midnight-black text-white">
      {/* Header Skeleton */}
      <header className="border-b border-och-steel-grey/30 bg-och-midnight-black/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="h-8 bg-och-steel-grey/30 rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-och-steel-grey/20 rounded w-64 mt-2 animate-pulse"></div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar Skeleton */}
          <aside className="hidden lg:block">
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-och-steel-grey/20 rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
          </aside>

          {/* Content Skeleton */}
          <main className="flex-1">
            <div className="bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg p-6">
              <div className="space-y-6">
                <div className="h-8 bg-och-steel-grey/30 rounded w-1/3 animate-pulse"></div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3">
                    <div className="h-6 bg-och-steel-grey/20 rounded w-1/4 animate-pulse"></div>
                    <div className="h-12 bg-och-steel-grey/20 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

