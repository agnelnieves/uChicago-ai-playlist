'use client';

import { GenerationProvider } from '@/lib/GenerationContext';
import { DiscoverCacheProvider } from '@/lib/DiscoverCache';
import { GenerationToast } from './GenerationToast';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <GenerationProvider>
      <DiscoverCacheProvider>
        {children}
        <GenerationToast />
      </DiscoverCacheProvider>
    </GenerationProvider>
  );
}
