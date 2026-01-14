# 🎵 AI Playlist Generator

An AI-powered music generation application that creates original tracks and playlists using ElevenLabs Eleven Music API. Built with Next.js 16, React 19, and Supabase.

![AI Playlist Generator](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat-square&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase)

---

## 📚 Workshop Information

This project was created for the **University of Chicago Vibe Coding Workshop** taught by [Agnel Nieves](https://agnelnieves.com).

The workshop explores building modern AI-powered web applications using the latest frontend technologies and AI APIs. This project demonstrates how to integrate multiple AI services (ElevenLabs for music, Google Gemini for images) into a cohesive, production-ready application.

---

## ✨ Features

### 🎼 AI Music Generation
Generate original, AI-composed music tracks using natural language prompts. Simply describe what you want to hear, and the app creates unique instrumental tracks.

### 📋 Single Track or Playlist Mode
- **Single Track**: Generate one focused track based on your prompt
- **Playlist Mode**: Create a cohesive playlist of 3 tracks with variations

### 🎨 AI-Generated Cover Art
Each track and playlist automatically receives a unique, AI-generated cover image created by Google Gemini's image generation model.

### 🎛️ Genre & Mood Selection
Fine-tune your music with predefined genres and moods:
- **Genres**: Pop, Rock, Electronic, Jazz, Classical, Hip Hop, Ambient, Cinematic, Lo-Fi, R&B, Country, Folk
- **Moods**: Happy, Melancholic, Energetic, Calm, Romantic, Mysterious, Epic, Nostalgic, Dark, Uplifting

### 🎧 Built-in Audio Player
- Play/Pause controls with progress bar
- Skip forward/backward between tracks
- Volume control
- Download individual tracks as MP3

### 🔗 Shareable Links
Every generated track and playlist gets a unique shareable URL for easy sharing with friends.

### 🌐 Discover Page
Browse community-generated music and playlists with a beautiful, responsive gallery interface.

### 📱 Responsive Design
Fully responsive design that works seamlessly on desktop, tablet, and mobile devices.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                         │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │ Create Page │  │ Discover Page│  │ Track/Playlist  │    │
│  │  (Form UI)  │  │  (Gallery)   │  │    Pages        │    │
│  └──────┬──────┘  └──────┬───────┘  └────────┬────────┘    │
└─────────┼────────────────┼───────────────────┼──────────────┘
          │                │                   │
          ▼                ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js API Routes                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │/api/generate-│  │/api/generate-│  │ /api/playlists│      │
│  │    track     │  │    image     │  │  /api/tracks  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘      │
└─────────┼────────────────┼───────────────────┼──────────────┘
          │                │                   │
          ▼                ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────┐
│   ElevenLabs    │ │  Google Gemini  │ │      Supabase       │
│   Eleven Music  │ │ Image Generation│ │   (DB + Storage)    │
│       API       │ │       API       │ │                     │
└─────────────────┘ └─────────────────┘ └─────────────────────┘
```

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| [Next.js](https://nextjs.org) | 16.1 | React framework with App Router |
| [React](https://react.dev) | 19 | UI library |
| [Tailwind CSS](https://tailwindcss.com) | 4.0 | Styling |
| [Supabase](https://supabase.com) | - | PostgreSQL database + file storage |
| [ElevenLabs](https://elevenlabs.io) | - | AI music generation |
| [Google Gemini](https://ai.google.dev) | - | AI image generation |
| [TypeScript](https://typescriptlang.org) | 5.x | Type safety |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- ElevenLabs API key
- Google AI API key
- Supabase project

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-playlist
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your API keys in `.env.local`:
   ```env
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   GOOGLE_AI_API_KEY=your_google_ai_api_key
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   SESSION_SECRET=your_session_secret
   ```

4. **Set up the database**
   
   Run the SQL schema in your Supabase SQL Editor:
   ```bash
   # Copy contents of supabase/schema.sql and run in Supabase SQL Editor
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Open the app**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
ai-playlist/
├── src/
│   ├── app/
│   │   ├── api/                    # API Routes
│   │   │   ├── generate-track/     # Music generation endpoint
│   │   │   ├── generate-image/     # Cover art generation
│   │   │   ├── generate-playlist/  # Playlist orchestration
│   │   │   ├── playlists/          # Playlist CRUD
│   │   │   ├── tracks/             # Track CRUD
│   │   │   ├── discover/           # Discover feed endpoint
│   │   │   └── session/            # User session management
│   │   ├── discover/               # Discover page
│   │   ├── p/[id]/                 # Individual playlist page
│   │   ├── t/[id]/                 # Individual track page
│   │   ├── page.tsx                # Home/Create page
│   │   └── layout.tsx              # Root layout
│   ├── components/
│   │   ├── PlaylistForm.tsx        # Main generation form
│   │   ├── PlaylistPlayer.tsx      # Audio player component
│   │   ├── GenerationToast.tsx     # Progress toast notification
│   │   ├── Logo.tsx                # App logo
│   │   ├── Icons.tsx               # SVG icons
│   │   └── Dropdown.tsx            # Genre/mood selector
│   ├── lib/
│   │   ├── elevenlabs.ts           # ElevenLabs client utilities
│   │   ├── GenerationContext.tsx   # Global generation state
│   │   ├── DiscoverCache.tsx       # Discover page caching
│   │   ├── storage.ts              # localStorage utilities
│   │   └── supabase/               # Supabase clients
│   └── types/
│       └── index.ts                # TypeScript interfaces
├── supabase/
│   ├── schema.sql                  # Database schema
│   └── seed.sql                    # Sample data
├── public/                         # Static assets
└── docs/                           # Additional documentation
    ├── FEATURES.md                 # Feature details
    ├── API.md                      # API documentation
    └── SETUP.md                    # Detailed setup guide
```

---

## 📖 Documentation

For more detailed documentation, see:

- **[Features Guide](./docs/FEATURES.md)** - Detailed breakdown of all features
- **[API Documentation](./docs/API.md)** - API endpoints reference
- **[Setup Guide](./docs/SETUP.md)** - Step-by-step setup instructions

---

## 🔗 Resources

### Framework & Libraries

| Resource | Description |
|----------|-------------|
| [Next.js App Router](https://nextjs.org/docs/app/getting-started/project-structure) | Project structure guide |
| [Next.js 16 Release](https://nextjs.org/blog/next-16) | What's new in Next.js 16 |
| [Next.js 16.1 Release](https://nextjs.org/blog/next-16-1) | Latest features |
| [Tailwind CSS v4](https://tailwindcss.com/docs) | CSS framework documentation |

### AI APIs

| Resource | Description |
|----------|-------------|
| [ElevenLabs Music Overview](https://elevenlabs.io/music) | Music generation product page |
| [ElevenLabs Music API](https://elevenlabs.io/docs/overview/capabilities/music) | API capabilities |
| [ElevenLabs Compose API](https://elevenlabs.io/docs/api-reference/music/compose) | Compose endpoint reference |
| [ElevenLabs Stream API](https://elevenlabs.io/docs/api-reference/music/stream) | Streaming endpoint |
| [Google AI Studio](https://aistudio.google.com/api-keys) | Get your Gemini API key |

### Database & Backend

| Resource | Description |
|----------|-------------|
| [Supabase Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) | Next.js integration |
| [Supabase Auth](https://supabase.com/docs/guides/auth/quickstarts/nextjs) | Authentication guide |

### Development Tools

| Resource | Description |
|----------|-------------|
| [ShadCN UI MCP](https://ui.shadcn.com/docs/mcp) | UI component system |
| [Anthropic Skills](https://github.com/anthropics/skills) | AI coding skills |
| [Figma Design Reference](https://www.figma.com/design/juJhmoPLNaDfC3VDOAvszG/UChicago---Vibe-Coding-Workshop-2) | UI/UX design file |

---

## 🔑 API Keys

You'll need the following API keys:

1. **ElevenLabs API Key**
   - Sign up at [elevenlabs.io](https://elevenlabs.io)
   - Navigate to Settings → API Keys
   - Create a new API key

2. **Google AI API Key**
   - Visit [Google AI Studio](https://aistudio.google.com/api-keys)
   - Create a new API key

3. **Supabase Keys**
   - Create a project at [supabase.com](https://supabase.com)
   - Go to Settings → API
   - Copy the Project URL and anon/public key
   - Copy the service_role key for server operations

---

## 🎨 Design

The app features a modern, dark theme with:
- Purple and blue gradient accents
- Responsive glassmorphism effects
- Smooth animations and transitions
- Mobile-first responsive design

Design reference: [Figma File](https://www.figma.com/design/juJhmoPLNaDfC3VDOAvszG/UChicago---Vibe-Coding-Workshop-2)

---

## 📜 Scripts

```bash
# Development
pnpm dev          # Start development server

# Production
pnpm build        # Build for production
pnpm start        # Start production server

# Code Quality
pnpm lint         # Run ESLint
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍🏫 Workshop Instructor

**Agnel Nieves**
- Website: [agnelnieves.com](https://agnelnieves.com)
- Workshop: University of Chicago Vibe Coding Workshop

---

<p align="center">
  Made with ❤️ for the University of Chicago Vibe Coding Workshop
</p>
