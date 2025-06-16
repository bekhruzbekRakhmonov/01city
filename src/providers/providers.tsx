'use client';

import { ReactNode, useEffect } from 'react';
import { ConvexProvider } from './convex-provider';
import { ClerkProvider } from './clerk-provider';
import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

// Component to handle user synchronization with Convex
function UserSync() {
  const { user, isSignedIn } = useUser();
  const createOrUpdateProfile = useMutation(api.users.createOrUpdateProfile);

  useEffect(() => {
    if (isSignedIn && user) {
      // Automatically sync user data to Convex when they sign in
      const syncUser = async () => {
        try {
          await createOrUpdateProfile({
            userId: user.id,
            username: user.username || user.firstName || `user_${user.id.slice(-8)}`,
            email: user.primaryEmailAddress?.emailAddress || '',
          });
        } catch (error) {
          console.error('Failed to sync user to Convex:', error);
        }
      };

      syncUser();
    }
  }, [isSignedIn, user, createOrUpdateProfile]);

  return null; // This component doesn't render anything
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexProvider>
        <UserSync />
        {children}
      </ConvexProvider>
    </ClerkProvider>
  );
}