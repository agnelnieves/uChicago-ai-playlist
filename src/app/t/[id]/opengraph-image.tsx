import { ImageResponse } from 'next/og';
import { getTrackById } from '@/lib/supabase/database';

// Use nodejs runtime for database access (edge doesn't support cookies())
export const runtime = 'nodejs';

export const alt = 'Track - Hyde';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let trackTitle = 'Track';
  let genre = '';
  let mood = '';
  let duration = 0;

  try {
    const track = await getTrackById(id);
    if (track) {
      trackTitle = track.title;
      genre = track.genre || '';
      mood = track.mood || '';
      duration = track.duration;
    }
  } catch (error) {
    console.error('Error fetching track for OG image:', error);
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
          backgroundImage: 'radial-gradient(ellipse at 50% 30%, rgba(80, 161, 255, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(138, 43, 226, 0.25) 0%, transparent 50%)',
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
          {/* Track Art */}
          <div
            style={{
              width: 300,
              height: 300,
              borderRadius: 24,
              background: 'linear-gradient(135deg, #50A1FF 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
              position: 'relative',
            }}
          >
            <svg width="100" height="100" viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
            
            {/* Play button overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>

          {/* Track Info */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxWidth: 480,
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
              Track
            </span>
            <span
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: 'white',
                lineHeight: 1.1,
                marginBottom: 16,
              }}
            >
              {trackTitle.length > 35 ? trackTitle.substring(0, 35) + '...' : trackTitle}
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
              {duration > 0 && <span>{formatDuration(duration)}</span>}
              {duration > 0 && (genre || mood) && (
                <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>•</span>
              )}
              {genre && <span>{genre}</span>}
              {genre && mood && (
                <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>•</span>
              )}
              {mood && <span>{mood}</span>}
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
