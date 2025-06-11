'use client';

import { useEffect, useState } from 'react';

export function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 z-50">
      <h1 className="text-4xl font-bold mb-8 text-gray-800 dark:text-white">01 City</h1>
      <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-4 text-gray-600 dark:text-gray-300">
        Loading your virtual city... {progress}%
      </p>
    </div>
  );
}