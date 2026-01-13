'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MusicNoteIcon, PlayIcon } from './Icons';
import type { DbTrack } from '@/lib/supabase/types';

interface TrackCardProps {
  track: DbTrack;
  onPlay?: () => void;
  isPlaying?: boolean;
}

export function TrackCard({ track, onPlay, isPlaying }: TrackCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Link
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
        
        {/* Hover overlay with play button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPlay?.();
            }}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isPlaying 
                ? 'bg-white text-black' 
                : 'bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white'
            }`}
          >
            <PlayIcon className="w-6 h-6 ml-0.5" />
          </button>
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
  );
}
