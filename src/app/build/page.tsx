'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Navbar } from '@/components/ui/Navbar';
import { PlotCreator } from '@/components/ui/PlotCreator';

export default function BuildPage() {
  const { isSignedIn, isLoaded } = useUser();
  const [plotCreated, setPlotCreated] = useState(false);
  
  const handlePlotCreated = () => {
    setPlotCreated(true);
    // In a real app, we might redirect to the user's plot or the city view
    setTimeout(() => {
      window.location.href = '/';
    }, 3000);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="pt-20 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Build Your Plot in 01 City
        </h1>
        
        {!isLoaded ? (
          <div className="flex justify-center py-10">
            <div className="animate-pulse h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
        ) : !isSignedIn ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md mx-auto text-center">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Sign In to Build
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You need to sign in to create your own plot in 01 City.
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to City
            </button>
          </div>
        ) : plotCreated ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md mx-auto text-center">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Plot Created Successfully!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your plot has been added to 01 City. Redirecting you back to explore the city...
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
              <div className="bg-blue-600 h-2.5 rounded-full animate-[progress_3s_ease-in-out]" style={{ width: '100%' }}></div>
            </div>
          </div>
        ) : (
          <PlotCreator onComplete={handlePlotCreated} />
        )}
      </div>
    </div>
  );
}