'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MusicNoteIcon, PlayIcon } from './Icons';
import type { DbPlaylistWithTracks, DbTrack } from '@/lib/supabase/types';

interface PlaylistCardProps {
  playlist: DbPlaylistWithTracks;
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  const readyTracks = playlist.tracks.filter(
    (t: DbTrack) => t.status === 'ready' && t.audio_url
  );
  const trackCount = readyTracks.length;

  return (
    <Link
      href={`/p/${playlist.id}`}
      className="group flex-shrink-0 w-[160px] sm:w-[180px]"
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
          // Fallback to first track's image
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
        
        {/* Hover overlay with play button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
            <PlayIcon className="w-5 h-5 text-white ml-0.5" />
          </div>
        </div>
      </div>
      
      <div className="px-1">
        <h3 className="font-semibold text-white truncate group-hover:text-[var(--accent-blue)] transition-colors text-sm">
          {playlist.name}
        </h3>
        <p className="text-xs text-[var(--text-dark-secondary)]">
          {trackCount} {trackCount === 1 ? 'song' : 'songs'}
        </p>
      </div>
    </Link>
  );
}
