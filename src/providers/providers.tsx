'use client';

import { ReactNode } from 'react';
import { ConvexProvider } from './convex-provider';
import { ClerkProvider } from './clerk-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexProvider>
        {children}
      </ConvexProvider>
    </ClerkProvider>
  );
}