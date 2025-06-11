'use client';

import { Navbar } from '@/components/ui/Navbar';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="pt-20 pb-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          About 01 City
        </h1>
        
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              What is 01 City?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              01 City is a shared, interactive 3D virtual city where anyone can build and customize their own plot. 
              It's a creative space where you can express yourself through architecture and design, and explore 
              what others have built.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Each plot in the city represents an individual creator, forming a collective digital landscape 
              that grows and evolves as more people join.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              How It Works
            </h2>
            <div className="space-y-4">
              <div className="flex">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">1</div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sign Up</h3>
                  <p className="text-gray-600 dark:text-gray-300">Create an account to claim your plot in the city.</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">2</div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Design Your Plot</h3>
                  <p className="text-gray-600 dark:text-gray-300">Customize your main building, add a garden, and create optional sub-buildings like cafes, studios, or galleries.</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">3</div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Explore</h3>
                  <p className="text-gray-600 dark:text-gray-300">Navigate through the city, discover other creators' plots, and get inspired by their designs.</p>
                </div>
              </div>
            </div>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Technology
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              01 City is built with modern web technologies:
            </p>
            <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300 space-y-2">
              <li><span className="font-medium">React & Next.js</span> - For a fast, responsive user interface</li>
              <li><span className="font-medium">React Three Fiber</span> - For 3D rendering in the browser</li>
              <li><span className="font-medium">Convex</span> - For real-time data storage and synchronization</li>
              <li><span className="font-medium">Clerk</span> - For user authentication</li>
              <li><span className="font-medium">Vercel</span> - For deployment and hosting</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Join Us
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              01 City is a growing community of creators and explorers. We'd love for you to join us and 
              add your unique perspective to our virtual landscape.
            </p>
            <div className="flex justify-center">
              <a 
                href="/build"
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Start Building
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}