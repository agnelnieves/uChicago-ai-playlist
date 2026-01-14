# 🎵 Features Guide

Detailed documentation for all features in the AI Playlist Generator.

---

## Table of Contents

- [Music Generation](#-music-generation)
- [Cover Art Generation](#-cover-art-generation)
- [Audio Player](#-audio-player)
- [Discover Page](#-discover-page)
- [Sharing & URLs](#-sharing--urls)
- [Session Management](#-session-management)

---

## 🎼 Music Generation

The core feature of the app is AI-powered music generation using ElevenLabs Eleven Music API.

### How It Works

1. **User Input**: Enter a natural language prompt describing the music you want
2. **Optional Filters**: Select a genre and/or mood to guide the AI
3. **Mode Selection**: Choose between single track or playlist (3 tracks)
4. **Generation**: The API creates original, instrumental music based on your prompt
5. **Storage**: Audio files are uploaded to Supabase Storage for persistence

### Prompt Examples

| Prompt | Result |
|--------|--------|
| "Classical music for studying" | Calm, focused classical piece |
| "Upbeat electronic tracks for a morning workout" | Energetic EDM-style track |
| "Chill lo-fi beats for a rainy afternoon" | Relaxing lo-fi hip-hop |
| "Epic cinematic music for creative writing" | Dramatic orchestral piece |

### Generation Modes

#### Single Track Mode
- Generates **1 track** (60 seconds)
- Best for quick, focused music needs
- Faster generation time

#### Playlist Mode
- Generates **3 tracks** (60 seconds each)
- Each track has subtle variations
- Creates a cohesive listening experience
- Variations include:
  - Original interpretation
  - Intro buildup version
  - Dynamic changes version

### Technical Details

```typescript
// Track generation request
POST /api/generate-track
{
  prompt: string;        // Natural language description
  duration?: number;     // 10-300 seconds (default: 60)
  instrumental?: boolean; // Always true for this app
}

// Response
{
  audioUrl: string;      // Supabase storage URL
  duration: number;
  prompt: string;
}
```

### Supported Genres

| Genre | Best For |
|-------|----------|
| Pop | Catchy, mainstream vibes |
| Rock | Guitar-driven energy |
| Electronic | EDM, synths, beats |
| Jazz | Smooth, improvisational |
| Classical | Orchestral, piano |
| Hip Hop | Urban beats, rhythmic |
| Ambient | Background, atmospheric |
| Cinematic | Film score, dramatic |
| Lo-Fi | Chill, relaxed study music |
| R&B | Soulful, smooth |
| Country | Acoustic, storytelling |
| Folk | Organic, acoustic |

### Supported Moods

| Mood | Emoji | Description |
|------|-------|-------------|
| Happy | 😊 | Uplifting, joyful |
| Melancholic | 😢 | Sad, emotional |
| Energetic | ⚡ | High-energy, pumping |
| Calm | 😌 | Relaxing, peaceful |
| Romantic | 💕 | Love, affection |
| Mysterious | 🌙 | Intriguing, suspenseful |
| Epic | 🔥 | Grand, powerful |
| Nostalgic | 📼 | Retro, memory-evoking |
| Dark | 🖤 | Intense, brooding |
| Uplifting | ✨ | Inspiring, hopeful |

---

## 🎨 Cover Art Generation

Every track and playlist automatically receives AI-generated cover art.

### How It Works

1. **Prompt Processing**: The music prompt is enhanced for visual generation
2. **Style Guide**: A consistent aesthetic is applied (neon, dark, vibrant)
3. **Generation**: Google Gemini creates the image
4. **Upload**: Images are stored in Supabase Storage

### Image Types

#### Playlist Covers
- Square aspect ratio (1:1)
- Full album art style
- More detailed and artistic
- Used on playlist detail pages and discover feed

#### Track Thumbnails
- Smaller, optimized for lists
- Consistent with playlist aesthetic
- Used in track lists and player UI

### Style Characteristics

All generated images follow this style guide:
- **Theme**: Dark, moody backgrounds
- **Colors**: Purple and blue gradients, neon accents
- **Style**: Digital art, album cover aesthetic
- **Quality**: High detail, cinematic lighting

### Technical Details

```typescript
// Image generation request
POST /api/generate-image
{
  prompt: string;
  type: 'playlist_cover' | 'track_thumbnail';
  genre?: string;
  mood?: string;
}

// Response
{
  imageUrl: string;  // Supabase storage URL
  success: boolean;
}
```

---

## 🎧 Audio Player

A custom-built audio player with full playback controls.

### Features

| Feature | Description |
|---------|-------------|
| Play/Pause | Toggle playback |
| Progress Bar | Seek to any position |
| Skip Controls | Navigate between tracks |
| Volume Control | Adjust volume level |
| Download | Save track as MP3 |
| Track List | Quick track switching |

### Player Layouts

#### Desktop Layout
- Full-width bottom bar
- All controls visible
- Volume slider
- Track info with artwork

#### Mobile Layout
- Compact design
- Essential controls only
- Touch-friendly buttons
- Swipe-friendly progress bar

### Implementation

The player uses the HTML5 `<audio>` element with React state management:

```typescript
// Key features
const [isPlaying, setIsPlaying] = useState(false);
const [progress, setProgress] = useState(0);
const [duration, setDuration] = useState(0);
const [volume, setVolume] = useState(1);
const audioRef = useRef<HTMLAudioElement>(null);
```

### Download Feature

Users can download tracks as MP3 files:

```typescript
const handleDownload = async (track: Track) => {
  const response = await fetch(track.audioUrl);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  // Trigger download...
};
```

---

## 🌐 Discover Page

Browse community-generated music and playlists.

### Sections

#### New Songs
- Horizontally scrolling track cards
- Latest AI-generated tracks
- Shows title, genre, mood, and duration
- Click to play or view details

#### Featured Playlists
- Grid layout of playlist covers
- Shows playlist name and track count
- Click to view full playlist

### Caching

The discover page implements smart caching:

```typescript
// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

// Caches both tracks and playlists
interface DiscoverCache {
  recentTracks: DbTrack[];
  featuredPlaylists: DbPlaylistWithTracks[];
  timestamp: number;
}
```

### Loading States

- **Skeleton UI**: Shows placeholder content while loading
- **Inline Refresh**: Subtle spinner when refreshing cached data
- **Empty State**: Friendly message when no content exists

---

## 🔗 Sharing & URLs

Every track and playlist gets a unique, shareable URL.

### URL Structure

| Type | Format | Example |
|------|--------|---------|
| Track | `/t/[uuid]` | `/t/a1b2c3d4-e5f6-...` |
| Playlist | `/p/[uuid]` | `/p/x9y8z7w6-v5u4-...` |

### Share Features

1. **Copy Link Button**: One-click copy to clipboard
2. **Social Meta Tags**: OpenGraph images for social sharing
3. **Direct Links**: URLs work for anyone, no login required

### OpenGraph Images

Dynamic OG images are generated for social sharing:

```typescript
// src/app/p/[id]/opengraph-image.tsx
export default async function Image({ params }) {
  // Generates a custom preview image for each playlist
}
```

---

## 👤 Session Management

Anonymous user tracking for associating content with users.

### How Sessions Work

1. **First Visit**: Session API creates a new user (based on IP hash) and session
2. **Cookie Storage**: Session token stored in browser cookie
3. **Return Visits**: Existing session validated and updated
4. **Content Association**: Playlists/tracks linked to user ID

### Privacy Considerations

- **No PII**: Only IP hash stored (not actual IP)
- **Anonymous**: No login or email required
- **Session-Based**: Content linked to browser session

### Technical Implementation

```typescript
// Session creation
POST /api/session
{
  // No body required - uses request headers
}

// Response
{
  success: boolean;
  user: { id: string; createdAt: string };
  session: { id: string; createdAt: string };
  isNewSession: boolean;
}
```

---

## 🔄 Generation Flow

Complete flow from prompt to playable music:

```
┌──────────────────┐
│  User enters     │
│  prompt + mood   │
│  + genre         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Create playlist │
│  record in DB    │
│  (pending status)│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│  Generate cover  │     │  Generate tracks │
│  image (async)   │     │  (sequential)    │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         │                        ▼
         │               ┌──────────────────┐
         │               │  For each track: │
         │               │  1. Generate MP3 │
         │               │  2. Generate art │
         │               │  3. Upload both  │
         │               │  4. Update DB    │
         │               └────────┬─────────┘
         │                        │
         ▼                        ▼
┌────────────────────────────────────────────┐
│          Playlist Ready                    │
│  - All tracks playable                     │
│  - Cover image displayed                   │
│  - Shareable URL available                 │
└────────────────────────────────────────────┘
```

---

## 🎛️ UI Components

### PlaylistForm
The main input component for music generation.

**Features:**
- Expandable text area for prompts
- Genre dropdown (12 options)
- Mood dropdown with emojis (10 options)
- Mode toggle (Track/Playlist)
- Random prompt button (dice icon)
- Suggestion chips for quick prompts

### GenerationToast
Floating progress indicator during generation.

**States:**
- Generating: Shows spinner with track progress
- Completed: Shows success with link to view
- Error: Shows error message with retry option

### PlaylistPlayer
Bottom-anchored audio player.

**Layouts:**
- Mobile: Compact, essential controls
- Desktop: Full controls with volume slider

---

## 📱 Responsive Design

The app is fully responsive with breakpoints:

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 640px | Stacked layouts, compact player |
| Tablet | 640px - 1024px | Mixed layouts, full player |
| Desktop | > 1024px | Side-by-side, full features |

---

## ⚡ Performance

### Optimizations

1. **Lazy Loading**: Images loaded on demand
2. **Caching**: Discover page cached for 5 minutes
3. **Streaming**: Audio streams from Supabase CDN
4. **Code Splitting**: Next.js automatic code splitting
5. **Optimistic UI**: UI updates before API confirms

### Generation Times

| Item | Typical Time |
|------|--------------|
| Single Track | 30-60 seconds |
| Playlist (3 tracks) | 2-3 minutes |
| Cover Image | 5-10 seconds |
| Track Thumbnail | 5-10 seconds |

---

<p align="center">
  For API documentation, see <a href="./API.md">API.md</a>
</p>

