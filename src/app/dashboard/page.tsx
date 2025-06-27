'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { Navbar } from '@/components/ui/Navbar';
import { Id } from '../../../convex/_generated/dataModel';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

function MetricCard({ title, value, change, changeType = 'neutral' }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {change && (
          <span className={`text-sm font-medium ${
            changeType === 'positive' ? 'text-green-600' : 
            changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function SimpleLineChart({ data }: { data: Array<{ date: string; revenue: number; visitors: number; leads: number }> }) {
  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-center py-8">No data available</div>;
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const maxVisitors = Math.max(...data.map(d => d.visitors));
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-gray-600">
        <span>Revenue Trend</span>
        <span>Max: ${maxRevenue.toFixed(2)}</span>
      </div>
      <div className="h-32 flex items-end space-x-1">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div 
              className="w-full bg-blue-500 rounded-t"
              style={{ height: `${(item.revenue / maxRevenue) * 100}%` }}
              title={`${item.date}: $${item.revenue.toFixed(2)}`}
            />
            <span className="text-xs text-gray-500 mt-1">
              {new Date(item.date).getDate()}
            </span>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between text-sm text-gray-600 mt-4">
        <span>Visitors Trend</span>
        <span>Max: {maxVisitors}</span>
      </div>
      <div className="h-32 flex items-end space-x-1">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div 
              className="w-full bg-green-500 rounded-t"
              style={{ height: `${(item.visitors / maxVisitors) * 100}%` }}
              title={`${item.date}: ${item.visitors} visitors`}
            />
            <span className="text-xs text-gray-500 mt-1">
              {new Date(item.date).getDate()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrafficSourcesChart({ data }: { data: { direct: number; search: number; social: number; referral: number } }) {
  const total = data.direct + data.search + data.social + data.referral;
  
  if (total === 0) {
    return <div className="text-gray-500 text-center py-8">No traffic data available</div>;
  }

  const sources = [
    { name: 'Direct', value: data.direct, color: 'bg-blue-500' },
    { name: 'Search', value: data.search, color: 'bg-green-500' },
    { name: 'Social', value: data.social, color: 'bg-purple-500' },
    { name: 'Referral', value: data.referral, color: 'bg-orange-500' }
  ];

  return (
    <div className="space-y-3">
      {sources.map((source) => {
        const percentage = total > 0 ? (source.value / total) * 100 : 0;
        return (
          <div key={source.name} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${source.color}`} />
              <span className="text-sm font-medium text-gray-700">{source.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${source.color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-12 text-right">
                {percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useUser();
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [selectedPlotId, setSelectedPlotId] = useState<Id<'plots'> | undefined>(undefined);

  // Get user's plots
  const userPlots = useQuery(api.plots.getUserPlots, 
    user?.id ? { userId: user.id } : 'skip'
  );

  // Get analytics data
  const analyticsData = useQuery(api.analytics.getBusinessDashboard, 
    user?.id ? { 
      userId: user.id, 
      timeRange,
      plotId: selectedPlotId 
    } : 'skip'
  );

  // Get real-time data
  const realtimeData = useQuery(api.analytics.getRealTimeData, 
    user?.id ? { 
      userId: user.id,
      plotId: selectedPlotId 
    } : 'skip'
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
          <p className="text-gray-600">You need to be signed in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor your plot performance and business metrics</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white"
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>
          
          {userPlots && userPlots.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Plot Filter</label>
              <select 
                value={selectedPlotId || ''} 
                onChange={(e) => setSelectedPlotId(e.target.value as Id<'plots'> || undefined)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white"
              >
                <option value="">All Plots</option>
                {userPlots.map((plot) => (
                  <option key={plot._id} value={plot._id}>
                    Plot at ({plot.position.x}, {plot.position.z})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Real-time Metrics */}
        {realtimeData && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Real-time Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard 
                title="Active Visitors" 
                value={realtimeData.activeVisitors} 
              />
              <MetricCard 
                title="Recent Leads" 
                value={realtimeData.recentLeads} 
              />
              <MetricCard 
                title="AI Interactions" 
                value={realtimeData.recentAIInteractions} 
              />
              <MetricCard 
                title="Today's Revenue" 
                value={`$${realtimeData.todayRevenue.toFixed(2)}`} 
              />
            </div>
          </div>
        )}

        {/* Main Analytics */}
        {analyticsData && (
          <>
            {/* Overview Metrics */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                  title="Total Revenue" 
                  value={`$${analyticsData.overview.totalRevenue.toFixed(2)}`} 
                />
                <MetricCard 
                  title="Total Visitors" 
                  value={analyticsData.overview.totalVisitors} 
                />
                <MetricCard 
                  title="Total Leads" 
                  value={analyticsData.overview.totalLeads} 
                />
                <MetricCard 
                  title="Conversion Rate" 
                  value={`${analyticsData.overview.conversionRate.toFixed(1)}%`} 
                />
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ChartCard title="Revenue & Visitors Trend">
                <SimpleLineChart data={analyticsData.dailyTrends} />
              </ChartCard>
              
              <ChartCard title="Traffic Sources">
                <TrafficSourcesChart data={analyticsData.trafficSources} />
              </ChartCard>
            </div>

            {/* AI Metrics */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                  title="AI Interactions" 
                  value={analyticsData.aiMetrics.totalInteractions} 
                />
                <MetricCard 
                  title="Unique Sessions" 
                  value={analyticsData.aiMetrics.uniqueSessions} 
                />
                <MetricCard 
                  title="Avg Lead Score" 
                  value={analyticsData.aiMetrics.averageLeadScore} 
                />
                <MetricCard 
                  title="AI Generated Leads" 
                  value={analyticsData.aiMetrics.aiGeneratedLeads} 
                />
              </div>
            </div>

            {/* Revenue Breakdown */}
            {Object.keys(analyticsData.revenueByType).length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue Breakdown</h2>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="space-y-3">
                    {Object.entries(analyticsData.revenueByType).map(([type, amount]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {type.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-900 font-semibold">
                          ${(amount as number).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Loading State */}
        {!analyticsData && user && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        )}

        {/* No Data State */}
        {analyticsData && analyticsData.overview.totalVisitors === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data yet</h3>
            <p className="text-gray-600">Start creating plots and engaging with visitors to see your analytics.</p>
          </div>
        )}
      </div>
    </div>
  );
}