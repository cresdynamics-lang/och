'use client';

export const SettingsSkeleton = () => {
  return (
    <div className="min-h-screen bg-och-midnight-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="h-10 w-64 bg-och-steel-grey/20 rounded-lg animate-pulse mb-2" />
          <div className="h-5 w-96 bg-och-steel-grey/20 rounded-lg animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="hidden lg:block">
            <div className="bg-och-midnight border border-och-steel-grey/30 rounded-lg p-4 space-y-2">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="h-10 bg-och-steel-grey/20 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-och-midnight border border-och-steel-grey/30 rounded-lg p-6 space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="h-6 w-48 bg-och-steel-grey/20 rounded animate-pulse" />
                  <div className="h-20 bg-och-steel-grey/20 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

