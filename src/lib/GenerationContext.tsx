'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Playlist } from '@/types';
import type { DbPlaylistWithTracks, DbTrack } from '@/lib/supabase/types';

// Generation status
export type GenerationStatus = 'idle' | 'generating' | 'completed' | 'error';

// Generation data structure
export interface GenerationData {
  playlist: Playlist;
  mode: 'single' | 'playlist';
  status: GenerationStatus;
  startedAt: Date;
  completedAt?: Date;
}

// Context type
interface GenerationContextType {
  // Current generation state
  generation: GenerationData | null;
  isGenerating: boolean;
  
  // Actions
  startGeneration: (data: {
    prompt: string;
    genre?: string;
    mood?: string;
    mode: 'single' | 'playlist';
  }) => Promise<void>;
  updatePlaylist: (playlist: Playlist) => void;
  clearGeneration: () => void;
  dismissGeneration: () => void;
  
  // UI State
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  isDismissed: boolean;
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

const GenerationContext = createContext<GenerationContextType | null>(null);

export function useGeneration() {
  const context = useContext(GenerationContext);
  if (!context) {
    throw new Error('useGeneration must be used within a GenerationProvider');
  }
  return context;
}

// Try to use the context, returns null if not in provider
export function useGenerationSafe() {
  return useContext(GenerationContext);
}

interface GenerationProviderProps {
  children: React.ReactNode;
}

export function GenerationProvider({ children }: GenerationProviderProps) {
  const [generation, setGeneration] = useState<GenerationData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isGenerating = generation?.status === 'generating';

  // Helper function to make API requests with retry
  const fetchWithRetry = async (
    url: string,
    options: RequestInit,
    maxRetries: number = 3
  ): Promise<Response> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        
        if (response.status >= 500 && attempt < maxRetries - 1) {
          const delay = 1000 * Math.pow(2, attempt) + Math.random() * 500;
          console.log(`Request to ${url} returned ${response.status}, retrying in ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries - 1) {
          const delay = 1000 * Math.pow(2, attempt) + Math.random() * 500;
          console.log(`Request to ${url} failed, retrying in ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Request failed after retries');
  };

  // Helper function to generate an image
  const generateImage = useCallback(async (
    prompt: string,
    type: 'playlist_cover' | 'track_thumbnail',
    genre?: string,
    mood?: string
  ): Promise<string | null> => {
    try {
      const response = await fetchWithRetry('/api/generate-image', {
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
  }, []);

  const startGeneration = useCallback(async (data: {
    prompt: string;
    genre?: string;
    mood?: string;
    mode: 'single' | 'playlist';
  }) => {
    // Cancel any existing generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const trackCount = data.mode === 'single' ? 1 : 3;
    const trackDuration = 60;

    try {
      // Reset dismissed state when starting new generation
      setIsDismissed(false);
      
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
      
      // Set initial generation state
      setGeneration({
        playlist: newPlaylist,
        mode: data.mode,
        status: 'generating',
        startedAt: new Date(),
      });

      // Generate playlist cover image (async, don't wait)
      generateImage(data.prompt, 'playlist_cover', data.genre, data.mood)
        .then(async (coverImageUrl) => {
          if (coverImageUrl && newPlaylist.id) {
            await fetchWithRetry(`/api/playlists/${newPlaylist.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cover_image_url: coverImageUrl }),
            }).catch(err => console.warn('Failed to save playlist cover:', err));
            
            setGeneration(prev => prev ? {
              ...prev,
              playlist: { ...prev.playlist, coverImageUrl }
            } : prev);
          }
        });

      // Generate tracks sequentially
      let currentPlaylist = newPlaylist;
      
      for (let i = 0; i < newPlaylist.tracks.length; i++) {
        // Check if aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        const track = newPlaylist.tracks[i];

        // Update track status to generating
        const updatedTracks = [...currentPlaylist.tracks];
        updatedTracks[i] = { ...updatedTracks[i], status: 'generating' };
        currentPlaylist = { ...currentPlaylist, tracks: updatedTracks };
        
        setGeneration(prev => prev ? {
          ...prev,
          playlist: currentPlaylist
        } : prev);

        // Update track status in database
        await fetchWithRetry(`/api/tracks/${track.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'generating' }),
        }).catch(err => console.warn('Failed to update track status to generating:', err));

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
            fetchWithRetry('/api/generate-track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: trackPrompt,
                duration: trackDuration,
                instrumental: true,
              }),
            }, 2),
            generateImage(trackPrompt, 'track_thumbnail', data.genre, data.mood),
          ]);

          const audioResult = await audioResponse.json();

          if (!audioResponse.ok) {
            throw new Error(audioResult.error || 'Failed to generate track');
          }

          // Update track in database
          await fetchWithRetry(`/api/tracks/${track.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio_url: audioResult.audioUrl,
              image_url: trackImageUrl,
              status: 'ready',
            }),
          });

          // Update local state
          const readyTracks = [...currentPlaylist.tracks];
          readyTracks[i] = {
            ...readyTracks[i],
            audioUrl: audioResult.audioUrl,
            imageUrl: trackImageUrl || undefined,
            status: 'ready',
          };
          currentPlaylist = { ...currentPlaylist, tracks: readyTracks };
          
          setGeneration(prev => prev ? {
            ...prev,
            playlist: currentPlaylist
          } : prev);

        } catch (error) {
          console.error(`Error generating track ${i + 1}:`, error);
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          
          // Update track in database with error
          await fetchWithRetry(`/api/tracks/${track.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'error',
              error: errorMsg,
            }),
          }).catch(err => console.warn('Failed to update track error status:', err));

          // Update local state with error
          const errorTracks = [...currentPlaylist.tracks];
          errorTracks[i] = {
            ...errorTracks[i],
            status: 'error',
            error: errorMsg,
          };
          currentPlaylist = { ...currentPlaylist, tracks: errorTracks };
          
          setGeneration(prev => prev ? {
            ...prev,
            playlist: currentPlaylist
          } : prev);
        }
      }

