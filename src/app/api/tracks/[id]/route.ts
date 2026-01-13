import { NextRequest, NextResponse } from 'next/server';
import { getTrackById, updateTrack, deleteTrack } from '@/lib/supabase/database';
import type { UpdateTrack } from '@/lib/supabase/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Extract error message from various error formats (including Supabase errors)
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
    // Supabase errors have a message property
    if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
      return (error as { message: string }).message;
    }
    // Try to stringify the object
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

// Check if error is transient (network issues, Cloudflare errors, etc.)
function isTransientError(errorMessage: string): boolean {
  return (
    errorMessage.includes('<!DOCTYPE') ||
    errorMessage.includes('fetch failed') ||
    errorMessage.includes('ECONNRESET') ||
    errorMessage.includes('socket') ||
    errorMessage.includes('UND_ERR') ||
    errorMessage.includes('500') ||
    errorMessage.includes('502') ||
    errorMessage.includes('503') ||
    errorMessage.includes('504') ||
    errorMessage.includes('Internal server error') ||
    errorMessage.includes('Connection') ||
    errorMessage.includes('timeout')
  );
}

// Retry helper for transient failures
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 4,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorMessage = getErrorMessage(error);
      const isTransient = isTransientError(errorMessage);
      
      console.log(`Track update attempt ${attempt + 1}/${maxRetries} failed:`, 
        errorMessage.substring(0, 200) + (errorMessage.length > 200 ? '...' : ''));
      
      if (!isTransient || attempt === maxRetries - 1) {
        throw error instanceof Error ? error : new Error(errorMessage);
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`Retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  const errorMessage = getErrorMessage(lastError);
  throw new Error(errorMessage);
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

    // Skip storing base64 image URLs - they're too large for the database
    // and cause issues with Cloudflare/Supabase
    if (body.image_url?.startsWith('data:')) {
      console.warn('Skipping base64 image_url storage - too large for database');
      delete body.image_url;
    }

    // Use retry logic for transient failures
    const track = await retryWithBackoff(() => updateTrack(id, body));

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

