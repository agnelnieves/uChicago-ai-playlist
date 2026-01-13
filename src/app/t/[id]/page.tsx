'use client';

import { useState, useRef, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Track } from '@/types';
import { Logo } from '@/components/Logo';
import {
  PlayIcon,
  PauseIcon,
  MusicNoteIcon,
  ShareIcon,
  HomeIcon,
  DownloadIcon,
} from '@/components/Icons';
import type { DbTrack } from '@/lib/supabase/types';

interface TrackPageProps {
  params: Promise<{ id: string }>;
}

// Convert database track to app track format
function dbToTrack(db: DbTrack): Track {
  return {
    id: db.id,
    title: db.title,
    artist: db.artist || undefined,
    prompt: db.prompt,
    genre: db.genre || undefined,
    mood: db.mood || undefined,
    duration: db.duration,
    audioUrl: db.audio_url || undefined,
    imageUrl: db.image_url || undefined,
    status: db.status,
    error: db.error || undefined,
    createdAt: new Date(db.created_at),
  };
}

export default function TrackPage({ params }: TrackPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch track on mount
  useEffect(() => {
    async function fetchTrack() {
      try {
        const res = await fetch(`/api/tracks/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Track not found');
          } else {
            setError('Failed to load track');
          }
          return;
        }
        const data = await res.json();
        setTrack(dbToTrack(data.track));
      } catch (err) {
        console.error('Error fetching track:', err);
        setError('Failed to load track');
      } finally {
        setLoading(false);
      }
    }
    fetchTrack();
  }, [id]);

  // Set up audio source when track loads
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && track?.audioUrl) {
      audio.src = track.audioUrl;
    }
  }, [track?.audioUrl]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setProgress(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setProgress(time);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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

  const handleDownload = async () => {
    if (!track?.audioUrl) return;

    try {
      const response = await fetch(track.audioUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${track.title}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--base-surface-1)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-dark-secondary)]">Loading track...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !track) {
    return (
      <div className="min-h-screen bg-[var(--base-surface-1)] flex flex-col">
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
              {error || 'Track not found'}
            </h1>
            <p className="text-[var(--text-dark-secondary)] mb-8">
              This track may have been deleted or the link is invalid.
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

  const isReady = track.status === 'ready' && track.audioUrl;

  return (
    <div className="min-h-screen bg-[var(--base-surface-1)] flex flex-col relative overflow-hidden">
      {/* Background gradient effects */}
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
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
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
              className="text-[var(--text-dark-secondary)] hover:text-white transition-colors text-sm sm:text-base"
            >
              Discover
            </Link>
            <Link 
              href="/" 
              className="text-[var(--text-dark-secondary)] hover:text-white transition-colors text-sm sm:text-base"
            >
              Create
            </Link>
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
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 pb-8">
        {/* Track Artwork */}
        <div className="relative w-64 sm:w-72 md:w-80 aspect-square mb-8">
          <div className="w-full h-full rounded-2xl overflow-hidden bg-[var(--base-fill-1)] shadow-2xl">
            {track.imageUrl ? (
              <Image
                src={track.imageUrl}
                alt={track.title}
                fill
                className="object-cover"
                unoptimized={track.imageUrl.startsWith('data:')}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600/30 to-blue-600/30">
                <MusicNoteIcon className="w-28 h-28 text-white/20" />
              </div>
            )}
          </div>
          
          {/* Play Button Overlay */}
          {isReady && (
            <button
              onClick={handlePlayPause}
              className="absolute bottom-4 right-4 w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all hover:scale-105 shadow-lg"
            >
              {isPlaying ? (
                <PauseIcon className="w-8 h-8 text-white" />
              ) : (
                <PlayIcon className="w-8 h-8 text-white ml-1" />
              )}
            </button>
          )}
        </div>

        {/* Track Info */}
        <div className="text-center mb-8 max-w-md">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {track.title}
          </h1>
          <p className="text-[var(--text-dark-secondary)] mb-1">
            {track.artist || 'AI Generated'}
          </p>
          <p className="text-sm text-[var(--text-dark-secondary)]">
            {track.genre && `${track.genre}`}
            {track.genre && track.mood && ' • '}
            {track.mood && `${track.mood}`}
          </p>
        </div>

        {/* Player Controls */}
        {isReady && (
          <div className="w-full max-w-md space-y-4">
            {/* Progress Bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-dark-secondary)] w-10 text-right">
                {formatTime(progress)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={progress}
                onChange={handleSeek}
                className="flex-1 h-1.5 bg-[var(--base-border)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
                style={{
                  background: `linear-gradient(to right, var(--accent-blue) 0%, var(--accent-blue) ${
                    (progress / (duration || 100)) * 100
                  }%, var(--base-border) ${(progress / (duration || 100)) * 100}%, var(--base-border) 100%)`,
                }}
              />
              <span className="text-xs text-[var(--text-dark-secondary)] w-10">
                {formatTime(duration)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handlePlayPause}
                className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
              >
                {isPlaying ? (
                  <PauseIcon className="w-6 h-6 text-black" />
                ) : (
                  <PlayIcon className="w-6 h-6 text-black ml-0.5" />
                )}
              </button>
              
              <button
                onClick={handleDownload}
                className="w-12 h-12 rounded-full border border-[var(--base-border)] flex items-center justify-center hover:border-white/40 transition-colors"
                title="Download track"
              >
                <DownloadIcon className="w-5 h-5 text-[var(--text-dark-secondary)]" />
              </button>
            </div>
          </div>
        )}

        {/* Track not ready message */}
        {!isReady && (
          <div className="text-center">
            {track.status === 'generating' ? (
              <div className="flex items-center gap-3 text-[var(--text-dark-secondary)]">
                <div className="w-5 h-5 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
                <span>Generating track...</span>
              </div>
            ) : track.status === 'error' ? (
              <p className="text-red-400">
                {track.error || 'Failed to generate track'}
              </p>
            ) : (
              <p className="text-[var(--text-dark-secondary)]">
                Track is pending generation
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

