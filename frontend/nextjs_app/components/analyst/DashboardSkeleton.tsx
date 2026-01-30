interface DashboardSkeletonProps {
  variant?: 'full' | 'component';
}

export const DashboardSkeleton = ({ variant = 'component' }: DashboardSkeletonProps) => {
  if (variant === 'full') {
    return (
      <div className="analyst-workstation min-h-screen bg-och-midnight-black text-white grid grid-cols-[300px_1fr] grid-rows-[1fr_auto] gap-0 h-screen overflow-hidden">
        {/* SIDE PANEL - Loading Skeleton */}
        <aside className="sidebar bg-och-steel-grey col-span-1 row-span-2 overflow-y-auto sidebar-tabs p-4">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-12 bg-och-steel-grey/50 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </aside>

        {/* MAIN CONTENT - Loading Skeletons */}
        <main className="main col-span-1 p-6 grid grid-cols-2 gap-6 overflow-y-auto">
          {/* Left side - Priority tasks skeleton */}
          <div className="space-y-4">
            <div className="h-8 bg-och-steel-grey/50 rounded animate-pulse"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-och-steel-grey/30 p-6 rounded-2xl animate-pulse">
                <div className="flex justify-between items-start mb-3">
                  <div className="h-6 bg-och-steel-grey/50 rounded w-3/4"></div>
                  <div className="h-6 bg-och-signal-orange/30 rounded-full w-16"></div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-och-steel-grey/50 rounded w-1/2"></div>
                  <div className="h-4 bg-och-steel-grey/50 rounded w-2/3"></div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <div className="h-8 bg-och-defender-blue/50 rounded w-20"></div>
                  <div className="h-8 bg-och-steel-grey/50 rounded w-16"></div>
                  <div className="h-8 bg-och-steel-grey/50 rounded w-18"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Right side - Lab feed skeleton */}
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="h-8 bg-och-steel-grey/50 rounded animate-pulse w-48"></div>
              <div className="h-6 bg-och-steel-grey/50 rounded animate-pulse w-16"></div>
            </div>

            <div className="bg-och-steel-grey/30 p-4 rounded-xl">
              <div className="h-6 bg-och-steel-grey/50 rounded mb-4 animate-pulse"></div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-och-steel-grey/50 last:border-b-0">
                  <div className="space-y-1">
                    <div className="h-4 bg-och-steel-grey/50 rounded animate-pulse w-32"></div>
                    <div className="h-3 bg-och-steel-grey/50 rounded animate-pulse w-20"></div>
                  </div>
                  <div className="h-6 bg-och-signal-orange/30 rounded-full animate-pulse w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* PROGRESS SHELF - Loading Skeleton */}
        <footer className="progress-shelf bg-och-steel-grey/50 border-t border-och-defender-blue/20 p-4 grid grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center animate-pulse">
              <div className="h-8 bg-och-steel-grey/50 rounded mb-2 mx-auto w-16"></div>
              <div className="h-4 bg-och-steel-grey/30 rounded mx-auto w-20"></div>
            </div>
          ))}
        </footer>
      </div>
    );
  }

  // Component skeleton for individual components
  return (
    <div className="bg-och-steel-grey/30 p-6 rounded-2xl animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-6 bg-och-steel-grey/50 rounded w-3/4"></div>
        <div className="h-6 bg-och-signal-orange/30 rounded-full w-16"></div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-och-steel-grey/50 rounded w-1/2"></div>
        <div className="h-4 bg-och-steel-grey/50 rounded w-2/3"></div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <div className="h-8 bg-och-defender-blue/50 rounded w-20"></div>
        <div className="h-8 bg-och-steel-grey/50 rounded w-16"></div>
        <div className="h-8 bg-och-steel-grey/50 rounded w-18"></div>
      </div>
    </div>
  );
};
