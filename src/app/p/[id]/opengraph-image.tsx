import { ImageResponse } from 'next/og';
import { getPlaylistById } from '@/lib/supabase/database';

// Use nodejs runtime for database access (edge doesn't support cookies())
export const runtime = 'nodejs';

export const alt = 'Playlist - Hyde';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let playlistName = 'Playlist';
  let trackCount = 0;
  let genre = '';
  let mood = '';

  try {
    const playlist = await getPlaylistById(id);
    if (playlist) {
      playlistName = playlist.name;
      trackCount = playlist.tracks?.filter(t => t.status === 'ready').length || 0;
      genre = playlist.genre || '';
      mood = playlist.mood || '';
    }
  } catch (error) {
    console.error('Error fetching playlist for OG image:', error);
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#141414',
          backgroundImage: 'radial-gradient(ellipse at 30% 20%, rgba(138, 43, 226, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(80, 161, 255, 0.3) 0%, transparent 50%)',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            position: 'absolute',
            top: 40,
            left: 48,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #50A1FF 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <span style={{ fontSize: 28, fontWeight: 700, color: 'white' }}>Hyde</span>
        </div>

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 48,
          }}
        >
          {/* Playlist Art */}
          <div
            style={{
              width: 280,
              height: 280,
              borderRadius: 24,
              background: 'linear-gradient(135deg, #8B5CF6 0%, #50A1FF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
            }}
          >
            <svg width="120" height="120" viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>

          {/* Playlist Info */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxWidth: 500,
            }}
          >
            <span
              style={{
                fontSize: 20,
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: 2,
              }}
            >
              Playlist
            </span>
            <span
              style={{
                fontSize: 52,
                fontWeight: 700,
                color: 'white',
                lineHeight: 1.1,
                marginBottom: 16,
              }}
            >
              {playlistName.length > 30 ? playlistName.substring(0, 30) + '...' : playlistName}
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: 22,
              }}
            >
              <span>{trackCount} {trackCount === 1 ? 'track' : 'tracks'}</span>
              {genre && (
                <>
                  <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>•</span>
                  <span>{genre}</span>
                </>
              )}
              {mood && (
                <>
                  <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>•</span>
                  <span>{mood}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom text */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: 18,
          }}
        >
          AI-generated music • hyde.ai
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
