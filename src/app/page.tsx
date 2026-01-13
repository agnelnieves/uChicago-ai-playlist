'use client';

import { useState, useEffect } from 'react';
import { Logo } from '@/components/Logo';
import { PlaylistForm } from '@/components/PlaylistForm';
import { PlaylistPlayer } from '@/components/PlaylistPlayer';
import { GeneratingOverlay } from '@/components/GeneratingOverlay';
import { Playlist, Track } from '@/types';
import type { DbPlaylistWithTracks, DbTrack } from '@/lib/supabase/types';

const GREETINGS = [
  "Hey there! What would you like to listen today?",
  "Welcome back! Ready to create some music?",
  "Let's make something amazing today!",
  "What's the vibe today?",
];

// Convert database playlist to app playlist format
function dbToPlaylist(db: DbPlaylistWithTracks): Playlist {
  return {
    id: db.id,
    name: db.name,
    description: db.description || undefined,
    prompt: db.prompt,
    genre: db.genre || undefined,
    mood: db.mood || undefined,
    status: db.status,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
    tracks: db.tracks.map((t: DbTrack) => ({
      id: t.id,
      title: t.title,
      prompt: t.prompt,
      genre: t.genre || undefined,
      mood: t.mood || undefined,
      duration: t.duration,
      audioUrl: t.audio_url || undefined,
      status: t.status,
      error: t.error || undefined,
      createdAt: new Date(t.created_at),
    })),
  };
}

export default function Home() {
  const [greeting, setGreeting] = useState(GREETINGS[0]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedPlaylists, setSavedPlaylists] = useState<Playlist[]>([]);

  // Load saved playlists from Supabase
  const fetchPlaylists = async () => {
    try {
      const res = await fetch('/api/playlists');
      if (res.ok) {
        const data = await res.json();
        // Note: These don't include tracks, just playlist metadata
        setSavedPlaylists(data.playlists.map((p: DbPlaylistWithTracks) => ({
          ...p,
          tracks: p.tracks || [],
          createdAt: new Date(p.created_at),
          updatedAt: new Date(p.updated_at),
        })));
      }
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    }
  };

  useEffect(() => {
    // Random greeting on mount
    setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
    // Load saved playlists from Supabase
    fetchPlaylists();
  }, []);

  const handleSubmit = async (data: {
    prompt: string;
    genre?: string;
    mood?: string;
  }) => {
    const trackCount = 3; // Fixed at 3-5 tracks
    const trackDuration = 60; // 60 seconds per track

    setIsGenerating(true);

    try {
      // Create playlist in Supabase first
      const createRes = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: data.prompt,
          genre: data.genre,
          mood: data.mood,
          trackCount,
          trackDuration,
        }),
      });

      if (!createRes.ok) {
        throw new Error('Failed to create playlist');
      }

      const { playlist: dbPlaylist } = await createRes.json();
      const newPlaylist = dbToPlaylist(dbPlaylist);
      setCurrentPlaylist(newPlaylist);

      // Generate tracks sequentially
      for (let i = 0; i < newPlaylist.tracks.length; i++) {
        const track = newPlaylist.tracks[i];

        // Update track status to generating (local state)
        setCurrentPlaylist(prev => {
          if (!prev) return prev;
          const tracks = [...prev.tracks];
          tracks[i] = { ...tracks[i], status: 'generating' };
          return { ...prev, tracks };
        });

        // Update track status in database
        await fetch(`/api/tracks/${track.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'generating' }),
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

          // Update track in database with audio URL
          await fetch(`/api/tracks/${track.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio_url: result.audioUrl,
              status: 'ready',
            }),
          });

          // Update local state
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
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          
          // Update track in database with error
          await fetch(`/api/tracks/${track.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'error',
              error: errorMsg,
            }),
          });

          // Update local state with error
          setCurrentPlaylist(prev => {
            if (!prev) return prev;
            const tracks = [...prev.tracks];
            tracks[i] = {
              ...tracks[i],
              status: 'error',
              error: errorMsg,
            };
            return { ...prev, tracks };
          });
        }
      }

      // Finish generation - update playlist status
      setCurrentPlaylist(prev => {
        if (!prev) return prev;
        const hasReady = prev.tracks.some(t => t.status === 'ready');
        const allReady = prev.tracks.every(t => t.status === 'ready');
        
        const finalStatus = allReady ? 'ready' : hasReady ? 'partial' : 'error';
        
        // Update playlist status in database
        fetch(`/api/playlists/${prev.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: finalStatus }),
        });

        return {
          ...prev,
          status: finalStatus as Playlist['status'],
          updatedAt: new Date(),
        };
      });

      // Refresh saved playlists
      fetchPlaylists();
    } catch (error) {
      console.error('Error creating playlist:', error);
    }

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
