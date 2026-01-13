import { NextRequest, NextResponse } from 'next/server';
import {
  getPlaylists,
  createPlaylistWithTracks,
} from '@/lib/supabase/database';
import type { InsertPlaylist, InsertTrack } from '@/lib/supabase/types';

/**
 * GET /api/playlists - Get all playlists
 */
export async function GET() {
  try {
    const playlists = await getPlaylists();
    return NextResponse.json({ playlists });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/playlists - Create a new playlist with tracks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, genre, mood, trackCount = 3, trackDuration = 60 } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Create playlist data
    const playlistData: InsertPlaylist = {
      name: prompt.slice(0, 50) + (prompt.length > 50 ? '...' : ''),
      prompt,
      genre: genre || null,
      mood: mood || null,
      status: 'generating',
    };

    // Create track data
    const tracksData: Omit<InsertTrack, 'playlist_id'>[] = Array.from(
      { length: trackCount },
      (_, i) => ({
        title: `Track ${i + 1}`,
        prompt,
        genre: genre || null,
        mood: mood || null,
        duration: trackDuration,
        status: 'pending' as const,
        track_order: i,
      })
    );

    // Create playlist with tracks in database
    const playlist = await createPlaylistWithTracks(playlistData, tracksData);

    return NextResponse.json({ playlist });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500 }
    );
  }
}

