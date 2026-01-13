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
    
    // Collect audio chunks into a buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    
    // Combine chunks into a single Blob
    return new Blob(chunks, { type: 'audio/mpeg' });
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

