'use client';

import { useState, useRef, useEffect } from 'react';
import { Track, Playlist } from '@/types';
import {
  PlayIcon,
  PauseIcon,
  SkipForwardIcon,
  SkipBackIcon,
  DownloadIcon,
  MusicNoteIcon,
  VolumeIcon,
} from './Icons';

interface PlaylistPlayerProps {
  playlist: Playlist;
  onClose?: () => void;
}

export function PlaylistPlayer({ playlist, onClose }: PlaylistPlayerProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const readyTracks = playlist.tracks.filter(t => t.status === 'ready' && t.audioUrl);
  const currentTrack = readyTracks[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current && currentTrack?.audioUrl) {
      audioRef.current.src = currentTrack.audioUrl;
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentTrackIndex, currentTrack?.audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handlePrevious = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentTrackIndex < readyTracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
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

  const handleEnded = () => {
    if (currentTrackIndex < readyTracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setProgress(time);
  };

  const handleDownload = async (track: Track) => {
    if (!track.audioUrl) return;

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
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (readyTracks.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[var(--base-surface-2)] border-t border-[var(--base-border)] p-4 z-50">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-6">
          {/* Track Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-lg bg-[var(--accent-blue)]/20 flex items-center justify-center flex-shrink-0">
              <MusicNoteIcon className="w-6 h-6 text-[var(--accent-blue)]" />
            </div>
            <div className="min-w-0">
              <h4 className="font-medium text-white truncate">
                {currentTrack?.title || 'No track'}
              </h4>
              <p className="text-sm text-[var(--text-dark-secondary)] truncate">
                {playlist.name}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrevious}
                disabled={currentTrackIndex === 0}
                className="p-2 text-[var(--text-dark-secondary)] hover:text-white disabled:opacity-30 transition-colors"
              >
                <SkipBackIcon className="w-5 h-5" />
              </button>

              <button
                onClick={handlePlayPause}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <PauseIcon className="w-5 h-5 text-black" />
                ) : (
                  <PlayIcon className="w-5 h-5 text-black ml-0.5" />
                )}
              </button>

              <button
                onClick={handleNext}
                disabled={currentTrackIndex === readyTracks.length - 1}
                className="p-2 text-[var(--text-dark-secondary)] hover:text-white disabled:opacity-30 transition-colors"
              >
                <SkipForwardIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2 w-full max-w-md">
              <span className="text-xs text-[var(--text-dark-secondary)] w-10 text-right">
                {formatTime(progress)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={progress}
                onChange={handleSeek}
                className="flex-1 h-1 bg-[var(--base-border)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
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
          </div>

          {/* Volume & Actions */}
          <div className="flex items-center gap-4 flex-1 justify-end">
            <div className="flex items-center gap-2">
              <VolumeIcon className="w-5 h-5 text-[var(--text-dark-secondary)]" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1 bg-[var(--base-border)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </div>

            {currentTrack && (
              <button
                onClick={() => handleDownload(currentTrack)}
                className="p-2 text-[var(--text-dark-secondary)] hover:text-white transition-colors"
                title="Download track"
              >
                <DownloadIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Track List */}
        {readyTracks.length > 1 && (
          <div className="mt-4 pt-4 border-t border-[var(--base-border)]">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {readyTracks.map((track, index) => (
                <button
                  key={track.id}
                  onClick={() => setCurrentTrackIndex(index)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm transition-all ${
                    index === currentTrackIndex
                      ? 'bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]'
                      : 'bg-[var(--base-fill-1)] text-[var(--text-dark-secondary)] hover:text-white'
                  }`}
                >
                  {track.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

