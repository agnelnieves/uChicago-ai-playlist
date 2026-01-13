import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY || '' });

interface GenerateImageRequest {
  prompt: string;
  type: 'playlist_cover' | 'track_thumbnail';
  genre?: string;
  mood?: string;
}

/**
 * POST /api/generate-image - Generate an image using Google Imagen 3
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

    // Generate image using Imagen 3
    const response = await genAI.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: enhancedPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: type === 'playlist_cover' ? '1:1' : '1:1',
      },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      return NextResponse.json(
        { error: 'No image generated' },
        { status: 500 }
      );
    }

    const generatedImage = response.generatedImages[0];
    
    // Return the base64 image data
    if (generatedImage.image?.imageBytes) {
      const base64Data = generatedImage.image.imageBytes;
      const dataUrl = `data:image/png;base64,${base64Data}`;
      
      return NextResponse.json({ 
        imageUrl: dataUrl,
        success: true 
      });
    }

    return NextResponse.json(
      { error: 'Failed to get image data' },
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
