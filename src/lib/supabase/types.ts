// Database types generated from the Supabase schema

export type PlaylistStatus = 'pending' | 'generating' | 'ready' | 'partial' | 'error';
export type TrackStatus = 'pending' | 'generating' | 'ready' | 'error';

export interface DbPlaylist {
  id: string;
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

