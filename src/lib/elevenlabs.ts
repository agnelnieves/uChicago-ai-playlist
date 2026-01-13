import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

// Initialize the ElevenLabs client
export function getElevenLabsClient(): ElevenLabsClient {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY environment variable is not set');
  }
  
  return new ElevenLabsClient({
    apiKey,
  });
}

export interface MusicGenerationOptions {
  prompt: string;
  duration?: number; // in seconds, 10-300 (5 minutes max)
  instrumental?: boolean;
}

/**
 * Generate music using ElevenLabs Music API
 */
export async function generateMusic(options: MusicGenerationOptions): Promise<Blob> {
  const client = getElevenLabsClient();
  
  let fullPrompt = options.prompt;
  
  // Add instrumental flag if specified
  if (options.instrumental) {
    fullPrompt += ' Instrumental only, no vocals.';
  }
  
  try {
    // Use the music generation API
    // Duration is in milliseconds
    const musicLengthMs = (options.duration || 60) * 1000;
    
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
    
    // Combine chunks into a single buffer then create Blob
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    
    return new Blob([combined], { type: 'audio/mpeg' });
  } catch (error) {
    console.error('Error generating music:', error);
    throw error;
  }
}

/**
 * Build a comprehensive prompt for music generation
 */
export function buildMusicPrompt(
  userPrompt: string,
  genre?: string,
  mood?: string
): string {
  const parts: string[] = [];
  
  if (genre) {
    parts.push(`${genre} genre`);
  }
  
  if (mood) {
    parts.push(`${mood.toLowerCase()} mood`);
  }
  
  if (parts.length > 0) {
    return `Create a ${parts.join(', ')} track. ${userPrompt}`;
  }
  
  return userPrompt;
}

