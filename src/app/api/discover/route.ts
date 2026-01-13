import { NextResponse } from 'next/server';
import {
  getRecentTracks,
  getFeaturedPlaylists,
} from '@/lib/supabase/database';

/**
 * GET /api/discover - Get discover feed content (recent tracks and featured playlists)
 */
export async function GET() {
  try {
    // Fetch recent tracks and featured playlists in parallel
    const [recentTracks, featuredPlaylists] = await Promise.all([
      getRecentTracks(20),
      getFeaturedPlaylists(12),
    ]);

    return NextResponse.json({
      recentTracks,
      featuredPlaylists,
    });
  } catch (error) {
    console.error('Error fetching discover content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discover content' },
      { status: 500 }
    );
  }
}
