'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Dropdown } from './Dropdown';
import { DiceIcon, LoadingSpinner } from './Icons';
import { GENRES, MOODS, SUGGESTION_PROMPTS, Genre, Mood } from '@/types';

type GenerationMode = 'single' | 'playlist';

interface PlaylistFormProps {
  onSubmit: (data: {
    prompt: string;
    genre?: string;
    mood?: string;
    mode: GenerationMode;
  }) => void;
  isLoading?: boolean;
}

export function PlaylistForm({ onSubmit, isLoading = false }: PlaylistFormProps) {
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState<Genre | undefined>();
  const [mood, setMood] = useState<Mood | undefined>();
  const [mode, setMode] = useState<GenerationMode>('single');
  
  // Scroll gradient state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(false);

  const updateGradients = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const isScrollable = scrollWidth > clientWidth;
    
    // Show left gradient if scrolled away from the start
    setShowLeftGradient(scrollLeft > 5);
    
    // Show right gradient if there's more content to the right
    setShowRightGradient(isScrollable && scrollLeft < scrollWidth - clientWidth - 5);
  }, []);

  useEffect(() => {
    updateGradients();
    window.addEventListener('resize', updateGradients);
    return () => window.removeEventListener('resize', updateGradients);
  }, [updateGradients]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSubmit({ prompt: prompt.trim(), genre, mood, mode });
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
      {/* Mode Toggle - Outside the form */}
      <div className="flex justify-center mb-4 sm:mb-5">
        <div className="inline-flex items-center h-10 sm:h-11 p-1 rounded-full bg-[var(--base-fill-1)] border border-[var(--base-border)]">
          <button
            type="button"
            onClick={() => setMode('single')}
            disabled={isLoading}
            className={`flex items-center gap-2 h-8 sm:h-9 px-4 sm:px-5 rounded-full text-sm font-medium transition-all ${
              mode === 'single'
                ? 'bg-[var(--accent-blue)] text-white shadow-lg'
                : 'text-[#9b9b9b] hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
            </svg>
            <span>Track</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('playlist')}
            disabled={isLoading}
            className={`flex items-center gap-2 h-8 sm:h-9 px-4 sm:px-5 rounded-full text-sm font-medium transition-all ${
              mode === 'playlist'
                ? 'bg-[var(--accent-blue)] text-white shadow-lg'
                : 'text-[#9b9b9b] hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="3" strokeLinecap="round" />
              <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="3" strokeLinecap="round" />
              <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span>Playlist</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Prompt Box */}
        <div className="bg-[var(--base-fill-1)] border border-[var(--base-border)] rounded-[20px] sm:rounded-[25px] p-3 sm:p-3.5">
          {/* Text Area */}
          <div className="p-2.5 sm:p-3.5 min-h-[100px] sm:min-h-[119px]">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Create an absolute banger for me to focus on vibe coding workshops."
              className="w-full h-full min-h-[70px] sm:min-h-[80px] bg-transparent border-none outline-none resize-none text-base sm:text-lg text-white placeholder:text-[var(--text-dark-tertiary)] font-normal tracking-[-0.36px]"
              disabled={isLoading}
            />
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Left Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
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
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleRandomPrompt}
                disabled={isLoading}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--base-surface-2)] border border-[var(--base-border)] text-[#9b9b9b] hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                title="Random prompt"
              >
                <DiceIcon className="w-5 h-5" />
              </button>

              <button
                type="submit"
                disabled={!prompt.trim() || isLoading}
                className="flex items-center justify-center h-9 px-4 sm:px-5 rounded-full font-semibold text-sm text-[var(--text-light-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:brightness-110"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(20, 20, 20, 0) 0%, rgba(20, 20, 20, 0.36) 100%), linear-gradient(90deg, #50A1FF 0%, #50A1FF 100%)`,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">Creating...</span>
                    <span className="sm:hidden">...</span>
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
      <div className="mt-4 sm:mt-5">
        <div className="px-4 sm:px-7 py-2 sm:py-2.5">
          <p className="text-sm sm:text-base font-medium text-[var(--text-dark-secondary)]">
            Try asking
          </p>
        </div>
        <div className="relative">
          {/* Left gradient - only shows when scrolled */}
          <div 
            className="absolute left-0 top-0 bottom-2 w-8 sm:w-12 z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(to right, var(--base-surface-1) 0%, var(--base-surface-1) 20%, transparent 100%)',
              opacity: showLeftGradient ? 1 : 0,
              transform: showLeftGradient ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'opacity 300ms ease-out, transform 300ms ease-out',
            }}
          />
          {/* Right gradient - only shows when there's more content */}
          <div 
            className="absolute right-0 top-0 bottom-2 w-12 sm:w-20 z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(to left, var(--base-surface-1) 0%, var(--base-surface-1) 20%, transparent 100%)',
              opacity: showRightGradient ? 1 : 0,
              transform: showRightGradient ? 'translateX(0)' : 'translateX(100%)',
              transition: 'opacity 300ms ease-out, transform 300ms ease-out',
            }}
          />
          
          {/* Suggestions grid */}
          <div 
            ref={scrollContainerRef}
            onScroll={updateGradients}
            className="flex gap-2.5 sm:gap-4 overflow-x-auto pb-2 px-2 sm:px-5 scrollbar-hide"
          >
            {SUGGESTION_PROMPTS.slice(0, 4).map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isLoading}
                className="flex-shrink-0 w-[180px] sm:w-[200px] md:w-[218px] h-[90px] sm:h-[100px] md:h-[106px] p-3.5 sm:p-4 md:p-5 rounded-xl border border-[var(--base-border)] text-left text-xs sm:text-sm text-[var(--text-dark-secondary)] hover:text-white hover:border-[var(--accent-blue)]/50 transition-all disabled:opacity-50"
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

