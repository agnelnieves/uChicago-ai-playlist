'use client';

import { useState, useEffect } from 'react';
import { Logo } from '@/components/Logo';
import { PlaylistForm } from '@/components/PlaylistForm';
import { PlaylistPlayer } from '@/components/PlaylistPlayer';
import { GeneratingOverlay } from '@/components/GeneratingOverlay';
import { Playlist, Track } from '@/types';
import { generateId, savePlaylist, getPlaylists } from '@/lib/storage';

const GREETINGS = [
  "Hey there! What would you like to listen today?",
  "Welcome back! Ready to create some music?",
  "Let's make something amazing today!",
  "What's the vibe today?",
];

export default function Home() {
  const [greeting, setGreeting] = useState(GREETINGS[0]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedPlaylists, setSavedPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    // Random greeting on mount
    setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
    // Load saved playlists
    setSavedPlaylists(getPlaylists());
  }, []);

  const handleSubmit = async (data: {
    prompt: string;
    genre?: string;
    mood?: string;
  }) => {
    const trackCount = 3; // Fixed at 3-5 tracks
    const trackDuration = 60; // 60 seconds per track

    // Create playlist structure
    const newPlaylist: Playlist = {
      id: generateId(),
      name: data.prompt.slice(0, 50) + (data.prompt.length > 50 ? '...' : ''),
      prompt: data.prompt,
      genre: data.genre,
      mood: data.mood,
      tracks: Array.from({ length: trackCount }, (_, i) => ({
        id: generateId(),
        title: `Track ${i + 1}`,
        prompt: data.prompt,
        genre: data.genre,
        mood: data.mood,
        duration: trackDuration,
        status: 'pending' as const,
        createdAt: new Date(),
      })),
      status: 'generating',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCurrentPlaylist(newPlaylist);
    setIsGenerating(true);

    // Generate tracks sequentially
    for (let i = 0; i < newPlaylist.tracks.length; i++) {
      // Update track status to generating
      setCurrentPlaylist(prev => {
        if (!prev) return prev;
        const tracks = [...prev.tracks];
        tracks[i] = { ...tracks[i], status: 'generating' };
        return { ...prev, tracks };
      });

      try {
        // Build the prompt for this specific track
        let trackPrompt = data.prompt;
        if (data.genre) trackPrompt = `${data.genre} genre. ${trackPrompt}`;
        if (data.mood) trackPrompt = `${data.mood} mood. ${trackPrompt}`;
        
        // Add variation for different tracks
        const variations = [
          '',
          ' With an intro buildup.',
          ' With dynamic changes and energy shifts.',
        ];
        trackPrompt += variations[i % variations.length];

        const response = await fetch('/api/generate-track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: trackPrompt,
            duration: trackDuration,
            instrumental: true,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to generate track');
        }

        // Update track with audio URL
        setCurrentPlaylist(prev => {
          if (!prev) return prev;
          const tracks = [...prev.tracks];
          tracks[i] = {
            ...tracks[i],
            audioUrl: result.audioUrl,
            status: 'ready',
          };
          return { ...prev, tracks };
        });
      } catch (error) {
        console.error(`Error generating track ${i + 1}:`, error);
        
        // Update track with error
        setCurrentPlaylist(prev => {
          if (!prev) return prev;
          const tracks = [...prev.tracks];
          tracks[i] = {
            ...tracks[i],
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          return { ...prev, tracks };
        });
      }
    }

    // Finish generation
    setCurrentPlaylist(prev => {
      if (!prev) return prev;
      const hasReady = prev.tracks.some(t => t.status === 'ready');
      const allReady = prev.tracks.every(t => t.status === 'ready');
      
      const updatedPlaylist = {
        ...prev,
        status: allReady ? 'ready' as const : hasReady ? 'partial' as const : 'error' as const,
        updatedAt: new Date(),
      };
      
      // Save playlist if any tracks succeeded
      if (hasReady) {
        savePlaylist(updatedPlaylist);
        setSavedPlaylists(getPlaylists());
      }
      
      return updatedPlaylist;
    });

    setIsGenerating(false);
  };

  const hasReadyTracks = currentPlaylist?.tracks.some(t => t.status === 'ready');

  return (
    <div className="min-h-screen bg-[var(--base-surface-1)] flex flex-col relative overflow-hidden">
      {/* Background glow */}
      <div 
        className="absolute top-[-375px] left-1/2 -translate-x-1/2 w-[1058px] h-[506px] opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(80, 161, 255, 0.4) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 w-full px-8 lg:px-[216px]">
        <nav className="flex items-center justify-between py-5 pb-1.5">
          <Logo />
          
          <div className="flex items-center gap-3">
            <button
              className="flex items-center justify-center h-9 px-3 rounded-full font-semibold text-sm text-[var(--text-light-primary)] transition-all hover:brightness-110"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(20, 20, 20, 0) 0%, rgba(20, 20, 20, 0.36) 100%), linear-gradient(90deg, #50A1FF 0%, #50A1FF 100%)`,
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              Create
            </button>
            
            {/* Avatar placeholder */}
            <div className="w-10 h-10 rounded-full border border-[var(--base-border)] bg-gradient-to-br from-orange-400 to-red-500 overflow-hidden">
              <div className="w-full h-full flex items-center justify-center text-white font-bold">
                A
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center pt-[50px] px-4 lg:px-[216px]">
        {/* Greeting */}
        <div className="text-center pb-[42px]">
          <h1 className="text-[30px] leading-[38px] tracking-[-0.6px] text-[var(--text-dark-secondary)] max-w-[640px]">
            {greeting.split('!').map((part, i, arr) => (
              <span key={i}>
                {i === 0 ? <span className="block">{part}!</span> : null}
                {i === 1 && part ? <span className="block">{part}</span> : null}
              </span>
            ))}
          </h1>
        </div>

        {/* Form */}
        <PlaylistForm onSubmit={handleSubmit} isLoading={isGenerating} />
      </main>

      {/* Generating Overlay */}
      {isGenerating && currentPlaylist && (
        <GeneratingOverlay playlist={currentPlaylist} />
      )}

      {/* Player */}
      {!isGenerating && currentPlaylist && hasReadyTracks && (
        <PlaylistPlayer playlist={currentPlaylist} />
      )}
    </div>
  );
}
