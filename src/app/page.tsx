'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { PlaylistForm } from '@/components/PlaylistForm';
import { useGeneration } from '@/lib/GenerationContext';

const GREETINGS = [
  "Hey there! What would you like to listen today?",
  "Welcome back! Ready to create some music?",
  "Let's make something amazing today!",
  "What's the vibe today?",
];

// Get a random greeting - only called once on component mount
function getRandomGreeting(): string {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

// Session response type
interface SessionResponse {
  success: boolean;
  user?: {
    id: string;
    createdAt: string;
  };
  session?: {
    id: string;
    createdAt: string;
  };
  isNewSession?: boolean;
  error?: string;
}

export default function Home() {
  // Use lazy initialization for greeting - Math.random only runs once
  const [greeting] = useState(getRandomGreeting);
  const { startGeneration, isGenerating } = useGeneration();

  // Initialize session - creates or validates session cookie
  const initializeSession = useCallback(async () => {
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (res.ok) {
        const data: SessionResponse = await res.json();
        if (data.success) {
          console.log(
            data.isNewSession 
              ? 'New session created' 
              : 'Existing session validated'
          );
        }
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  const handleSubmit = async (data: {
    prompt: string;
    genre?: string;
    mood?: string;
    mode: 'single' | 'playlist';
  }) => {
    // Start generation using the context - this will handle everything
    // and show the floating toast for progress
    await startGeneration(data);
  };

  return (
    <div className="min-h-screen bg-[var(--base-surface-1)] flex flex-col relative overflow-hidden">
      {/* Background glow */}
      <div 
        className="absolute top-[-200px] sm:top-[-300px] md:top-[-375px] left-1/2 -translate-x-1/2 w-[500px] sm:w-[800px] md:w-[1058px] h-[300px] sm:h-[400px] md:h-[506px] opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(80, 161, 255, 0.4) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-[216px]">
        <nav className="flex items-center justify-between py-4 sm:py-5">
          <Logo />
          
          <div className="flex items-center gap-4 sm:gap-6">
            <Link 
              href="/discover" 
              className="text-[var(--text-dark-secondary)] hover:text-white transition-colors text-sm sm:text-base"
            >
              Discover
            </Link>
            <Link 
              href="/" 
              className="text-white font-medium text-sm sm:text-base"
            >
              Create
            </Link>
            
            {/* Avatar */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[var(--base-border)] bg-gradient-to-br from-orange-400 to-red-500 overflow-hidden flex-shrink-0">
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                A
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center pt-8 sm:pt-12 md:pt-[50px] px-4 sm:px-6 md:px-8 lg:px-[216px]">
        {/* Greeting */}
        <div className="text-center pb-6 sm:pb-8 md:pb-[42px]">
          <h1 className="text-2xl sm:text-[28px] md:text-[30px] leading-tight sm:leading-[36px] md:leading-[38px] tracking-[-0.5px] sm:tracking-[-0.6px] text-[var(--text-dark-secondary)] max-w-[640px] px-2">
            {greeting.split('!').map((part, i) => (
              <span key={i}>
                {i === 0 ? <span className="block">{part}!</span> : null}
                {i === 1 && part ? <span className="block">{part}</span> : null}
              </span>
            ))}
          </h1>
        </div>

        {/* Form */}
        <PlaylistForm onSubmit={handleSubmit} isLoading={isGenerating} />
      </main>
    </div>
  );
}
