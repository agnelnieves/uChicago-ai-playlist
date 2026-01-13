import { NextRequest, NextResponse } from 'next/server';
import {
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
} from '@/lib/supabase/database';
import type { UpdatePlaylist } from '@/lib/supabase/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/playlists/[id] - Get a playlist by ID with tracks
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const playlist = await getPlaylistById(id);

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ playlist });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/playlists/[id] - Update a playlist
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: UpdatePlaylist = await request.json();

    const playlist = await updatePlaylist(id, body);

    return NextResponse.json({ playlist });
  } catch (error) {
    console.error('Error updating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to update playlist' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/playlists/[id] - Delete a playlist
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await deletePlaylist(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return NextResponse.json(
      { error: 'Failed to delete playlist' },
      { status: 500 }
    );
  }
}

