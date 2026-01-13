import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY || '' });

// Create a Supabase client for storage operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

// Check if error is transient (network issues, 5xx errors)
function isTransientError(errorMessage: string): boolean {
  return (
    errorMessage.includes('fetch failed') ||
    errorMessage.includes('ECONNRESET') ||
    errorMessage.includes('socket') ||
    errorMessage.includes('UND_ERR') ||
    errorMessage.includes('<!DOCTYPE') ||
    errorMessage.includes('500') ||
    errorMessage.includes('502') ||
    errorMessage.includes('503') ||
    errorMessage.includes('504') ||
    errorMessage.includes('Internal server error') ||
    errorMessage.includes('Connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('other side closed')
  );
}

// Retry helper for transient failures
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 4,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: unknown = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorMessage = getErrorMessage(error);
      const isTransient = isTransientError(errorMessage);
      
      console.log(`Storage upload attempt ${attempt + 1}/${maxRetries} failed:`, 
        errorMessage.substring(0, 200) + (errorMessage.length > 200 ? '...' : ''));
      
      if (!isTransient || attempt === maxRetries - 1) {
        throw error instanceof Error ? error : new Error(errorMessage);
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`Retrying storage upload in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  const errorMessage = getErrorMessage(lastError);
  throw new Error(errorMessage);
}

interface GenerateImageRequest {
  prompt: string;
  type: 'playlist_cover' | 'track_thumbnail';
  genre?: string;
  mood?: string;
}

/**
 * POST /api/generate-image - Generate an image using Google Gemini
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerateImageRequest = await request.json();
    const { prompt, type, genre, mood } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'Google AI API key not configured' },
        { status: 500 }
      );
    }

    // Build an enhanced prompt for better image generation
    const enhancedPrompt = buildImagePrompt(prompt, type, genre, mood);

    // Generate image using Gemini with image generation capability
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp-image-generation',
      contents: enhancedPrompt,
      config: {
        responseModalities: ['Text', 'Image'],
      },
    });

    // Extract image from response
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0) {
      return NextResponse.json(
        { error: 'No image generated' },
        { status: 500 }
      );
    }

    // Find the image part in the response
    for (const part of parts) {
      if (part.inlineData?.data) {
        const base64Data = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        
        // Convert base64 to buffer for upload
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique file path
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const extension = mimeType.split('/')[1] || 'png';
        const folder = type === 'playlist_cover' ? 'covers' : 'thumbnails';
        const filePath = `${folder}/${timestamp}-${randomSuffix}.${extension}`;
        
        // Upload to Supabase Storage with retry logic
        let uploadSuccess = false;
        let publicUrl: string | null = null;
        
        try {
          await retryWithBackoff(async () => {
            const { error: uploadError } = await supabase.storage
              .from('images')
              .upload(filePath, buffer, {
                contentType: mimeType,
                cacheControl: '3600',
                upsert: false,
              });
            
            if (uploadError) {
              throw new Error(uploadError.message);
            }
          });
          
          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);
          
          publicUrl = publicUrlData.publicUrl;
          uploadSuccess = true;
        } catch (uploadError) {
          console.error('Failed to upload image to storage after retries:', uploadError);
        }
        
        if (uploadSuccess && publicUrl) {
          return NextResponse.json({ 
            imageUrl: publicUrl,
            success: true 
          });
        }
        
        // Fallback to base64 if storage upload fails completely
        // Note: This creates a very large URL that may not work well in the database
        console.warn('Falling back to base64 image URL');
        return NextResponse.json({ 
          imageUrl: `data:${mimeType};base64,${base64Data}`,
          success: true,
          storageError: 'Upload failed after retries, using base64 fallback',
        });
      }
    }

    return NextResponse.json(
      { error: 'Failed to get image data from response' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error generating image:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to generate image: ${errorMessage}` },
      { status: 500 }
    );
  }
}

function buildImagePrompt(
  basePrompt: string, 
  type: 'playlist_cover' | 'track_thumbnail',
  genre?: string,
  mood?: string
): string {
  const styleGuide = 'Digital art, vibrant neon colors, dark moody background with purple and blue gradients, atmospheric lighting, modern aesthetic, album cover art style';
  
  const contextParts: string[] = [];
  
  if (genre) {
    contextParts.push(`${genre} music inspired`);
  }
  
  if (mood) {
    contextParts.push(`${mood} atmosphere`);
  }
  
  if (type === 'playlist_cover') {
    return `${styleGuide}. A stunning album cover artwork representing: ${basePrompt}. ${contextParts.join(', ')}. Artistic portrait or abstract visualization, cinematic quality, high detail.`;
  } else {
    return `${styleGuide}. A small album thumbnail artwork for a track about: ${basePrompt}. ${contextParts.join(', ')}. Artistic and evocative, suitable for music streaming app.`;
  }
}
