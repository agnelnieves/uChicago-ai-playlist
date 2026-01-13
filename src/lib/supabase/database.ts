import { createClient } from './server';
import type {
  DbUser,
  DbSession,
  DbPlaylist,
  DbTrack,
  DbPlaylistWithTracks,
  InsertUser,
  InsertSession,
  InsertPlaylist,
  InsertTrack,
  UpdatePlaylist,
  UpdateTrack,
} from './types';

// Helper to extract error message from various error formats
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
      return (error as { message: string }).message;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

// Check if error is transient (network/Cloudflare issues)
function isTransientError(errorMessage: string): boolean {
  return (
    errorMessage.includes('<!DOCTYPE') ||
    errorMessage.includes('fetch failed') ||
    errorMessage.includes('ECONNRESET') ||
    errorMessage.includes('socket') ||
    errorMessage.includes('UND_ERR') ||
    errorMessage.includes('500') ||
    errorMessage.includes('502') ||
    errorMessage.includes('503') ||
    errorMessage.includes('504') ||
    errorMessage.includes('Internal server error') ||
    errorMessage.includes('Connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('other side closed')
  );
}

// Retry helper for database operations
async function withRetry<T>(
  operation: string,
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorMessage = getErrorMessage(error);
      const isTransient = isTransientError(errorMessage);
      
      if (!isTransient || attempt === maxRetries - 1) {
        console.error(`${operation} failed after ${attempt + 1} attempts:`, 
          errorMessage.substring(0, 300));
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
      console.log(`${operation} retry ${attempt + 1}/${maxRetries} in ${Math.round(delay)}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// ============================================
// USER OPERATIONS
// ============================================

/**
 * Get a user by their hashed IP
 */
export async function getUserByIpHash(ipHash: string): Promise<DbUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('ip_hash', ipHash)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching user by IP hash:', error);
    throw error;
  }

  return data;
}

/**
 * Get a user by ID
 */
export async function getUserById(id: string): Promise<DbUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching user:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new user
 */
export async function createUser(user: InsertUser): Promise<DbUser> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .insert(user)
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    throw error;
  }

  return data;
}

/**
 * Update user's last_seen_at timestamp
 */
export async function touchUser(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('users')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error updating user last_seen_at:', error);
    // Don't throw - this is a non-critical operation
  }
}

/**
 * Get or create a user by IP hash
 */
export async function getOrCreateUserByIpHash(ipHash: string): Promise<DbUser> {
  // Try to find existing user
  const user = await getUserByIpHash(ipHash);
  
  if (user) {
    // Update last_seen_at
    await touchUser(user.id);
    return user;
  }
  
  // Create new user
  return createUser({ ip_hash: ipHash });
}

// ============================================
// SESSION OPERATIONS
// ============================================

/**
 * Get a session by token
 */
export async function getSessionByToken(token: string): Promise<DbSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('session_token', token)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching session:', error);
    throw error;
  }

  return data;
}

/**
 * Get a session with its associated user
 */
export async function getSessionWithUser(token: string): Promise<{ session: DbSession; user: DbUser } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      user:users (*)
    `)
    .eq('session_token', token)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching session with user:', error);
    throw error;
  }

  if (!data || !data.user) {
    return null;
  }

  return {
    session: {
      id: data.id,
      user_id: data.user_id,
      session_token: data.session_token,
      user_agent: data.user_agent,
      created_at: data.created_at,
      last_seen_at: data.last_seen_at,
    },
    user: data.user as DbUser,
  };
}

/**
 * Create a new session
 */
export async function createSession(session: InsertSession): Promise<DbSession> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sessions')
    .insert(session)
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', error);
    throw error;
  }

  return data;
}

/**
 * Update session's last_seen_at timestamp
 */
export async function touchSession(token: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('sessions')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('session_token', token);

  if (error) {
    console.error('Error updating session last_seen_at:', error);
    // Don't throw - this is a non-critical operation
  }
}

/**
 * Delete a session
 */
