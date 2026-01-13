'use client';

import { useState } from 'react';
import { Dropdown } from './Dropdown';
import { DiceIcon, LoadingSpinner } from './Icons';
import { GENRES, MOODS, SUGGESTION_PROMPTS, Genre, Mood } from '@/types';

interface PlaylistFormProps {
  onSubmit: (data: {
    prompt: string;
    genre?: string;
    mood?: string;
  }) => void;
  isLoading?: boolean;
}

export function PlaylistForm({ onSubmit, isLoading = false }: PlaylistFormProps) {
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState<Genre | undefined>();
  const [mood, setMood] = useState<Mood | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSubmit({ prompt: prompt.trim(), genre, mood });
  };

  const handleRandomPrompt = () => {
    const randomPrompt = SUGGESTION_PROMPTS[Math.floor(Math.random() * SUGGESTION_PROMPTS.length)];
    setPrompt(randomPrompt);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  const genreOptions = GENRES.map(g => ({ value: g, label: g }));
  const moodOptions = MOODS.map(m => ({ value: m.name, label: `${m.emoji} ${m.name}` }));

  return (
    <div className="w-full max-w-[614px] mx-auto">
      <form onSubmit={handleSubmit}>
        {/* Prompt Box */}
        <div className="bg-[var(--base-fill-1)] border border-[var(--base-border)] rounded-[25px] p-3.5">
          {/* Text Area */}
          <div className="p-3.5 min-h-[119px]">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Create an absolute banger for me to focus on vibe coding workshops."
              className="w-full h-full min-h-[80px] bg-transparent border-none outline-none resize-none text-lg text-white placeholder:text-[var(--text-dark-tertiary)] font-normal tracking-[-0.36px]"
              disabled={isLoading}
            />
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Left Actions */}
            <div className="flex items-center gap-1">
              <Dropdown
                label="Genre"
                options={genreOptions}
                value={genre}
                onChange={(v) => setGenre(v as Genre | undefined)}
                placeholder="Any genre"
              />
              <Dropdown
                label="Mood"
                options={moodOptions}
                value={mood}
                onChange={(v) => setMood(v as Mood | undefined)}
                placeholder="Any mood"
              />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1">
              {/* Random Prompt Button */}
              <button
                type="button"
                onClick={handleRandomPrompt}
                disabled={isLoading}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--base-surface-2)] border border-[var(--base-border)] text-[#9b9b9b] hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                title="Random prompt"
              >
                <DiceIcon className="w-5 h-5" />
              </button>

              {/* Create Button */}
              <button
                type="submit"
                disabled={!prompt.trim() || isLoading}
                className="flex items-center justify-center h-9 px-3 rounded-full font-semibold text-sm text-[var(--text-light-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:brightness-110"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(20, 20, 20, 0) 0%, rgba(20, 20, 20, 0.36) 100%), linear-gradient(90deg, #50A1FF 0%, #50A1FF 100%)`,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Suggestions */}
      <div className="mt-4">
        <div className="px-7 py-2.5">
          <p className="text-base font-medium text-[var(--text-dark-secondary)]">
            Try asking
          </p>
        </div>
        <div className="relative px-5">
          {/* Gradient overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-[var(--base-surface-1)] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[var(--base-surface-1)] to-transparent z-10 pointer-events-none" />
          
          {/* Suggestions grid */}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {SUGGESTION_PROMPTS.slice(0, 4).map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isLoading}
                className="flex-shrink-0 w-[218px] h-[106px] p-5 rounded-xl border border-[var(--base-border)] text-left text-sm text-[var(--text-dark-secondary)] hover:text-white hover:border-[var(--accent-blue)]/50 transition-all disabled:opacity-50"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.072) 100%), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.08) 100%)`,
                }}
              >
                <span className="line-clamp-3">{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