      // Determine final status
      const hasReady = currentPlaylist.tracks.some(t => t.status === 'ready');
      const allReady = currentPlaylist.tracks.every(t => t.status === 'ready');
      const finalStatus = allReady ? 'ready' : hasReady ? 'partial' : 'error';

      // Update playlist status in database
      await fetchWithRetry(`/api/playlists/${currentPlaylist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: finalStatus }),
      }).catch(err => console.warn('Failed to update playlist status:', err));

      // Update final state
      const finalPlaylist = {
        ...currentPlaylist,
        status: finalStatus as Playlist['status'],
        updatedAt: new Date(),
      };

      setGeneration(prev => prev ? {
        ...prev,
        playlist: finalPlaylist,
        status: hasReady ? 'completed' : 'error',
        completedAt: new Date(),
      } : prev);

    } catch (error) {
      console.error('Error creating playlist:', error);
      setGeneration(prev => prev ? {
        ...prev,
        status: 'error',
        completedAt: new Date(),
      } : prev);
    }
  }, [generateImage]);

  const updatePlaylist = useCallback((playlist: Playlist) => {
    setGeneration(prev => prev ? { ...prev, playlist } : prev);
  }, []);

  const clearGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setGeneration(null);
    setIsExpanded(false);
    setIsDismissed(false);
  }, []);

  const dismissGeneration = useCallback(() => {
    setIsDismissed(true);
    setIsExpanded(false);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <GenerationContext.Provider
      value={{
        generation,
        isGenerating,
        startGeneration,
        updatePlaylist,
        clearGeneration,
        dismissGeneration,
        isExpanded,
        setIsExpanded,
        isDismissed,
      }}
    >
      {children}
    </GenerationContext.Provider>
  );
}
