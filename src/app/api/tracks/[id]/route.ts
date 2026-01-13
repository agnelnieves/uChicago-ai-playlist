import { NextRequest, NextResponse } from 'next/server';
import { getTrackById, updateTrack, deleteTrack } from '@/lib/supabase/database';
import type { UpdateTrack } from '@/lib/supabase/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tracks/[id] - Get a track by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const track = await getTrackById(id);

    if (!track) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ track });
  } catch (error) {
    console.error('Error fetching track:', error);
    return NextResponse.json(
      { error: 'Failed to fetch track' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tracks/[id] - Update a track (e.g., after generation completes)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: UpdateTrack = await request.json();

    const track = await updateTrack(id, body);

    return NextResponse.json({ track });
  } catch (error) {
    console.error('Error updating track:', error);
    return NextResponse.json(
      { error: 'Failed to update track' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tracks/[id] - Delete a track
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await deleteTrack(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting track:', error);
    return NextResponse.json(
      { error: 'Failed to delete track' },
      { status: 500 }
    );
  }
}

