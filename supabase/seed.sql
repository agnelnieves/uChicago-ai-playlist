-- Seed data for AI Playlist Generator
-- Run this in your Supabase SQL Editor after creating the tables

-- Insert sample playlists
INSERT INTO playlists (id, name, prompt, genre, mood, status, created_at, updated_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Chill Lo-Fi Beats', 'Relaxing lo-fi beats for studying and focus', 'Lo-Fi', 'Calm', 'ready', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('22222222-2222-2222-2222-222222222222', 'Epic Cinematic Journey', 'Epic orchestral music for creative writing and inspiration', 'Cinematic', 'Epic', 'ready', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('33333333-3333-3333-3333-333333333333', 'Morning Energy Boost', 'Upbeat electronic tracks to start the day with energy', 'Electronic', 'Energetic', 'ready', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours');

-- Insert sample tracks for "Chill Lo-Fi Beats" playlist
INSERT INTO tracks (playlist_id, title, prompt, genre, mood, duration, status, track_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Rainy Day Study', 'Relaxing lo-fi beats for studying and focus', 'Lo-Fi', 'Calm', 60, 'ready', 0),
  ('11111111-1111-1111-1111-111111111111', 'Midnight Coffee', 'Relaxing lo-fi beats for studying and focus with a jazzy touch', 'Lo-Fi', 'Calm', 60, 'ready', 1),
  ('11111111-1111-1111-1111-111111111111', 'Sunset Vibes', 'Relaxing lo-fi beats with warm sunset atmosphere', 'Lo-Fi', 'Calm', 60, 'ready', 2);

-- Insert sample tracks for "Epic Cinematic Journey" playlist
INSERT INTO tracks (playlist_id, title, prompt, genre, mood, duration, status, track_order) VALUES
  ('22222222-2222-2222-2222-222222222222', 'The Adventure Begins', 'Epic orchestral music with building intensity', 'Cinematic', 'Epic', 60, 'ready', 0),
  ('22222222-2222-2222-2222-222222222222', 'Into the Unknown', 'Mysterious orchestral piece with tension', 'Cinematic', 'Epic', 60, 'ready', 1),
  ('22222222-2222-2222-2222-222222222222', 'Triumph', 'Triumphant orchestral finale with full orchestra', 'Cinematic', 'Epic', 60, 'ready', 2);

-- Insert sample tracks for "Morning Energy Boost" playlist
INSERT INTO tracks (playlist_id, title, prompt, genre, mood, duration, status, track_order) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Wake Up Call', 'Upbeat electronic track with driving beat', 'Electronic', 'Energetic', 60, 'ready', 0),
  ('33333333-3333-3333-3333-333333333333', 'Power Hour', 'High energy electronic with synth leads', 'Electronic', 'Energetic', 60, 'ready', 1),
  ('33333333-3333-3333-3333-333333333333', 'Unstoppable', 'Peak energy electronic banger', 'Electronic', 'Energetic', 60, 'ready', 2);

