'use client';

import { ReactNode } from 'react';
import { ClerkProvider as ClerkReactProvider } from '@clerk/nextjs';

export function ClerkProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkReactProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      {children}
    </ClerkReactProvider>
  );
}