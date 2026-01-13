import { createClient } from './server';
import type {
  DbPlaylist,
  DbTrack,
  DbPlaylistWithTracks,
  InsertPlaylist,
  InsertTrack,
  UpdatePlaylist,
  UpdateTrack,
} from './types';

// ============================================
// PLAYLIST OPERATIONS
// ============================================

/**
 * Get all playlists (ordered by creation date, newest first)
 */
export async function getPlaylists(): Promise<DbPlaylist[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .order('created_at', { ascending: false });

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

