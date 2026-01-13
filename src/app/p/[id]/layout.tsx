import type { Metadata } from 'next';
import { getPlaylistById } from '@/lib/supabase/database';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const playlist = await getPlaylistById(id);
    
    if (!playlist) {
      return {
        title: 'Playlist Not Found',
        description: 'This playlist could not be found.',
      };
    }

    const trackCount = playlist.tracks?.filter(t => t.status === 'ready').length || 0;
    const description = `${trackCount} ${trackCount === 1 ? 'track' : 'tracks'}${playlist.genre ? ` • ${playlist.genre}` : ''}${playlist.mood ? ` • ${playlist.mood}` : ''} - AI-generated playlist on Hyde`;

    return {
      title: playlist.name,
      description,
      openGraph: {
        title: `${playlist.name} - Hyde`,
        description,
        type: 'music.playlist',
      },
      twitter: {
        title: `${playlist.name} - Hyde`,
        description,
        card: 'summary_large_image',
      },
    };
  } catch (error) {
    console.error('Error generating playlist metadata:', error);
    return {
      title: 'Playlist',
      description: 'Listen to this AI-generated playlist on Hyde.',
    };
  }
}

export default function PlaylistLayout({ children }: LayoutProps) {
  return children;
}
