// Database types generated from the Supabase schema

export type PlaylistStatus = 'pending' | 'generating' | 'ready' | 'partial' | 'error';
export type TrackStatus = 'pending' | 'generating' | 'ready' | 'error';

// ============================================
// USER TYPES
// ============================================
export interface DbUser {
  id: string;
  ip_hash: string;
  created_at: string;
  last_seen_at: string;
}

export interface InsertUser {
  ip_hash: string;
}

export interface UpdateUser {
  ip_hash?: string;
  last_seen_at?: string;
}

// ============================================
// SESSION TYPES
// ============================================
export interface DbSession {
  id: string;
  user_id: string;
  session_token: string;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string;
}

export interface DbSessionWithUser extends DbSession {
  user: DbUser;
}

export interface InsertSession {
  user_id: string;
  session_token: string;
  user_agent?: string | null;
}

export interface UpdateSession {
  user_agent?: string | null;
  last_seen_at?: string;
}

// ============================================
// PLAYLIST TYPES
// ============================================
export interface DbPlaylist {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  prompt: string;
  genre: string | null;
  mood: string | null;
  status: PlaylistStatus;
  created_at: string;
  updated_at: string;
}

export interface DbTrack {
  id: string;
  playlist_id: string;
  title: string;
  prompt: string;
  genre: string | null;
  mood: string | null;
  duration: number;
  audio_url: string | null;
  status: TrackStatus;
  error: string | null;
  track_order: number;
  created_at: string;
}

export interface DbPlaylistWithTracks extends DbPlaylist {
  tracks: DbTrack[];
}

// Insert types (without auto-generated fields)
export interface InsertPlaylist {
  user_id?: string | null;
  name: string;
  description?: string | null;
  prompt: string;
  genre?: string | null;
  mood?: string | null;
  status?: PlaylistStatus;
}

export interface InsertTrack {
  playlist_id: string;
  title: string;
  prompt: string;
  genre?: string | null;
  mood?: string | null;
  duration?: number;
  audio_url?: string | null;
  status?: TrackStatus;
  error?: string | null;
  track_order?: number;
}

// Update types (all fields optional)
export interface UpdatePlaylist {
  user_id?: string | null;
  name?: string;
  description?: string | null;
  prompt?: string;
  genre?: string | null;
  mood?: string | null;
  status?: PlaylistStatus;
}

export interface UpdateTrack {
  title?: string;
  prompt?: string;
  genre?: string | null;
  mood?: string | null;
  duration?: number;
  audio_url?: string | null;
  status?: TrackStatus;
  error?: string | null;
  track_order?: number;
}

