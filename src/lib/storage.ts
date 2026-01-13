import { Playlist, Track } from '@/types';

const PLAYLISTS_KEY = 'hyde_playlists';
const CURRENT_PLAYLIST_KEY = 'hyde_current_playlist';

/**
 * Save a playlist to localStorage
 */
export function savePlaylist(playlist: Playlist): void {
  if (typeof window === 'undefined') return;
  
  const playlists = getPlaylists();
  const existingIndex = playlists.findIndex(p => p.id === playlist.id);
  
  if (existingIndex >= 0) {
    playlists[existingIndex] = playlist;
  } else {
    playlists.unshift(playlist);
  }
  
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
}

/**
 * Get all saved playlists from localStorage
 */
export function getPlaylists(): Playlist[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(PLAYLISTS_KEY);
    if (!data) return [];
    
    const playlists = JSON.parse(data) as Playlist[];
    
    // Convert date strings back to Date objects
    return playlists.map(p => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
      tracks: p.tracks.map(t => ({
        ...t,
        createdAt: new Date(t.createdAt),
      })),
    }));
  } catch {
    return [];
  }
}

/**
 * Get a specific playlist by ID
 */
export function getPlaylistById(id: string): Playlist | null {
  const playlists = getPlaylists();
  return playlists.find(p => p.id === id) || null;
}

/**
 * Delete a playlist from localStorage
 */
export function deletePlaylist(id: string): void {
  if (typeof window === 'undefined') return;
  
  const playlists = getPlaylists();
  const filtered = playlists.filter(p => p.id !== id);
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(filtered));
}

/**
 * Save current playlist state (for recovery)
 */
export function saveCurrentPlaylist(playlist: Playlist | null): void {
  if (typeof window === 'undefined') return;
  
  if (playlist) {
    localStorage.setItem(CURRENT_PLAYLIST_KEY, JSON.stringify(playlist));
  } else {
    localStorage.removeItem(CURRENT_PLAYLIST_KEY);
  }
}

/**
 * Get current playlist state
 */
export function getCurrentPlaylist(): Playlist | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const data = localStorage.getItem(CURRENT_PLAYLIST_KEY);
    if (!data) return null;
    
    const playlist = JSON.parse(data) as Playlist;
    return {
      ...playlist,
      createdAt: new Date(playlist.createdAt),
      updatedAt: new Date(playlist.updatedAt),
      tracks: playlist.tracks.map(t => ({
        ...t,
        createdAt: new Date(t.createdAt),
      })),
    };
  } catch {
    return null;
  }
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new empty playlist
 */
export function createEmptyPlaylist(
  prompt: string,
  genre?: string,
  mood?: string
): Playlist {
  const now = new Date();
  return {
    id: generateId(),
    name: prompt.slice(0, 50) + (prompt.length > 50 ? '...' : ''),
    prompt,
    genre,
    mood,
    tracks: [],
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create a new track
 */
export function createTrack(
  prompt: string,
  index: number,
  genre?: string,
  mood?: string,
  duration: number = 60
): Track {
  return {
    id: generateId(),
    title: `Track ${index + 1}`,
    prompt,
    genre,
    mood,
    duration,
    status: 'pending',
    createdAt: new Date(),
  };
}

