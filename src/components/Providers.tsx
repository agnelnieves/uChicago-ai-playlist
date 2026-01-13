'use client';

import { GenerationProvider } from '@/lib/GenerationContext';
import { GenerationToast } from './GenerationToast';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <GenerationProvider>
      {children}
      <GenerationToast />
    </GenerationProvider>
  );
}
