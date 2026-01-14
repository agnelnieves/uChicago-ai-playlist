# 🔌 API Documentation

Complete reference for all API endpoints in the AI Playlist Generator.

---

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

---

## Table of Contents

- [Generate Track](#generate-track)
- [Generate Playlist](#generate-playlist)
- [Generate Image](#generate-image)
- [Playlists](#playlists)
- [Tracks](#tracks)
- [Discover](#discover)
- [Session](#session)

---

## Generate Track

Generate a single AI music track.

### `POST /api/generate-track`

Creates an original AI-generated music track using ElevenLabs Eleven Music API.

**Request Body:**

```json
{
  "prompt": "Upbeat electronic dance music with energetic beats",
  "duration": 60,
  "instrumental": true
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `prompt` | string | ✅ | - | Natural language description of the music |
| `duration` | number | ❌ | 60 | Track length in seconds (10-300) |
| `instrumental` | boolean | ❌ | true | Generate without vocals |

**Response (200):**

```json
{
  "audioUrl": "https://your-project.supabase.co/storage/v1/object/public/audio/tracks/...",
  "duration": 60,
  "prompt": "Upbeat electronic dance music with energetic beats. Instrumental only, no vocals."
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `Prompt is required` | Missing prompt field |
| 400 | `Prompt contains copyrighted material` | Copyright detection |
| 500 | `ElevenLabs API key not configured` | Missing API key |
| 500 | `Failed to generate track` | Generation failed |

**Example:**

```typescript
const response = await fetch('/api/generate-track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Chill lo-fi beats for studying',
    duration: 120,
    instrumental: true,
  }),
});

const { audioUrl } = await response.json();
```

---

## Generate Playlist

Generate multiple tracks as a cohesive playlist.

### `POST /api/generate-playlist`

Creates multiple AI-generated tracks with variations.

**Request Body:**

```json
{
  "prompt": "Relaxing ambient music for meditation",
  "genre": "Ambient",
  "mood": "Calm",
  "trackCount": 3,
  "trackDuration": 60,
  "instrumental": true
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `prompt` | string | ✅ | - | Base description for all tracks |
| `genre` | string | ❌ | - | Music genre |
| `mood` | string | ❌ | - | Emotional mood |
| `trackCount` | number | ❌ | 3 | Number of tracks (1-5) |
| `trackDuration` | number | ❌ | 60 | Duration per track in seconds |
| `instrumental` | boolean | ❌ | true | Generate without vocals |

**Response (200):**

```json
{
  "tracks": [
    {
      "index": 0,
      "audioUrl": "data:audio/mpeg;base64,...",
      "prompt": "Track 1: Relaxing ambient music..."
    },
    {
      "index": 1,
      "audioUrl": "data:audio/mpeg;base64,...",
      "prompt": "Track 2: Relaxing ambient music with an intro buildup..."
    }
  ],
  "totalTracks": 3,
  "successfulTracks": 2
}
```

---

## Generate Image

Generate AI cover art for tracks or playlists.

### `POST /api/generate-image`

Creates cover art using Google Gemini's image generation.

**Request Body:**

```json
{
  "prompt": "Electronic dance music with neon vibes",
  "type": "playlist_cover",
  "genre": "Electronic",
  "mood": "Energetic"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | ✅ | Description for image generation |
| `type` | string | ✅ | `playlist_cover` or `track_thumbnail` |
| `genre` | string | ❌ | Influences visual style |
| `mood` | string | ❌ | Influences color/atmosphere |

**Response (200):**

```json
{
  "imageUrl": "https://your-project.supabase.co/storage/v1/object/public/images/covers/...",
  "success": true
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `Prompt is required` | Missing prompt |
| 500 | `Google AI API key not configured` | Missing API key |
| 500 | `No image generated` | Generation failed |

---

## Playlists

CRUD operations for playlists.

### `POST /api/playlists`

Create a new playlist with pending tracks.

**Request Body:**

```json
{
  "prompt": "Jazz music for a dinner party",
  "genre": "Jazz",
  "mood": "Romantic",
  "trackCount": 3,
  "trackDuration": 60
}
```

**Response (201):**

```json
{
  "playlist": {
    "id": "uuid",
    "name": "Jazz music for a dinner party",
    "prompt": "Jazz music for a dinner party",
    "genre": "Jazz",
    "mood": "Romantic",
    "status": "pending",
    "tracks": [
      { "id": "uuid", "title": "Track 1", "status": "pending", ... },
      { "id": "uuid", "title": "Track 2", "status": "pending", ... },
      { "id": "uuid", "title": "Track 3", "status": "pending", ... }
    ]
  }
}
```

---

### `GET /api/playlists/[id]`

Retrieve a specific playlist with all tracks.

**Response (200):**

```json
{
  "playlist": {
    "id": "uuid",
    "name": "Jazz music for a dinner party",
    "description": null,
    "prompt": "Jazz music for a dinner party",
    "genre": "Jazz",
    "mood": "Romantic",
    "cover_image_url": "https://...",
    "status": "ready",
    "created_at": "2025-01-14T12:00:00Z",
    "updated_at": "2025-01-14T12:05:00Z",
    "tracks": [...]
  }
}
```

**Error Response (404):**

```json
{
  "error": "Playlist not found"
}
```

---

### `PATCH /api/playlists/[id]`

Update playlist fields.

**Request Body:**

```json
{
  "status": "ready",
  "cover_image_url": "https://..."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Playlist name |
| `description` | string | Description text |
| `status` | string | `pending`, `generating`, `ready`, `partial`, `error` |
| `cover_image_url` | string | Cover image URL |

**Response (200):**

```json
{
  "playlist": { ... }
}
```

---

### `DELETE /api/playlists/[id]`

Delete a playlist and all associated tracks.

**Response (200):**

```json
{
  "success": true
}
```

---

## Tracks

CRUD operations for individual tracks.

### `GET /api/tracks/[id]`

Retrieve a specific track.

**Response (200):**

```json
{
  "track": {
    "id": "uuid",
    "title": "Track 1",
    "artist": null,
    "prompt": "Jazz music for a dinner party",
    "genre": "Jazz",
    "mood": "Romantic",
    "duration": 60,
    "audio_url": "https://...",
    "image_url": "https://...",
    "status": "ready",
    "error": null,
    "track_order": 0,
    "created_at": "2025-01-14T12:00:00Z"
  }
}
```

---

### `PATCH /api/tracks/[id]`

Update track fields.

**Request Body:**

```json
{
  "status": "ready",
  "audio_url": "https://...",
  "image_url": "https://..."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Track title |
| `audio_url` | string | Audio file URL |
| `image_url` | string | Thumbnail URL |
| `status` | string | `pending`, `generating`, `ready`, `error` |
| `error` | string | Error message if failed |

---

## Discover

Fetch content for the discover page.

### `GET /api/discover`

Retrieve recent tracks and featured playlists.

**Response (200):**

```json
{
  "recentTracks": [
    {
      "id": "uuid",
      "title": "Chill Vibes",
      "genre": "Lo-Fi",
      "mood": "Calm",
      "duration": 60,
      "audio_url": "https://...",
      "image_url": "https://...",
      "created_at": "2025-01-14T12:00:00Z"
    }
  ],
  "featuredPlaylists": [
    {
      "id": "uuid",
      "name": "Study Session",
      "cover_image_url": "https://...",
      "tracks": [...]
    }
  ]
}
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `trackLimit` | number | 10 | Max recent tracks |
| `playlistLimit` | number | 12 | Max playlists |

---

## Session

Anonymous user session management.

### `POST /api/session`

Create or validate a user session.

**Request Headers:**

The session uses the following headers for user identification:
- `x-forwarded-for` or `x-real-ip` for IP-based user hashing
- `cookie` for existing session token

**Response (200) - New Session:**

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "createdAt": "2025-01-14T12:00:00Z"
  },
  "session": {
    "id": "uuid",
    "createdAt": "2025-01-14T12:00:00Z"
  },
  "isNewSession": true
}
```

**Response (200) - Existing Session:**

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "createdAt": "2025-01-14T10:00:00Z"
  },
  "session": {
    "id": "uuid",
    "createdAt": "2025-01-14T10:00:00Z"
  },
  "isNewSession": false
}
```

**Set-Cookie Header:**

```
session_token=<token>; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000
```

---

## Error Handling

All endpoints follow consistent error formatting:

```json
{
  "error": "Human-readable error message",
  "details": "Optional additional details"
}
```

### Common Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Rate Limits

The app uses external API rate limits:

| API | Limit | Notes |
|-----|-------|-------|
| ElevenLabs | Varies by plan | Check your ElevenLabs dashboard |
| Google Gemini | Varies by plan | Check Google AI Studio |
| Supabase | Generous free tier | Check Supabase dashboard |

---

## TypeScript Types

```typescript
// Track status
type TrackStatus = 'pending' | 'generating' | 'ready' | 'error';

// Playlist status
type PlaylistStatus = 'pending' | 'generating' | 'ready' | 'partial' | 'error';

// Genres
type Genre = 'Pop' | 'Rock' | 'Electronic' | 'Jazz' | 'Classical' | 
             'Hip Hop' | 'Ambient' | 'Cinematic' | 'Lo-Fi' | 
             'R&B' | 'Country' | 'Folk';

// Moods
type Mood = 'Happy' | 'Melancholic' | 'Energetic' | 'Calm' | 
            'Romantic' | 'Mysterious' | 'Epic' | 'Nostalgic' | 
            'Dark' | 'Uplifting';
```

---

<p align="center">
  For setup instructions, see <a href="./SETUP.md">SETUP.md</a>
</p>

