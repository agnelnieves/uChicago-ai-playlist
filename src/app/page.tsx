'use client';

import { useState, useEffect, useCallback } from 'react';
import { Logo } from '@/components/Logo';
import { PlaylistForm } from '@/components/PlaylistForm';
import { PlaylistPlayer } from '@/components/PlaylistPlayer';
import { PlaylistModal } from '@/components/PlaylistModal';
import { GeneratingOverlay } from '@/components/GeneratingOverlay';
import { Playlist } from '@/types';
import type { DbPlaylistWithTracks, DbTrack } from '@/lib/supabase/types';

const GREETINGS = [
  "Hey there! What would you like to listen today?",
  "Welcome back! Ready to create some music?",
  "Let's make something amazing today!",
  "What's the vibe today?",
];

// Session response type
interface SessionResponse {
  success: boolean;
  user?: {
    id: string;
    createdAt: string;
  };
  session?: {
    id: string;
    createdAt: string;
  };
  isNewSession?: boolean;
  error?: string;
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

export default function Home() {
  const [greeting, setGreeting] = useState(GREETINGS[0]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedPlaylists, setSavedPlaylists] = useState<Playlist[]>([]);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  // Initialize session - creates or validates session cookie
  const initializeSession = useCallback(async () => {
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (res.ok) {
        const data: SessionResponse = await res.json();
        if (data.success) {
          console.log(
            data.isNewSession 
              ? 'New session created' 
              : 'Existing session validated'
          );
        }
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
    } finally {
      setSessionInitialized(true);
    }
  }, []);

  // Load saved playlists from Supabase (filtered by session)
  const fetchPlaylists = useCallback(async () => {
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
  }, []);

  // Initialize session on mount, then fetch playlists
  useEffect(() => {
    // Random greeting on mount
    setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
    
    // Initialize session first
    initializeSession();
  }, [initializeSession]);

  // Fetch playlists once session is initialized
  useEffect(() => {
    if (sessionInitialized) {
      fetchPlaylists();
    }
  }, [sessionInitialized, fetchPlaylists]);

  // Helper function to generate an image
  const generateImage = async (
    prompt: string,
    type: 'playlist_cover' | 'track_thumbnail',
    genre?: string,
    mood?: string
  ): Promise<string | null> => {
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type, genre, mood }),
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.imageUrl || null;
      }
      console.error('Failed to generate image');
      return null;
    } catch (error) {
      console.error('Error generating image:', error);
      return null;
    }
  };

  const handleSubmit = async (data: {
    prompt: string;
    genre?: string;
    mood?: string;
    mode: 'single' | 'playlist';
  }) => {
    const trackCount = data.mode === 'single' ? 1 : 3;
    const trackDuration = 60; // 60 seconds per track

    setIsGenerating(true);
    setShowPlaylistModal(false);

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

      // Generate playlist cover image (async, don't wait)
      generateImage(data.prompt, 'playlist_cover', data.genre, data.mood)
        .then(async (coverImageUrl) => {
          if (coverImageUrl && newPlaylist.id) {
            // Update playlist cover in database
            await fetch(`/api/playlists/${newPlaylist.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cover_image_url: coverImageUrl }),
            });
            // Update local state
            setCurrentPlaylist(prev => prev ? { ...prev, coverImageUrl } : prev);
          }
        });

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
          
          // Add variation for different tracks (only for playlists)
          if (data.mode === 'playlist') {
            const variations = [
              '',
              ' With an intro buildup.',
              ' With dynamic changes and energy shifts.',
            ];
            trackPrompt += variations[i % variations.length];
          }

          // Generate track audio and image in parallel
          const [audioResponse, trackImageUrl] = await Promise.all([
            fetch('/api/generate-track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: trackPrompt,
                duration: trackDuration,
                instrumental: true,
              }),
            }),
            generateImage(trackPrompt, 'track_thumbnail', data.genre, data.mood),
          ]);

          const audioResult = await audioResponse.json();

          if (!audioResponse.ok) {
            throw new Error(audioResult.error || 'Failed to generate track');
          }

          // Update track in database with audio URL and image URL
          await fetch(`/api/tracks/${track.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio_url: audioResult.audioUrl,
              image_url: trackImageUrl,
              status: 'ready',
            }),
          });

          // Update local state
          setCurrentPlaylist(prev => {
            if (!prev) return prev;
            const tracks = [...prev.tracks];
            tracks[i] = {
              ...tracks[i],
              audioUrl: audioResult.audioUrl,
              imageUrl: trackImageUrl || undefined,
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
      
      // Show the playlist modal after generation completes
      setShowPlaylistModal(true);
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
        className="absolute top-[-200px] sm:top-[-300px] md:top-[-375px] left-1/2 -translate-x-1/2 w-[500px] sm:w-[800px] md:w-[1058px] h-[300px] sm:h-[400px] md:h-[506px] opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(80, 161, 255, 0.4) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-[216px]">
        <nav className="flex items-center justify-between py-4 sm:py-5">
          <Logo />
          
          {/* Avatar */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[var(--base-border)] bg-gradient-to-br from-orange-400 to-red-500 overflow-hidden flex-shrink-0">
            <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
              A
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center pt-8 sm:pt-12 md:pt-[50px] px-4 sm:px-6 md:px-8 lg:px-[216px]">
        {/* Greeting */}
        <div className="text-center pb-6 sm:pb-8 md:pb-[42px]">
          <h1 className="text-2xl sm:text-[28px] md:text-[30px] leading-tight sm:leading-[36px] md:leading-[38px] tracking-[-0.5px] sm:tracking-[-0.6px] text-[var(--text-dark-secondary)] max-w-[640px] px-2">
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

      {/* Playlist Modal */}
      {!isGenerating && showPlaylistModal && currentPlaylist && hasReadyTracks && (
        <PlaylistModal 
          playlist={currentPlaylist} 
          onClose={() => setShowPlaylistModal(false)} 
        />
      )}

      {/* Player (shows when modal is closed but playlist exists) */}
      {!isGenerating && !showPlaylistModal && currentPlaylist && hasReadyTracks && (
        <PlaylistPlayer playlist={currentPlaylist} />
      )}
    </div>
  );
}
