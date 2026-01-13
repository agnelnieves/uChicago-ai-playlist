import type { Metadata } from 'next';
import { getTrackById } from '@/lib/supabase/database';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const track = await getTrackById(id);
    
    if (!track) {
      return {
        title: 'Track Not Found',
        description: 'This track could not be found.',
      };
    }

    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const duration = formatDuration(track.duration);
    const description = `${duration}${track.genre ? ` • ${track.genre}` : ''}${track.mood ? ` • ${track.mood}` : ''} - AI-generated track on Hyde`;

    return {
      title: track.title,
      description,
      openGraph: {
        title: `${track.title} - Hyde`,
        description,
        type: 'music.song',
        audio: track.audio_url ? [{ url: track.audio_url }] : undefined,
      },
      twitter: {
        title: `${track.title} - Hyde`,
        description,
        card: 'summary_large_image',
      },
    };
  } catch (error) {
    console.error('Error generating track metadata:', error);
    return {
      title: 'Track',
      description: 'Listen to this AI-generated track on Hyde.',
    };
  }
}

export default function TrackLayout({ children }: LayoutProps) {
  return children;
}
