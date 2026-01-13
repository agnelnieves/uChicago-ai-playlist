'use client';

import { Playlist, Track } from '@/types';
import { LoadingSpinner, MusicNoteIcon } from './Icons';

interface GeneratingOverlayProps {
  playlist: Playlist;
}

export function GeneratingOverlay({ playlist }: GeneratingOverlayProps) {
  const totalTracks = playlist.tracks.length;
  const completedTracks = playlist.tracks.filter(t => t.status === 'ready').length;
  const currentTrack = playlist.tracks.find(t => t.status === 'generating');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--base-surface-2)] border border-[var(--base-border)] rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 max-w-md w-full animate-slide-up">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--accent-blue)]/20 flex items-center justify-center animate-pulse-glow flex-shrink-0">
            <MusicNoteIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent-blue)]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-white">
              Creating your playlist
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-dark-secondary)]">
              This may take a few minutes
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4 sm:mb-6">
          <div className="flex justify-between text-xs sm:text-sm mb-2">
            <span className="text-[var(--text-dark-secondary)]">Progress</span>
            <span className="text-white">{completedTracks}/{totalTracks} tracks</span>
          </div>
          <div className="h-1.5 sm:h-2 bg-[var(--base-fill-1)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent-blue)] rounded-full transition-all duration-500"
              style={{ width: `${(completedTracks / totalTracks) * 100}%` }}
            />
          </div>
        </div>

        {/* Track List */}
        <div className="space-y-1.5 sm:space-y-2">
          {playlist.tracks.map((track, index) => (
            <TrackStatus key={track.id} track={track} index={index} />
          ))}
        </div>

        {/* Current track info */}
        {currentTrack && (
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-[var(--base-border)]">
            <p className="text-xs sm:text-sm text-[var(--text-dark-tertiary)] truncate">
              Currently generating: {currentTrack.title}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TrackStatus({ track, index }: { track: Track; index: number }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-lg bg-[var(--base-fill-1)]/50">
      <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center flex-shrink-0">
        {track.status === 'generating' ? (
          <LoadingSpinner className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-blue)]" />
        ) : track.status === 'ready' ? (
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : track.status === 'error' ? (
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-[var(--base-border)]" />
        )}
      </div>
      <span
        className={`text-xs sm:text-sm ${
          track.status === 'ready'
            ? 'text-white'
            : track.status === 'generating'
            ? 'text-[var(--accent-blue)]'
            : track.status === 'error'
            ? 'text-red-500'
            : 'text-[var(--text-dark-tertiary)]'
        }`}
      >
        Track {index + 1}
      </span>
      {track.status === 'error' && track.error && (
        <span className="text-[10px] sm:text-xs text-red-400 truncate ml-auto max-w-[120px] sm:max-w-none">
          {track.error}
        </span>
      )}
    </div>
  );
}

