'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { DbTrack, DbPlaylistWithTracks } from '@/lib/supabase/types';

export interface DiscoverData {
  recentTracks: DbTrack[];
  featuredPlaylists: DbPlaylistWithTracks[];
}

interface DiscoverCacheContextType {
  data: DiscoverData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  fetchData: (forceRefresh?: boolean) => Promise<void>;
  lastFetched: number | null;
}

const DiscoverCacheContext = createContext<DiscoverCacheContextType | null>(null);

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export function useDiscoverCache() {
  const context = useContext(DiscoverCacheContext);
  if (!context) {
    throw new Error('useDiscoverCache must be used within a DiscoverCacheProvider');
  }
  return context;
}

interface DiscoverCacheProviderProps {
  children: React.ReactNode;
}

export function DiscoverCacheProvider({ children }: DiscoverCacheProviderProps) {
  const [data, setData] = useState<DiscoverData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const fetchingRef = useRef(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Check if cache is still valid
    const now = Date.now();
    const cacheValid = lastFetched && (now - lastFetched) < CACHE_DURATION;
    
    // If we have valid cached data and not forcing refresh, skip fetch
    if (data && cacheValid && !forceRefresh) {
      return;
    }

    // Prevent duplicate fetches
    if (fetchingRef.current) {
      return;
    }
    fetchingRef.current = true;

    // If we have data, show refreshing state instead of loading
    if (data) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const res = await fetch('/api/discover');
      if (!res.ok) {
        throw new Error('Failed to fetch');
      }
      const result = await res.json();
      setData(result);
      setLastFetched(Date.now());
    } catch (err) {
      console.error('Error fetching discover data:', err);
      setError('Failed to load discover content');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      fetchingRef.current = false;
    }
  }, [data, lastFetched]);

  return (
    <DiscoverCacheContext.Provider
      value={{
        data,
        isLoading,
        isRefreshing,
        error,
        fetchData,
        lastFetched,
      }}
    >
      {children}
    </DiscoverCacheContext.Provider>
  );
}
