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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[var(--base-surface-2)] border border-[var(--base-border)] rounded-2xl p-8 max-w-md w-full mx-4 animate-slide-up">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-[var(--accent-blue)]/20 flex items-center justify-center animate-pulse-glow">
            <MusicNoteIcon className="w-6 h-6 text-[var(--accent-blue)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Creating your playlist
            </h3>
            <p className="text-sm text-[var(--text-dark-secondary)]">
              This may take a few minutes
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--text-dark-secondary)]">Progress</span>
            <span className="text-white">{completedTracks}/{totalTracks} tracks</span>
          </div>
          <div className="h-2 bg-[var(--base-fill-1)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent-blue)] rounded-full transition-all duration-500"
              style={{ width: `${(completedTracks / totalTracks) * 100}%` }}
            />
          </div>
        </div>

        {/* Track List */}
        <div className="space-y-2">
          {playlist.tracks.map((track, index) => (
            <TrackStatus key={track.id} track={track} index={index} />
          ))}
        </div>

        {/* Current track info */}
        {currentTrack && (
          <div className="mt-6 pt-4 border-t border-[var(--base-border)]">
            <p className="text-sm text-[var(--text-dark-tertiary)]">
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
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-[var(--base-fill-1)]/50">
      <div className="w-6 h-6 flex items-center justify-center">
        {track.status === 'generating' ? (
          <LoadingSpinner className="w-5 h-5 text-[var(--accent-blue)]" />
        ) : track.status === 'ready' ? (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : track.status === 'error' ? (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-[var(--base-border)]" />
        )}
      </div>
      <span
        className={`text-sm ${
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
        <span className="text-xs text-red-400 truncate ml-auto">
          {track.error}
        </span>
      )}
    </div>
  );
}

