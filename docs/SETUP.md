# 🛠️ Setup Guide

Complete step-by-step instructions for setting up the AI Playlist Generator.

---

## Prerequisites

Before starting, ensure you have:

- **Node.js 18+** - [Download](https://nodejs.org)
- **pnpm** (recommended) - `npm install -g pnpm`
- **Git** - [Download](https://git-scm.com)
- A code editor (VS Code recommended)

---

## Table of Contents

1. [Clone & Install](#1-clone--install)
2. [ElevenLabs Setup](#2-elevenlabs-setup)
3. [Google AI Setup](#3-google-ai-setup)
4. [Supabase Setup](#4-supabase-setup)
5. [Environment Configuration](#5-environment-configuration)
6. [Database Setup](#6-database-setup)
7. [Run the App](#7-run-the-app)
8. [Troubleshooting](#troubleshooting)

---

## 1. Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd ai-playlist

# Install dependencies
pnpm install
```

If you prefer npm:
```bash
npm install
```

---

## 2. ElevenLabs Setup

ElevenLabs provides the AI music generation API.

### Step 2.1: Create an Account

1. Go to [elevenlabs.io](https://elevenlabs.io)
2. Click "Sign Up" and create an account
3. Verify your email address

### Step 2.2: Get Your API Key

1. After signing in, go to **Settings** (click your profile icon)
2. Navigate to **API Keys**
3. Click **Create New Secret Key**
4. Copy the key and save it securely

### Step 2.3: Check Your Plan

Music generation requires API credits. Check your usage at:
- [ElevenLabs Usage Dashboard](https://elevenlabs.io/app/settings/usage)

💡 **Tip**: Start with short track durations (30-60 seconds) to conserve credits while testing.

---

## 3. Google AI Setup

Google Gemini provides AI image generation for cover art.

### Step 3.1: Access Google AI Studio

1. Go to [Google AI Studio](https://aistudio.google.com/api-keys)
2. Sign in with your Google account

### Step 3.2: Create an API Key

1. Click **Create API Key**
2. Select or create a Google Cloud project
3. Copy the generated API key

### Step 3.3: Enable Image Generation

The app uses `gemini-2.0-flash-exp-image-generation` model. This should be available by default with your API key.

---

## 4. Supabase Setup

Supabase provides the PostgreSQL database and file storage.

### Step 4.1: Create a Project

1. Go to [supabase.com](https://supabase.com)
2. Click **Start your project**
3. Sign in with GitHub
4. Click **New project**
5. Choose an organization (or create one)
6. Fill in:
   - **Project name**: `ai-playlist` (or your choice)
   - **Database password**: Create a strong password
   - **Region**: Choose the closest to you
7. Click **Create new project**
8. Wait for the project to be provisioned (1-2 minutes)

### Step 4.2: Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: For client-side operations
   - **service_role** key: For server-side operations (keep secret!)

### Step 4.3: Understand the Keys

| Key | Purpose | Security |
|-----|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | API endpoint | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side auth | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin | **SECRET** |

⚠️ **Never expose the service_role key in client-side code!**

---

## 5. Environment Configuration

### Step 5.1: Create Environment File

```bash
# Copy the example file
cp env.example .env.local
```

### Step 5.2: Fill in Your Keys

Open `.env.local` and add your keys:

```env
# ElevenLabs API Key
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Google AI API Key
GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Session Configuration
SESSION_SECRET=your_session_secret_here
```

### Step 5.3: Generate Session Secret

Generate a secure random string for `SESSION_SECRET`:

```bash
# Using OpenSSL
openssl rand -hex 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it as `SESSION_SECRET`.

---

## 6. Database Setup

### Step 6.1: Open SQL Editor

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**

### Step 6.2: Run Schema Script

1. Open the file `supabase/schema.sql` in your editor
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run**

This creates:
- `users` table - Anonymous user tracking
- `sessions` table - Browser session management
- `playlists` table - Generated playlists
- `tracks` table - Individual tracks
- Storage buckets for audio and images
- Row Level Security policies

### Step 6.3: Verify Setup

After running the script, verify in your Supabase dashboard:

1. **Table Editor**: Check that all 4 tables exist
2. **Storage**: Check that `audio` and `images` buckets exist

---

## 7. Run the App

### Development Mode

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Build the app
pnpm build

# Start production server
pnpm start
```

---

## Troubleshooting

### Common Issues

#### "ElevenLabs API key not configured"

**Cause**: Missing or invalid `ELEVENLABS_API_KEY`

**Fix**:
1. Check `.env.local` exists
2. Verify the key is correct (no extra spaces)
3. Restart the dev server after changing env vars

#### "Google AI API key not configured"

**Cause**: Missing or invalid `GOOGLE_AI_API_KEY`

**Fix**: Same as above - verify key in `.env.local`

#### "Failed to create playlist"

**Cause**: Supabase connection issue

**Fix**:
1. Verify Supabase URL and keys
2. Check that database schema was applied
3. Check Supabase dashboard for errors

#### "Storage upload failed"

**Cause**: Storage buckets not configured

**Fix**:
1. Run the storage bucket creation SQL from `schema.sql`
2. Check bucket policies in Supabase Storage settings

#### Audio not playing

**Cause**: Browser autoplay restrictions

**Fix**: This is normal browser behavior. Users need to interact with the page (click) before audio can play automatically.

### Debug Tips

1. **Check browser console** for JavaScript errors
2. **Check terminal** for server-side errors
3. **Check Supabase logs** in the dashboard
4. **Verify API keys** are correctly formatted

### Getting Help

If you're stuck:
1. Check the browser Network tab for failing requests
2. Review server logs in the terminal
3. Check Supabase logs in the dashboard
4. Search ElevenLabs or Google AI documentation

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `ELEVENLABS_API_KEY` | ✅ | ElevenLabs API key for music generation |
| `GOOGLE_AI_API_KEY` | ✅ | Google AI API key for image generation |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server only) |
| `SESSION_SECRET` | ✅ | Secret for hashing session tokens |

---

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel settings
5. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Render
- Self-hosted with Node.js

Remember to set all environment variables in your hosting platform.

---

## Next Steps

Once the app is running:

1. **Create your first track** - Enter a prompt and click "Create"
2. **Try different modes** - Switch between Track and Playlist mode
3. **Experiment with genres/moods** - See how they affect the output
4. **Share your creations** - Use the share button to copy links
5. **Browse the Discover page** - See what others have created

---

<p align="center">
  Happy music making! 🎵
</p>

