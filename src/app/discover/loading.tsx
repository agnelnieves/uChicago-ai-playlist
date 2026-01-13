import { Logo } from '@/components/Logo';

// Skeleton components
function TrackSkeleton() {
  return (
    <div className="flex-shrink-0 w-[200px] sm:w-[240px] md:w-[280px] animate-pulse">
      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-[var(--base-fill-1)] mb-3">
        <div className="absolute inset-0 skeleton-shimmer" />
      </div>
      <div className="px-1 space-y-2">
        <div className="h-5 bg-[var(--base-fill-1)] rounded-md w-3/4" />
        <div className="h-4 bg-[var(--base-fill-1)] rounded-md w-1/2" />
      </div>
    </div>
  );
}

function PlaylistSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--base-fill-1)] mb-3">
        <div className="absolute inset-0 skeleton-shimmer" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-[var(--base-fill-1)] rounded-md w-3/4" />
        <div className="h-3 bg-[var(--base-fill-1)] rounded-md w-1/2" />
      </div>
    </div>
  );
}

export default function DiscoverLoading() {
  return (
    <div className="min-h-screen bg-[var(--base-surface-1)] flex flex-col relative overflow-hidden">
      {/* Background glow */}
      <div 
        className="absolute top-[-200px] sm:top-[-300px] md:top-[-375px] left-1/2 -translate-x-1/2 w-[500px] sm:w-[800px] md:w-[1058px] h-[300px] sm:h-[400px] md:h-[506px] opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(80, 161, 255, 0.4) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-[216px]">
        <nav className="flex items-center justify-between py-4 sm:py-5">
          <Logo />
          
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="text-white font-medium text-sm sm:text-base">
              Discover
            </span>
            <span className="text-[var(--text-dark-secondary)] text-sm sm:text-base">
              Create
            </span>
            
            {/* Avatar skeleton */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[var(--base-border)] bg-[var(--base-fill-1)] flex-shrink-0" />
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 pt-6 sm:pt-10 pb-12">
        {/* Page Title */}
        <div className="px-4 sm:px-6 md:px-8 lg:px-[216px] mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            Discover
          </h1>
          <p className="text-[var(--text-dark-secondary)] mt-2">
            Explore AI-generated music from the community
          </p>
        </div>

        {/* New Songs Section Skeleton */}
        <section className="mb-10 sm:mb-14">
          <div className="px-4 sm:px-6 md:px-8 lg:px-[216px] mb-4 sm:mb-6">
            <div className="h-6 bg-[var(--base-fill-1)] rounded-md w-32 animate-pulse" />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 px-4 sm:px-6 md:px-8 lg:px-[216px] scrollbar-hide">
            {[...Array(5)].map((_, i) => (
              <TrackSkeleton key={i} />
            ))}
          </div>
        </section>

        {/* Featured Playlists Section Skeleton */}
        <section>
          <div className="px-4 sm:px-6 md:px-8 lg:px-[216px] mb-4 sm:mb-6">
            <div className="h-6 bg-[var(--base-fill-1)] rounded-md w-40 animate-pulse" />
          </div>
          <div className="px-4 sm:px-6 md:px-8 lg:px-[216px]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6 sm:gap-x-5 sm:gap-y-8">
              {[...Array(6)].map((_, i) => (
                <PlaylistSkeleton key={i} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
