'use client';

import { useState, useRef, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Track, Playlist } from '@/types';
import { Logo } from '@/components/Logo';
import { PlaylistPlayer } from '@/components/PlaylistPlayer';
import {
  PlayIcon,
  PauseIcon,
  MusicNoteIcon,
  ShareIcon,
  HomeIcon,
} from '@/components/Icons';
import type { DbPlaylistWithTracks, DbTrack } from '@/lib/supabase/types';

interface PlaylistPageProps {
  params: Promise<{ id: string }>;
}

// Convert database playlist to app playlist format
function dbToPlaylist(db: DbPlaylistWithTracks): Playlist {
  return {
    id: db.id,
    name: db.name,
    description: db.description || undefined,
    prompt: db.prompt,
    genre: db.genre || undefined,
    mood: db.mood || undefined,
    coverImageUrl: db.cover_image_url || undefined,
    status: db.status,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
    tracks: db.tracks.map((t: DbTrack) => ({
      id: t.id,
      title: t.title,
      artist: t.artist || undefined,
      prompt: t.prompt,
      genre: t.genre || undefined,
      mood: t.mood || undefined,
      duration: t.duration,
      audioUrl: t.audio_url || undefined,
      imageUrl: t.image_url || undefined,
      status: t.status,
      error: t.error || undefined,
      createdAt: new Date(t.created_at),
    })),
  };
}

export default function PlaylistPage({ params }: PlaylistPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch playlist on mount
  useEffect(() => {
    async function fetchPlaylist() {
      try {
        const res = await fetch(`/api/playlists/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Playlist not found');
          } else {
            setError('Failed to load playlist');
          }
          return;
        }
        const data = await res.json();
        setPlaylist(dbToPlaylist(data.playlist));
      } catch (err) {
        console.error('Error fetching playlist:', err);
        setError('Failed to load playlist');
      } finally {
        setLoading(false);
      }
    }
    fetchPlaylist();
  }, [id]);

  const readyTracks = playlist?.tracks.filter(t => t.status === 'ready' && t.audioUrl) || [];
  const currentTrack = currentTrackIndex !== null ? readyTracks[currentTrackIndex] : null;

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && currentTrack?.audioUrl) {
      audio.src = currentTrack.audioUrl;
      if (isPlaying) {
        const playWhenReady = () => {
          audio.play().catch(() => {});
        };
        audio.addEventListener('canplay', playWhenReady, { once: true });
        return () => audio.removeEventListener('canplay', playWhenReady);
      }
    }
  }, [currentTrackIndex, currentTrack?.audioUrl, isPlaying]);

  const handlePlayTrack = (index: number) => {
    if (currentTrackIndex === index && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else if (currentTrackIndex === index && !isPlaying) {
      audioRef.current?.play().catch(() => {});
      setIsPlaying(true);
    } else {
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
      audioRef.current?.play().catch(() => {});
    }
  };

  const handleEnded = () => {
    if (currentTrackIndex !== null && currentTrackIndex < readyTracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--base-surface-1)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-dark-secondary)]">Loading playlist...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !playlist) {
    return (
      <div className="min-h-screen bg-[var(--base-surface-1)] flex flex-col">
        {/* Background glow */}
        <div 
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255, 100, 100, 0.4) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        
        <header className="relative z-10 w-full px-4 sm:px-6 md:px-8 py-4 sm:py-5">
          <Logo />
        </header>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <MusicNoteIcon className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-semibold text-white mb-2">
              {error || 'Playlist not found'}
            </h1>
            <p className="text-[var(--text-dark-secondary)] mb-8">
              This playlist may have been deleted or the link is invalid.
            </p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-blue)] text-white rounded-full hover:opacity-90 transition-opacity"
            >
              <HomeIcon className="w-5 h-5" />
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--base-surface-1)] flex flex-col relative overflow-hidden">
      {/* Background gradient effects */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(138, 43, 226, 0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, rgba(80, 161, 255, 0.12) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(199, 125, 255, 0.08) 0%, transparent 50%)',
        }}
      />

      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
      />

      {/* Header */}
      <header className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-[216px]">
        <nav className="flex items-center justify-between py-4 sm:py-5">
          <button onClick={() => router.push('/')} className="hover:opacity-80 transition-opacity">
            <Logo />
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--base-border)] text-[var(--text-dark-secondary)] hover:text-white hover:border-white/30 transition-all text-sm"
            >
              <ShareIcon className="w-4 h-4" />
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center pt-6 sm:pt-10 px-4 sm:px-6 md:px-8 pb-32">
        {/* Cover Image */}
        <div className="relative w-56 sm:w-64 md:w-72 aspect-square mb-6">
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
                <MusicNoteIcon className="w-24 h-24 text-white/20" />
              </div>
            )}
          </div>
          
          {/* Play Button Overlay */}
          {readyTracks.length > 0 && (
            <button
              onClick={handlePlaylistPlay}
              className="absolute bottom-4 right-4 w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all hover:scale-105 shadow-lg"
            >
              {isPlaying ? (
                <PauseIcon className="w-7 h-7 text-white" />
              ) : (
                <PlayIcon className="w-7 h-7 text-white ml-0.5" />
              )}
            </button>
          )}
        </div>

        {/* Playlist Info */}
        <div className="text-center mb-8 max-w-md">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p className="text-[var(--text-dark-secondary)] mb-2">
              {playlist.description}
            </p>
          )}
          <p className="text-sm text-[var(--text-dark-secondary)]">
            {readyTracks.length} {readyTracks.length === 1 ? 'track' : 'tracks'}
            {playlist.genre && ` • ${playlist.genre}`}
            {playlist.mood && ` • ${playlist.mood}`}
          </p>
        </div>

        {/* Track List */}
        <div className="w-full max-w-lg space-y-2">
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
      </main>

      {/* Bottom Player */}
      {readyTracks.length > 0 && currentTrackIndex !== null && (
        <PlaylistPlayer playlist={playlist} />
      )}
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
      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
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

