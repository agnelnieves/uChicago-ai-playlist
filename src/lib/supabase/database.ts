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
 * Update a playlist
 */
export async function updatePlaylist(id: string, updates: UpdatePlaylist): Promise<DbPlaylist> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('playlists')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating playlist:', error);
    throw error;
  }

  return data;
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
 * Update a track
 */
export async function updateTrack(id: string, updates: UpdateTrack): Promise<DbTrack> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tracks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating track:', error);
    throw error;
  }

  return data;
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

