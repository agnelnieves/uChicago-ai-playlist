import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { buildMusicPrompt } from '@/lib/elevenlabs';

export const maxDuration = 300; // 5 minutes max

interface GeneratePlaylistBody {
  prompt: string;
  genre?: string;
  mood?: string;
  trackCount?: number;
  trackDuration?: number;
  instrumental?: boolean;
}

interface TrackResult {
  index: number;
  audioUrl: string | null;
  prompt: string;
  error?: string;
}

/**
 * Convert an async iterable stream to a base64 data URL
 */
async function streamToDataUrl(stream: AsyncIterable<Uint8Array>): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  
  // Calculate total length
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }
  
  // Convert to base64
  const base64 = Buffer.from(combined).toString('base64');
  return `data:audio/mpeg;base64,${base64}`;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }
    
    const body: GeneratePlaylistBody = await request.json();
    const {
      prompt,
      genre,
      mood,
      trackCount = 3,
      trackDuration = 60,
      instrumental = true,
    } = body;
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }
    
    const client = new ElevenLabsClient({ apiKey });
    
    // Generate variations of the prompt for each track
    const trackPrompts = generateTrackVariations(prompt, genre, mood, trackCount, instrumental);
    
    // Generate all tracks
    const results: TrackResult[] = [];
    
    for (let i = 0; i < trackPrompts.length; i++) {
      try {
        // Use music.compose() which returns an audio stream
        const audioStream = await client.music.compose({
          prompt: trackPrompts[i],
          musicLengthMs: Math.min(Math.max(trackDuration, 10), 300) * 1000,
        });
        
        // Convert stream to base64 data URL
        const audioUrl = await streamToDataUrl(audioStream);
        
        results.push({
          index: i,
          audioUrl,
          prompt: trackPrompts[i],
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          index: i,
          audioUrl: null,
          prompt: trackPrompts[i],
          error: errorMessage,
        });
      }
    }
    
    return NextResponse.json({
      tracks: results,
      totalTracks: trackCount,
      successfulTracks: results.filter(r => r.audioUrl).length,
    });
  } catch (error) {
    console.error('Error generating playlist:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to generate playlist: ${errorMessage}` },
      { status: 500 }
    );
  }
}

function generateTrackVariations(
  basePrompt: string,
  genre?: string,
  mood?: string,
  count: number = 3,
  instrumental: boolean = true
): string[] {
  const variations = [
    '', // Original
    'with an intro buildup,',
    'with a different arrangement,',
    'with more energy,',
    'with a softer feel,',
    'with dynamic changes,',
    'with a bridge section,',
    'building to a climax,',
  ];
  
  const prompts: string[] = [];
  
  for (let i = 0; i < count; i++) {
    let trackPrompt = buildMusicPrompt(basePrompt, genre, mood);
    
    // Add variation
    const variation = variations[i % variations.length];
    if (variation) {
      trackPrompt = `Track ${i + 1}: ${trackPrompt} ${variation}`;
    } else {
      trackPrompt = `Track ${i + 1}: ${trackPrompt}`;
    }
    
    if (instrumental) {
      trackPrompt += ' Instrumental only, no vocals.';
    }
    
    prompts.push(trackPrompt);
  }
  
  return prompts;
}

