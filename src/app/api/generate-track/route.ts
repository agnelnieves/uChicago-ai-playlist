import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 300; // 5 minutes max for music generation

// Create a Supabase client for storage operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface GenerateTrackBody {
  prompt: string;
  duration?: number;
  instrumental?: boolean;
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
    
    const body: GenerateTrackBody = await request.json();
    const { prompt, duration = 60, instrumental = true } = body;
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }
    
    // Build the full prompt
    let fullPrompt = prompt;
    if (instrumental) {
      fullPrompt += ' Instrumental only, no vocals.';
    }
    
    const client = new ElevenLabsClient({ apiKey });
    
    // Generate music using ElevenLabs Music API
    // Duration is in milliseconds, clamp between 10-300 seconds (10000-300000 ms)
    const musicLengthMs = Math.min(Math.max(duration, 10), 300) * 1000;
    
    const audioStream = await client.music.compose({
      prompt: fullPrompt,
      musicLengthMs,
    });
    
    // Collect audio chunks into a buffer using ReadableStream API
    const reader = audioStream.getReader();
    const chunks: Uint8Array[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    
    // Combine chunks into a single buffer
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const audioBuffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      audioBuffer.set(chunk, offset);
      offset += chunk.length;
    }
    
    // Upload to Supabase Storage
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filePath = `tracks/${timestamp}-${randomSuffix}.mp3`;
    
    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(filePath, audioBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
        upsert: false,
      });
    
    if (uploadError) {
      console.error('Failed to upload audio to storage:', uploadError);
      // Fallback to base64 if storage upload fails
      const base64Audio = Buffer.from(audioBuffer).toString('base64');
      return NextResponse.json({
        audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
        duration,
        prompt: fullPrompt,
        storageError: uploadError.message,
      });
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('audio')
      .getPublicUrl(filePath);
    
    return NextResponse.json({
      audioUrl: publicUrlData.publicUrl,
      duration,
      prompt: fullPrompt,
    });
  } catch (error) {
    console.error('Error generating track:', error);
    
    // Handle ElevenLabs specific errors
    if (error && typeof error === 'object' && 'body' in error) {
      const elevenLabsError = error as { body?: { detail?: { status?: string; data?: { prompt_suggestion?: string } } } };
      if (elevenLabsError.body?.detail?.status === 'bad_prompt') {
        const suggestion = elevenLabsError.body.detail.data?.prompt_suggestion;
        return NextResponse.json(
          { 
            error: 'Prompt contains copyrighted material',
            suggestion 
          },
          { status: 400 }
        );
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to generate track: ${errorMessage}` },
      { status: 500 }
    );
  }
}

