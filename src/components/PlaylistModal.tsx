'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Track, Playlist } from '@/types';
import { PlayIcon, PauseIcon, CloseIcon, MusicNoteIcon } from './Icons';

interface PlaylistModalProps {
  playlist: Playlist;
  onClose: () => void;
}

export function PlaylistModal({ playlist, onClose }: PlaylistModalProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const readyTracks = playlist.tracks.filter(t => t.status === 'ready' && t.audioUrl);
  const currentTrack = currentTrackIndex !== null ? readyTracks[currentTrackIndex] : null;

  useEffect(() => {
    if (audioRef.current && currentTrack?.audioUrl) {
      audioRef.current.src = currentTrack.audioUrl;
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentTrackIndex, currentTrack?.audioUrl, isPlaying]);

  const handlePlayTrack = (index: number) => {
    if (currentTrackIndex === index && isPlaying) {
      // Pause if clicking the same track that's playing
      audioRef.current?.pause();
      setIsPlaying(false);
    } else if (currentTrackIndex === index && !isPlaying) {
      // Resume if clicking the same track that's paused
      audioRef.current?.play();
      setIsPlaying(true);
    } else {
      // Play new track
      setCurrentTrackIndex(index);
      setIsPlaying(true);
    }
  };

  const handlePlaylistPlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (currentTrackIndex === null && readyTracks.length > 0) {
        setCurrentTrackIndex(0);
      }
      setIsPlaying(true);
      audioRef.current?.play();
    }
  };

  const handleEnded = () => {
    if (currentTrackIndex !== null && currentTrackIndex < readyTracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    } else {
      setIsPlaying(false);
    }
  };

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Gradient background effects */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(138, 43, 226, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, rgba(80, 161, 255, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(199, 125, 255, 0.1) 0%, transparent 50%)',
        }}
      />

      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-0 right-0 p-2 text-white/60 hover:text-white transition-colors z-20"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-white/70 text-lg">Here&apos;s your playlist</p>
        </div>

        {/* Cover Image */}
        <div className="relative mx-auto w-48 sm:w-56 md:w-64 aspect-square mb-6">
          <div className="w-full h-full rounded-2xl overflow-hidden bg-[var(--base-fill-1)] shadow-2xl">
            {playlist.coverImageUrl ? (
              <Image
                src={playlist.coverImageUrl}
                alt={playlist.name}
                fill
                className="object-cover"
                unoptimized={playlist.coverImageUrl.startsWith('data:')}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600/30 to-blue-600/30">
                <MusicNoteIcon className="w-20 h-20 text-white/30" />
              </div>
            )}
          </div>
          
          {/* Play Button Overlay */}
          {readyTracks.length > 0 && (
            <button
              onClick={handlePlaylistPlay}
              className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all hover:scale-105 shadow-lg"
            >
              {isPlaying ? (
                <PauseIcon className="w-6 h-6 text-white" />
              ) : (
                <PlayIcon className="w-6 h-6 text-white ml-0.5" />
              )}
            </button>
          )}
        </div>

        {/* Playlist Title */}
        <h2 className="text-center text-2xl font-semibold text-white mb-8">
          {playlist.name}
        </h2>

        {/* Track List */}
        <div className="space-y-2">
          {readyTracks.map((track, index) => (
            <TrackItem
              key={track.id}
              track={track}
              isPlaying={currentTrackIndex === index && isPlaying}
              onPlay={() => handlePlayTrack(index)}
            />
          ))}
          
          {/* Show pending/generating tracks too but disabled */}
          {playlist.tracks
            .filter(t => t.status !== 'ready' || !t.audioUrl)
            .map((track) => (
              <TrackItem
                key={track.id}
                track={track}
                isPlaying={false}
                disabled
              />
            ))}
        </div>
      </div>
    </div>
  );
}

interface TrackItemProps {
  track: Track;
  isPlaying: boolean;
  onPlay?: () => void;
  disabled?: boolean;
}

function TrackItem({ track, isPlaying, onPlay, disabled }: TrackItemProps) {
  return (
    <div 
      className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
        disabled 
          ? 'opacity-40 cursor-not-allowed' 
          : 'hover:bg-white/5 cursor-pointer'
      } ${isPlaying ? 'bg-white/10' : ''}`}
      onClick={disabled ? undefined : onPlay}
    >
      {/* Track Thumbnail */}
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-[var(--base-fill-1)] flex-shrink-0 relative">
        {track.imageUrl ? (
          <Image
            src={track.imageUrl}
            alt={track.title}
            fill
            className="object-cover"
            unoptimized={track.imageUrl.startsWith('data:')}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600/20 to-blue-600/20">
            <MusicNoteIcon className="w-6 h-6 text-white/30" />
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-white truncate">
          {track.title}
        </h4>
        <p className="text-sm text-white/50 truncate">
          {track.artist || 'AI Generated'}
        </p>
      </div>

      {/* Play Button */}
      {!disabled && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay?.();
          }}
          className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:border-white/40 transition-colors flex-shrink-0"
        >
          {isPlaying ? (
            <PauseIcon className="w-4 h-4 text-white/70" />
          ) : (
            <PlayIcon className="w-4 h-4 text-white/70 ml-0.5" />
          )}
        </button>
      )}

      {/* Loading indicator for generating tracks */}
      {disabled && track.status === 'generating' && (
        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
