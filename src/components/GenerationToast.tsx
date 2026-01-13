'use client';

import { useRouter } from 'next/navigation';
import { useGenerationSafe } from '@/lib/GenerationContext';
import { LoadingSpinner, PlayIcon, CloseIcon, ChevronDownIcon } from './Icons';

export function GenerationToast() {
  const router = useRouter();
  const context = useGenerationSafe();
  
  // Don't render if no context or no generation
  if (!context || !context.generation || context.isDismissed) {
    return null;
  }

  const { 
    generation, 
    isExpanded, 
    setIsExpanded, 
    clearGeneration,
    dismissGeneration 
  } = context;
  
  const { playlist, status } = generation;
  const totalTracks = playlist.tracks.length;
  const completedTracks = playlist.tracks.filter(t => t.status === 'ready').length;
  const currentTrack = playlist.tracks.find(t => t.status === 'generating');
  const isSingleTrack = totalTracks === 1;
  const isCompleted = status === 'completed';
  const hasError = status === 'error';
  const progress = totalTracks > 0 ? (completedTracks / totalTracks) * 100 : 0;

  const handlePlayNow = () => {
    if (isSingleTrack && playlist.tracks[0]) {
      router.push(`/t/${playlist.tracks[0].id}`);
    } else {
      router.push(`/p/${playlist.id}`);
    }
    clearGeneration();
  };

  const handleViewPlaylist = () => {
    if (isSingleTrack && playlist.tracks[0]) {
      router.push(`/t/${playlist.tracks[0].id}`);
    } else {
      router.push(`/p/${playlist.id}`);
    }
    clearGeneration();
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleted || hasError) {
      clearGeneration();
    } else {
      dismissGeneration();
    }
  };

  // Collapsed toast view
  if (!isExpanded) {
    return (
      <div 
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-toast-slide-up"
        onClick={() => setIsExpanded(true)}
      >
        <div 
          className={`
            flex items-center gap-3 px-4 py-3 rounded-full
            bg-[var(--base-surface-2)] border border-[var(--base-border)]
            shadow-xl shadow-black/30 cursor-pointer
            hover:border-[var(--accent-blue)]/50 transition-all duration-200
            min-w-[280px] max-w-[90vw]
          `}
        >
          {/* Status Icon */}
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
            ${isCompleted 
              ? 'bg-green-500/20' 
              : hasError 
                ? 'bg-red-500/20'
                : 'bg-[var(--accent-blue)]/20 animate-pulse-glow'
            }
          `}>
            {isCompleted ? (
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : hasError ? (
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <LoadingSpinner className="w-5 h-5 text-[var(--accent-blue)]" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white truncate">
                {isCompleted 
                  ? (isSingleTrack ? 'Track ready!' : 'Playlist ready!')
                  : hasError
                    ? 'Generation failed'
                    : (isSingleTrack ? 'Creating track...' : `Creating playlist...`)
                }
              </span>
              {!isCompleted && !hasError && !isSingleTrack && (
                <span className="text-xs text-[var(--text-dark-secondary)] flex-shrink-0">
                  {completedTracks}/{totalTracks}
                </span>
              )}
            </div>
            
            {/* Progress bar for playlists */}
            {!isSingleTrack && !isCompleted && !hasError && (
              <div className="h-1 bg-[var(--base-fill-1)] rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-[var(--accent-blue)] rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isCompleted && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayNow();
                }}
                className="w-8 h-8 rounded-full bg-[var(--accent-blue)] flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <PlayIcon className="w-4 h-4 text-white ml-0.5" />
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <CloseIcon className="w-4 h-4 text-[var(--text-dark-secondary)]" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Expanded toast view
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-toast-slide-up">
      <div 
        className="
          bg-[var(--base-surface-2)] border border-[var(--base-border)]
          rounded-2xl shadow-xl shadow-black/30
          w-[340px] max-w-[90vw] overflow-hidden
        "
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => setIsExpanded(false)}
        >
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center
              ${isCompleted 
                ? 'bg-green-500/20' 
                : hasError 
                  ? 'bg-red-500/20'
                  : 'bg-[var(--accent-blue)]/20 animate-pulse-glow'
              }
            `}>
              {isCompleted ? (
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : hasError ? (
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <LoadingSpinner className="w-5 h-5 text-[var(--accent-blue)]" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {isCompleted 
                  ? (isSingleTrack ? 'Track ready!' : 'Playlist ready!')
                  : hasError
                    ? 'Generation failed'
                    : (isSingleTrack ? 'Creating your track' : 'Creating your playlist')
                }
              </h3>
              <p className="text-xs text-[var(--text-dark-secondary)]">
                {isCompleted
                  ? 'Your music is ready to play'
                  : hasError
                    ? 'Something went wrong'
                    : (isSingleTrack ? 'This may take a minute' : `${completedTracks}/${totalTracks} tracks completed`)
                }
              </p>
            </div>
          </div>
          <ChevronDownIcon className="w-5 h-5 text-[var(--text-dark-secondary)] rotate-180" />
        </div>

        {/* Progress section - only for playlists */}
        {!isSingleTrack && !isCompleted && !hasError && (
          <div className="px-4 pb-3">
            <div className="h-1.5 bg-[var(--base-fill-1)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent-blue)] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Track List - for playlists */}
        {!isSingleTrack && (
          <div className="px-4 pb-3 space-y-1.5 max-h-[200px] overflow-y-auto scrollbar-hide">
            {playlist.tracks.map((track, index) => (
              <TrackStatus key={track.id} track={track} index={index} />
            ))}
          </div>
        )}

        {/* Single track generating indicator */}
        {isSingleTrack && !isCompleted && !hasError && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-3 py-3 px-3 rounded-lg bg-[var(--base-fill-1)]/50">
              <LoadingSpinner className="w-5 h-5 text-[var(--accent-blue)]" />
              <span className="text-sm text-[var(--text-dark-secondary)]">
                Generating your track...
              </span>
            </div>
          </div>
        )}

        {/* Current track info - for playlists generating */}
        {!isSingleTrack && !isCompleted && !hasError && currentTrack && (
          <div className="px-4 pb-3 pt-1 border-t border-[var(--base-border)]">
            <p className="text-xs text-[var(--text-dark-tertiary)] truncate">
              Currently generating: {currentTrack.title}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="p-4 pt-2 border-t border-[var(--base-border)] flex gap-3">
          {isCompleted ? (
            <>
              <button
                onClick={handlePlayNow}
                className="flex-1 py-2.5 px-4 rounded-full bg-[var(--accent-blue)] text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <PlayIcon className="w-4 h-4" />
                Play Now
              </button>
              <button
                onClick={handleViewPlaylist}
                className="py-2.5 px-4 rounded-full border border-[var(--base-border)] text-[var(--text-dark-secondary)] text-sm font-medium hover:text-white hover:border-white/30 transition-colors"
              >
                View {isSingleTrack ? 'Track' : 'Playlist'}
              </button>
            </>
          ) : hasError ? (
            <button
              onClick={() => clearGeneration()}
              className="flex-1 py-2.5 px-4 rounded-full border border-[var(--base-border)] text-[var(--text-dark-secondary)] text-sm font-medium hover:text-white hover:border-white/30 transition-colors"
            >
              Dismiss
            </button>
          ) : (
            <button
              onClick={handleDismiss}
              className="flex-1 py-2.5 px-4 rounded-full border border-[var(--base-border)] text-[var(--text-dark-secondary)] text-sm font-medium hover:text-white hover:border-white/30 transition-colors"
            >
              Continue Browsing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface Track {
  id: string;
  title: string;
  status: 'pending' | 'generating' | 'ready' | 'error';
  error?: string;
}

function TrackStatus({ track, index }: { track: Track; index: number }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-[var(--base-fill-1)]/50">
      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
        {track.status === 'generating' ? (
          <LoadingSpinner className="w-4 h-4 text-[var(--accent-blue)]" />
        ) : track.status === 'ready' ? (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : track.status === 'error' ? (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <div className="w-4 h-4 rounded-full border-2 border-[var(--base-border)]" />
        )}
      </div>
      <span
        className={`text-xs ${
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
        <span className="text-[10px] text-red-400 truncate ml-auto max-w-[100px]">
          {track.error}
        </span>
      )}
    </div>
  );
}
