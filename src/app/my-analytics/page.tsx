'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { CustomerAnalyticsDashboard } from '../../components/ui/CustomerAnalyticsDashboard';
import { Card } from '../../components/ui/Card';
import { useState } from 'react';
import Link from 'next/link';

export default function MyAnalyticsPage() {
  const { user, isLoaded } = useUser();
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  
  // Get user's plots
  const userPlots = useQuery(
    api.plots.getUserPlots,
    user?.id ? { userId: user.id } : 'skip'
  );

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
          <p className="text-gray-600 mb-6">You need to be signed in to view your analytics.</p>
          <Link 
            href="/sign-in" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </Card>
      </div>
    );
  }

  if (!userPlots || userPlots.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">No Plots Found</h1>
            <p className="text-gray-600 mb-6">
            You don&apos;t have any plots yet. Create your first plot to start tracking analytics.
          </p>
            <Link 
              href="/build" 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Plot
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const selectedPlot = selectedPlotId 
    ? userPlots.find(plot => plot._id === selectedPlotId)
    : userPlots[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Building Analytics</h1>
          <p className="text-gray-600 mb-4">Track your plot&apos;s performance with detailed analytics and insights.</p>
        </div>

        {/* Enhanced Plot Selector */}
        {userPlots.length > 1 && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center mb-6">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <h2 className="text-xl font-bold text-gray-900">Your Properties</h2>
              <span className="ml-auto bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {userPlots.length} {userPlots.length === 1 ? 'Plot' : 'Plots'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userPlots.map((plot) => {
                const isSelected = (selectedPlotId || userPlots[0]._id) === plot._id;
                const totalSquares = plot.size.width * plot.size.depth;
                const companyName = plot.name;
                
                return (
                  <button
                    key={plot._id}
                    onClick={() => setSelectedPlotId(plot._id)}
                    className={`group relative p-6 rounded-xl border-2 text-left transition-all duration-300 transform hover:scale-105 ${
                      isSelected
                        ? 'border-blue-500 bg-white shadow-lg ring-4 ring-blue-100'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Plot Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">
                          {companyName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Created {new Date(plot._creationTime).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        plot.paymentStatus === 'paid' ? 'bg-green-400' : 
                        plot.paymentStatus === 'pending' ? 'bg-yellow-400' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    
                    {/* Plot Stats */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Plot Size</span>
                        <span className="font-semibold text-gray-900">
                          {plot.size.width}×{plot.size.depth} ({totalSquares} sq)
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status</span>
                        <span className="text-sm font-medium text-green-600">
                          Active
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Size</span>
                        <span className="text-sm text-gray-600">
                          {plot.size.width} × {plot.size.depth} units
                        </span>
                      </div>
                    </div>
                    
                    {/* Hover Effect */}
                    <div className={`absolute inset-0 rounded-xl transition-opacity ${
                      isSelected ? 'bg-blue-500 opacity-5' : 'bg-blue-500 opacity-0 group-hover:opacity-5'
                    }`}></div>
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {/* Analytics Dashboard */}
        {selectedPlot && (
          <div>
            {/* Enhanced Current Plot Header */}
            <Card className="p-6 mb-8 bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedPlot.name}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {selectedPlot.size.width}×{selectedPlot.size.depth} plot • 
                      General Business
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Last updated</div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(selectedPlot._creationTime).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Card>

            {/* Analytics Dashboard Component */}
            <CustomerAnalyticsDashboard plotId={selectedPlot._id} />
          </div>
        )}

        {/* Help Section */}
        <Card className="p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Understanding Your Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Building Clicks</h4>
              <p>Number of times visitors clicked on your building in the 3D world. This indicates interest in your business or content.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Website Visits</h4>
              <p>Number of times visitors clicked through to your external website from your building's information panel.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Unique Visitors</h4>
              <p>Number of individual users who interacted with your building, helping you understand your reach.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Click-to-Website Rate</h4>
              <p>Percentage of building clicks that resulted in website visits. Higher rates indicate effective call-to-action.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}