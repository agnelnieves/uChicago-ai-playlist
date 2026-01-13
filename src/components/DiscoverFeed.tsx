'use client';

import { useState, useEffect, useRef } from 'react';
import { TrackCard } from './TrackCard';
import { PlaylistCard } from './PlaylistCard';
import type { DbTrack, DbPlaylistWithTracks } from '@/lib/supabase/types';

interface DiscoverData {
  recentTracks: DbTrack[];
  featuredPlaylists: DbPlaylistWithTracks[];
}

export function DiscoverFeed() {
  const [data, setData] = useState<DiscoverData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tracksRef = useRef<HTMLDivElement>(null);
  const playlistsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchDiscoverData() {
      try {
        const res = await fetch('/api/discover');
        if (!res.ok) {
          throw new Error('Failed to fetch');
        }
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching discover data:', err);
        setError('Failed to load discover feed');
      } finally {
        setLoading(false);
      }
    }
    fetchDiscoverData();
  }, []);

  // Check if there's any content to show
  const hasContent = data && (data.recentTracks.length > 0 || data.featuredPlaylists.length > 0);

  if (loading) {
    return (
      <div className="w-full py-12">
        <div className="flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
          <span className="text-[var(--text-dark-secondary)]">Loading discover feed...</span>
        </div>
      </div>
    );
  }

  if (error || !hasContent) {
    // Silently return nothing if no content - don't show error
    return null;
  }

  return (
    <div className="w-full py-8 sm:py-12">
      {/* New Songs Section */}
      {data.recentTracks.length > 0 && (
        <section className="mb-10 sm:mb-14">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 px-4 sm:px-6 md:px-8 lg:px-[216px]">
            New Songs
          </h2>
          <div 
            ref={tracksRef}
            className="flex gap-4 overflow-x-auto pb-4 px-4 sm:px-6 md:px-8 lg:px-[216px] scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {data.recentTracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Playlists Section */}
      {data.featuredPlaylists.length > 0 && (
        <section>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 px-4 sm:px-6 md:px-8 lg:px-[216px]">
            Featured playlists
          </h2>
          <div 
            ref={playlistsRef}
            className="px-4 sm:px-6 md:px-8 lg:px-[216px]"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
              {data.featuredPlaylists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
