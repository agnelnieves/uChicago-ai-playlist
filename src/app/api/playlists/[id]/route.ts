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

// Retry helper for transient failures
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 500
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if error message contains HTML (Cloudflare error page)
      const errorMessage = lastError.message || '';
      const isTransient = 
        errorMessage.includes('<!DOCTYPE') ||
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('socket') ||
        errorMessage.includes('500') ||
        errorMessage.includes('Internal server error');
      
      if (!isTransient || attempt === maxRetries - 1) {
        throw lastError;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
      console.log(`Playlist update retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
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

    // Skip storing base64 image URLs - they're too large for the database
    if (body.cover_image_url?.startsWith('data:')) {
      console.warn('Skipping base64 cover_image_url storage - too large for database');
      delete body.cover_image_url;
    }

    // Use retry logic for transient failures
    const playlist = await retryWithBackoff(() => updatePlaylist(id, body));

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

