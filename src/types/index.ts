export interface Track {
  id: string;
  title: string;
  prompt: string;
  genre?: string;
  mood?: string;
  duration: number;
  audioUrl?: string;
  audioBlob?: Blob;
  status: 'pending' | 'generating' | 'ready' | 'error';
  error?: string;
  createdAt: Date;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  genre?: string;
  mood?: string;
  tracks: Track[];
  status: 'pending' | 'generating' | 'ready' | 'partial' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratePlaylistRequest {
  prompt: string;
  genre?: string;
  mood?: string;
  trackCount: number;
  trackDuration: number; // in seconds
  instrumental: boolean;
}

export interface GenerateTrackRequest {
  prompt: string;
  duration: number; // in seconds
  instrumental: boolean;
}

export type Genre =
  | 'Pop'
  | 'Rock'
  | 'Electronic'
  | 'Jazz'
  | 'Classical'
  | 'Hip Hop'
  | 'Ambient'
  | 'Cinematic'
  | 'Lo-Fi'
  | 'R&B'
  | 'Country'
  | 'Folk';

export type Mood =
  | 'Happy'
  | 'Melancholic'
  | 'Energetic'
  | 'Calm'
  | 'Romantic'
  | 'Mysterious'
  | 'Epic'
  | 'Nostalgic'
  | 'Dark'
  | 'Uplifting';

export const GENRES: Genre[] = [
  'Pop',
  'Rock',
  'Electronic',
  'Jazz',
  'Classical',
  'Hip Hop',
  'Ambient',
  'Cinematic',
  'Lo-Fi',
  'R&B',
  'Country',
  'Folk',
];

export const MOODS: { name: Mood; emoji: string }[] = [
  { name: 'Happy', emoji: '😊' },
  { name: 'Melancholic', emoji: '😢' },
  { name: 'Energetic', emoji: '⚡' },
  { name: 'Calm', emoji: '😌' },
  { name: 'Romantic', emoji: '💕' },
  { name: 'Mysterious', emoji: '🌙' },
  { name: 'Epic', emoji: '🔥' },
  { name: 'Nostalgic', emoji: '📼' },
  { name: 'Dark', emoji: '🖤' },
  { name: 'Uplifting', emoji: '✨' },
];

export const SUGGESTION_PROMPTS = [
  'Classical music for studying.',
  'Make a playlist for vibe coding and getting locked in.',
  'Upbeat electronic tracks for a morning workout.',
  'Chill lo-fi beats for a rainy afternoon.',
  'Epic cinematic music for creative writing.',
  'Relaxing ambient sounds for meditation.',
];

