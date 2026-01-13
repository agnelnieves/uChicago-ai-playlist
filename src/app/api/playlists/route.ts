import { NextRequest, NextResponse } from 'next/server';
import {
  getPlaylists,
  createPlaylistWithTracks,
  getSessionWithUser,
} from '@/lib/supabase/database';
import { getSessionTokenFromRequest } from '@/lib/session';
import type { InsertPlaylist, InsertTrack } from '@/lib/supabase/types';

/**
 * Helper to get user_id from session token in request
 */
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const token = getSessionTokenFromRequest(request);
  if (!token) return null;
  
  const sessionData = await getSessionWithUser(token);
  return sessionData?.user.id ?? null;
}

/**
 * GET /api/playlists - Get playlists for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    
    // Get playlists filtered by user_id (if available)
    const playlists = await getPlaylists(userId ?? undefined);
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

    // Get user_id from session (if available)
    const userId = await getUserIdFromRequest(request);
    
    const isSingleTrack = trackCount === 1;
    const truncatedPrompt = prompt.slice(0, 50) + (prompt.length > 50 ? '...' : '');

    // Create playlist data with user_id
    const playlistData: InsertPlaylist = {
      user_id: userId,
      name: truncatedPrompt,
      prompt,
      genre: genre || null,
      mood: mood || null,
      status: 'generating',
    };

    // Create track data
    const tracksData: Omit<InsertTrack, 'playlist_id'>[] = Array.from(
      { length: trackCount },
      (_, i) => ({
        title: isSingleTrack ? truncatedPrompt : `Track ${i + 1}`,
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

