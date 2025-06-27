'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useUser } from '@clerk/nextjs';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function TestAnalytics() {
  const { user } = useUser();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const recordEvent = useMutation(api.analytics.recordEvent);
  const getBusinessDashboard = useQuery(
    api.analytics.getBusinessDashboard,
    user?.id ? {
      userId: user.id,
      timeRange: 'day'
    } : 'skip'
  );
  
  const getRealTimeData = useQuery(
    api.analytics.getRealTimeData,
    user?.id ? {
      userId: user.id
    } : 'skip'
  );
  
  const userPlots = useQuery(
    api.plots.getUserPlots,
    user?.id ? { userId: user.id } : 'skip'
  );

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testRecordEvent = async () => {
    if (!user || !userPlots || userPlots.length === 0) {
      addTestResult('❌ No user or plots found');
      return;
    }

    setIsLoading(true);
    try {
      await recordEvent({
        plotId: userPlots[0]._id,
        visitors: 1,
        interactions: 1
      });
      addTestResult('✅ Successfully recorded test event');
    } catch (error) {
      addTestResult(`❌ Failed to record event: ${error}`);
    }
    setIsLoading(false);
  };

  const testAnalyticsQueries = () => {
    if (getBusinessDashboard) {
      addTestResult('✅ Business dashboard data loaded successfully');
    } else {
      addTestResult('⏳ Business dashboard data loading...');
    }
    
    if (getRealTimeData) {
      addTestResult('✅ Real-time data loaded successfully');
    } else {
      addTestResult('⏳ Real-time data loading...');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Analytics Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please sign in to test analytics functionality.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Analytics System Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={testRecordEvent} 
                disabled={isLoading || !userPlots || userPlots.length === 0}
              >
                {isLoading ? 'Recording...' : 'Test Record Event'}
              </Button>
              <Button onClick={testAnalyticsQueries} variant="secondary">
                Test Analytics Queries
              </Button>
              <Button 
                onClick={() => setTestResults([])} 
                variant="outline"
              >
                Clear Results
              </Button>
            </div>
            
            {userPlots && (
              <div className="text-sm text-gray-600">
                <p>User Plots: {userPlots.length}</p>
                {userPlots.length > 0 && (
                  <p>Test Plot ID: {userPlots[0]._id}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-md max-h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500">No test results yet. Click the buttons above to run tests.</p>
              ) : (
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-sm font-mono">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Analytics Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Business Dashboard</h4>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                  {JSON.stringify(getBusinessDashboard, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Real-time Data</h4>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                  {JSON.stringify(getRealTimeData, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}