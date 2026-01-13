'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { MusicNoteIcon, PlayIcon } from '@/components/Icons';
import { useDiscoverCache } from '@/lib/DiscoverCache';
import type { DbTrack } from '@/lib/supabase/types';

// Skeleton components for inline loading states
function TrackSkeleton() {
  return (
    <div className="flex-shrink-0 w-[200px] sm:w-[240px] md:w-[280px] animate-pulse">
      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-[var(--base-fill-1)] mb-3" />
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
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--base-fill-1)] mb-3" />
      <div className="space-y-2">
        <div className="h-4 bg-[var(--base-fill-1)] rounded-md w-3/4" />
        <div className="h-3 bg-[var(--base-fill-1)] rounded-md w-1/2" />
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const router = useRouter();
  const { data, isLoading, isRefreshing, fetchData } = useDiscoverCache();

  // Fetch data on mount (will use cache if available and valid)
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show skeleton only on first load (no cached data)
  const showSkeleton = isLoading && !data;

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
          <button onClick={() => router.push('/')} className="hover:opacity-80 transition-opacity">
            <Logo />
          </button>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <Link 
              href="/discover" 
              className="text-white font-medium text-sm sm:text-base"
            >
              Discover
            </Link>
            <Link 
              href="/" 
              className="text-[var(--text-dark-secondary)] hover:text-white transition-colors text-sm sm:text-base"
            >
              Create
            </Link>
            
            {/* Avatar */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[var(--base-border)] bg-gradient-to-br from-orange-400 to-red-500 overflow-hidden flex-shrink-0">
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                A
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 pt-6 sm:pt-10 pb-12">
        {/* Page Title */}
        <div className="px-4 sm:px-6 md:px-8 lg:px-[216px] mb-8 sm:mb-10">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Discover
            </h1>
            {/* Subtle refresh indicator */}
            {isRefreshing && (
              <div className="w-4 h-4 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          <p className="text-[var(--text-dark-secondary)] mt-2">
            Explore AI-generated music from the community
          </p>
        </div>

        {showSkeleton ? (
          <>
            {/* Skeleton for New Songs */}
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

            {/* Skeleton for Featured Playlists */}
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
          </>
        ) : (
          <>
            {/* New Songs Section */}
            {data && data.recentTracks.length > 0 && (
              <section className="mb-10 sm:mb-14">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 px-4 sm:px-6 md:px-8 lg:px-[216px]">
                  New Songs
                </h2>
                <div 
                  className="flex gap-4 overflow-x-auto pb-4 px-4 sm:px-6 md:px-8 lg:px-[216px] scrollbar-hide"
                >
                  {data.recentTracks.map((track) => (
                    <Link
                      key={track.id}
                      href={`/t/${track.id}`}
                      className="group flex-shrink-0 w-[200px] sm:w-[240px] md:w-[280px]"
                    >
                      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-[var(--base-fill-1)] mb-3">
                        {track.image_url ? (
                          <Image
                            src={track.image_url}
                            alt={track.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            unoptimized={track.image_url.startsWith('data:')}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600/30 to-blue-600/30">
                            <MusicNoteIcon className="w-12 h-12 text-white/20" />
                          </div>
                        )}
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <PlayIcon className="w-6 h-6 text-white ml-0.5" />
                          </div>
                        </div>
                        
                        {/* Duration badge */}
                        <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/60 text-white text-xs font-medium">
                          {formatDuration(track.duration)}
                        </div>
                      </div>
                      
                      <div className="px-1">
                        <h3 className="font-semibold text-white truncate group-hover:text-[var(--accent-blue)] transition-colors">
                          {track.title}
                        </h3>
                        <p className="text-sm text-[var(--text-dark-secondary)] truncate">
                          {track.genre && track.mood 
                            ? `${track.genre} • ${track.mood}`
                            : track.genre || track.mood || 'AI Generated'
                          }
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Featured Playlists Section */}
            {data && data.featuredPlaylists.length > 0 && (
              <section>
                <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 px-4 sm:px-6 md:px-8 lg:px-[216px]">
                  Featured playlists
                </h2>
                <div className="px-4 sm:px-6 md:px-8 lg:px-[216px]">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6 sm:gap-x-5 sm:gap-y-8">
                    {data.featuredPlaylists.map((playlist) => {
                      const readyTracks = playlist.tracks.filter(
                        (t: DbTrack) => t.status === 'ready' && t.audio_url
                      );
                      const trackCount = readyTracks.length;
                      
                      return (
                        <Link
                          key={playlist.id}
                          href={`/p/${playlist.id}`}
                          className="group block"
                        >
                          <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--base-fill-1)] mb-3">
                            {playlist.cover_image_url ? (
                              <Image
                                src={playlist.cover_image_url}
                                alt={playlist.name}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                unoptimized={playlist.cover_image_url.startsWith('data:')}
                              />
                            ) : readyTracks[0]?.image_url ? (
                              <Image
                                src={readyTracks[0].image_url}
                                alt={playlist.name}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                unoptimized={readyTracks[0].image_url.startsWith('data:')}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600/30 to-blue-600/30">
                                <MusicNoteIcon className="w-12 h-12 text-white/20" />
                              </div>
                            )}
                            
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <PlayIcon className="w-5 h-5 text-white ml-0.5" />
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="font-semibold text-white truncate group-hover:text-[var(--accent-blue)] transition-colors text-sm">
                              {playlist.name}
                            </h3>
                            <p className="text-xs text-[var(--text-dark-secondary)]">
                              {trackCount} {trackCount === 1 ? 'song' : 'songs'}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Empty state */}
            {data && data.recentTracks.length === 0 && data.featuredPlaylists.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="w-20 h-20 rounded-full bg-[var(--base-fill-1)] flex items-center justify-center mb-6">
                  <MusicNoteIcon className="w-10 h-10 text-[var(--text-dark-secondary)]" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">No music yet</h2>
                <p className="text-[var(--text-dark-secondary)] text-center mb-6 max-w-md">
                  Be the first to create AI-generated music! Head over to the create page to get started.
                </p>
                <Link
                  href="/"
                  className="px-6 py-3 bg-[var(--accent-blue)] text-white rounded-full hover:opacity-90 transition-opacity font-medium"
                >
                  Create Music
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