export async function deleteSession(token: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('session_token', token);

  if (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
}

// ============================================
// PLAYLIST OPERATIONS
// ============================================

/**
 * Get all playlists (ordered by creation date, newest first)
 * Optionally filter by user_id
 */
export async function getPlaylists(userId?: string): Promise<DbPlaylist[]> {
  const supabase = await createClient();
  let query = supabase
    .from('playlists')
    .select('*')
    .order('created_at', { ascending: false });

  // Filter by user_id if provided
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching playlists:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a playlist by ID with all its tracks
 */
export async function getPlaylistById(id: string): Promise<DbPlaylistWithTracks | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('playlists')
    .select(`
      *,
      tracks (*)
    `)
    .eq('id', id)
    .order('track_order', { referencedTable: 'tracks', ascending: true })
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching playlist:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new playlist
 */
export async function createPlaylist(playlist: InsertPlaylist): Promise<DbPlaylist> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('playlists')
    .insert(playlist)
    .select()
    .single();

  if (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }

  return data;
}

/**
 * Update a playlist (with retry for transient errors)
 */
export async function updatePlaylist(id: string, updates: UpdatePlaylist): Promise<DbPlaylist> {
  return withRetry('Update playlist', async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('playlists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  });
}

/**
 * Delete a playlist (cascades to tracks)
 */
export async function deletePlaylist(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting playlist:', error);
    throw error;
  }
}

// ============================================
// TRACK OPERATIONS
// ============================================

/**
 * Get all tracks for a playlist
 */
export async function getTracksByPlaylistId(playlistId: string): Promise<DbTrack[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('playlist_id', playlistId)
    .order('track_order', { ascending: true });

  if (error) {
    console.error('Error fetching tracks:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a track by ID
 */
export async function getTrackById(id: string): Promise<DbTrack | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching track:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new track
 */
export async function createTrack(track: InsertTrack): Promise<DbTrack> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tracks')
    .insert(track)
    .select()
    .single();

  if (error) {
    console.error('Error creating track:', error);
    throw error;
  }

  return data;
}

/**
 * Create multiple tracks at once
 */
export async function createTracks(tracks: InsertTrack[]): Promise<DbTrack[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tracks')
    .insert(tracks)
    .select();

  if (error) {
    console.error('Error creating tracks:', error);
    throw error;
  }

  return data || [];
}

/**
 * Update a track (with retry for transient errors)
 */
export async function updateTrack(id: string, updates: UpdateTrack): Promise<DbTrack> {
  return withRetry('Update track', async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('tracks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  });
}

/**
 * Delete a track
 */
export async function deleteTrack(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('tracks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting track:', error);
    throw error;
  }
}

// ============================================
// DISCOVER FUNCTIONS
// ============================================

/**
 * Get recent tracks from all users (for discover feed)
 * Only returns tracks that are ready and have audio
 */
export async function getRecentTracks(limit: number = 20): Promise<DbTrack[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('status', 'ready')
    .not('audio_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent tracks:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get recent playlists from all users (for discover feed)
 * Only returns playlists that are ready or partial (have some tracks)
 */
export async function getRecentPlaylists(limit: number = 20): Promise<DbPlaylistWithTracks[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('playlists')
    .select(`
      *,
      tracks (*)
    `)
    .in('status', ['ready', 'partial'])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent playlists:', error);
    throw error;
  }

  // Filter out playlists with no ready tracks and sort tracks by order
  return (data || [])
    .map(playlist => ({
      ...playlist,
      tracks: (playlist.tracks || []).sort((a: DbTrack, b: DbTrack) => a.track_order - b.track_order),
    }))
    .filter(playlist => playlist.tracks.some((t: DbTrack) => t.status === 'ready' && t.audio_url));
}

/**
 * Get featured/popular playlists (could be extended with popularity metrics)
 * For now, just returns recent playlists with multiple tracks
 */
export async function getFeaturedPlaylists(limit: number = 12): Promise<DbPlaylistWithTracks[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('playlists')
    .select(`
      *,
      tracks (*)
    `)
    .in('status', ['ready', 'partial'])
    .order('created_at', { ascending: false })
    .limit(limit * 2); // Fetch more to filter

  if (error) {
    console.error('Error fetching featured playlists:', error);
    throw error;
  }

  // Filter to playlists with at least 2 ready tracks and sort tracks
  return (data || [])
    .map(playlist => ({
      ...playlist,
      tracks: (playlist.tracks || []).sort((a: DbTrack, b: DbTrack) => a.track_order - b.track_order),
    }))
    .filter(playlist => {
      const readyTracks = playlist.tracks.filter((t: DbTrack) => t.status === 'ready' && t.audio_url);
      return readyTracks.length >= 1;
    })
    .slice(0, limit);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a playlist with initial tracks
 */
export async function createPlaylistWithTracks(
  playlist: InsertPlaylist,
  tracks: Omit<InsertTrack, 'playlist_id'>[]
): Promise<DbPlaylistWithTracks> {
  const supabase = await createClient();
  
  // Create playlist
  const { data: createdPlaylist, error: playlistError } = await supabase
    .from('playlists')
    .insert(playlist)
    .select()
    .single();

  if (playlistError) {
    console.error('Error creating playlist:', playlistError);
    throw playlistError;
  }

  // Create tracks with playlist_id
  const tracksWithPlaylistId = tracks.map((track, index) => ({
    ...track,
    playlist_id: createdPlaylist.id,
    track_order: index,
  }));

  const { data: createdTracks, error: tracksError } = await supabase
    .from('tracks')
    .insert(tracksWithPlaylistId)
    .select()
    .order('track_order', { ascending: true });

  if (tracksError) {
    console.error('Error creating tracks:', tracksError);
    // Clean up the playlist if tracks failed
    await supabase.from('playlists').delete().eq('id', createdPlaylist.id);
    throw tracksError;
  }

  return {
    ...createdPlaylist,
    tracks: createdTracks || [],
  };
}

