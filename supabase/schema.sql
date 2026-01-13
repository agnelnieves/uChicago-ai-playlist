-- AI Playlist Database Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- USERS TABLE (identified by IP hash for anonymous tracking)
-- ============================================
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  ip_hash text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_seen_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Unique index on ip_hash for fast lookups
create unique index if not exists idx_users_ip_hash on users(ip_hash);

-- ============================================
-- SESSIONS TABLE (browser-specific sessions linked to users)
-- ============================================
create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  session_token text unique not null,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_seen_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast session token lookups
create index if not exists idx_sessions_token on sessions(session_token);
create index if not exists idx_sessions_user_id on sessions(user_id);

-- ============================================
-- PLAYLISTS TABLE
-- ============================================
create table if not exists playlists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete set null,
  name text not null,
  description text,
  prompt text not null,
  genre text,
  mood text,
  status text not null default 'pending' check (status in ('pending', 'generating', 'ready', 'partial', 'error')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- TRACKS TABLE
-- ============================================
create table if not exists tracks (
  id uuid primary key default uuid_generate_v4(),
  playlist_id uuid references playlists(id) on delete cascade not null,
  title text not null,
  prompt text not null,
  genre text,
  mood text,
  duration integer not null default 60,
  audio_url text,
  status text not null default 'pending' check (status in ('pending', 'generating', 'ready', 'error')),
  error text,
  track_order integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_tracks_playlist_id on tracks(playlist_id);
create index if not exists idx_playlists_created_at on playlists(created_at desc);
create index if not exists idx_playlists_user_id on playlists(user_id);
create index if not exists idx_tracks_track_order on tracks(playlist_id, track_order);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS on all tables
alter table users enable row level security;
alter table sessions enable row level security;
alter table playlists enable row level security;
alter table tracks enable row level security;

-- Create policies for public read/write access (for demo purposes)
-- In production, you'd want to add user authentication and restrict access

-- Users policies
create policy "Anyone can read users"
  on users for select
  to anon
  using (true);

create policy "Anyone can insert users"
  on users for insert
  to anon
  with check (true);

create policy "Anyone can update users"
  on users for update
  to anon
  using (true);

-- Sessions policies
create policy "Anyone can read sessions"
  on sessions for select
  to anon
  using (true);

create policy "Anyone can insert sessions"
  on sessions for insert
  to anon
  with check (true);

create policy "Anyone can update sessions"
  on sessions for update
  to anon
  using (true);

create policy "Anyone can delete sessions"
  on sessions for delete
  to anon
  using (true);

-- Playlists policies
create policy "Anyone can read playlists"
  on playlists for select
  to anon
  using (true);

create policy "Anyone can insert playlists"
  on playlists for insert
  to anon
  with check (true);

create policy "Anyone can update playlists"
  on playlists for update
  to anon
  using (true);

create policy "Anyone can delete playlists"
  on playlists for delete
  to anon
  using (true);

-- Tracks policies
create policy "Anyone can read tracks"
  on tracks for select
  to anon
  using (true);

create policy "Anyone can insert tracks"
  on tracks for insert
  to anon
  with check (true);

create policy "Anyone can update tracks"
  on tracks for update
  to anon
  using (true);

create policy "Anyone can delete tracks"
  on tracks for delete
  to anon
  using (true);

-- ============================================
-- FUNCTION: Update updated_at timestamp
-- ============================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at on playlists
drop trigger if exists update_playlists_updated_at on playlists;
create trigger update_playlists_updated_at
  before update on playlists
  for each row
  execute function update_updated_at_column();

-- ============================================
-- FUNCTION: Update last_seen_at timestamp
-- ============================================
create or replace function update_last_seen_at_column()
returns trigger as $$
begin
  new.last_seen_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update last_seen_at on users
drop trigger if exists update_users_last_seen_at on users;
create trigger update_users_last_seen_at
  before update on users
  for each row
  execute function update_last_seen_at_column();

-- Trigger to auto-update last_seen_at on sessions
drop trigger if exists update_sessions_last_seen_at on sessions;
create trigger update_sessions_last_seen_at
  before update on sessions
  for each row
  execute function update_last_seen_at_column();

-- ============================================
-- STORAGE BUCKET FOR AUDIO FILES (Optional)
-- ============================================
-- Run this separately if you want to store audio files in Supabase Storage
-- insert into storage.buckets (id, name, public) values ('audio', 'audio', true);

-- Storage policy for public access
-- create policy "Anyone can read audio files"
--   on storage.objects for select
--   to anon
--   using (bucket_id = 'audio');

-- create policy "Anyone can upload audio files"
--   on storage.objects for insert
--   to anon
--   with check (bucket_id = 'audio');

