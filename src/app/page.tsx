'use client';

import { Suspense, useState } from 'react';
import { Scene } from '@/components/3d/Scene';
import { Navbar } from '@/components/ui/Navbar';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate loading completion
  setTimeout(() => {
    setIsLoading(false);
  }, 3000);
  
  return (
    <main className="flex min-h-screen flex-col">
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <>
          {/* <Navbar /> */}
          <div className="flex-1 h-[calc(100vh-4rem)]">
            <Suspense fallback={<div>Loading 3D scene...</div>}>
              <Scene />
            </Suspense>
          </div>
          
          {/* Welcome overlay */}
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 dark:bg-gray-900/90 p-4 rounded-lg shadow-lg max-w-md text-center">
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Welcome to 01 City!</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Explore the city and click on buildings to learn about their creators. Sign in to build your own plot directly in the 3D view!
            </p>
          </div>
        </>
      )}
    </main>
  );
}
