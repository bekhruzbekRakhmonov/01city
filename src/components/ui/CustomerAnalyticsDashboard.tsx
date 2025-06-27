import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Button } from './Button';
import { useState } from 'react';

interface CustomerAnalyticsDashboardProps {
  plotId: Id<'plots'>;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
}

function MetricCard({ title, value, subtitle, trend, icon }: MetricCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {icon && <div className="text-blue-600">{icon}</div>}
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {trend && (
          <div className={`flex items-center text-sm font-medium px-2 py-1 rounded-full ${
            trend.isPositive 
              ? 'text-green-700 bg-green-100' 
              : 'text-red-700 bg-red-100'
          }`}>
            <span className={`mr-1 text-lg ${
              trend.isPositive ? '↗' : '↘'
            }`}>
              {trend.isPositive ? '↗' : '↘'}
            </span>
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </Card>
  );
}

function EnhancedLineChart({ data }: { data: Array<{ date: string; clicks: number; websiteVisits: number }> }) {
  const maxValue = Math.max(...data.map(d => Math.max(d.clicks, d.websiteVisits)), 1);
  const chartHeight = 200;
  
  return (
    <div className="relative">
      {/* Chart Area */}
      <div className="h-64 flex items-end justify-between px-4 py-4 bg-gradient-to-t from-gray-50 to-transparent rounded-lg">
        {data.map((item, index) => {
          const clicksHeight = (item.clicks / maxValue) * chartHeight;
          const visitsHeight = (item.websiteVisits / maxValue) * chartHeight;
          
          return (
            <div key={index} className="flex flex-col items-center space-y-2 group cursor-pointer">
              <div className="relative flex flex-col items-center w-8">
                {/* Tooltip */}
                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  <div>Clicks: {item.clicks}</div>
                  <div>Visits: {item.websiteVisits}</div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
                
                {/* Website visits bar */}
                <div 
                  className="w-6 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg shadow-sm group-hover:shadow-md transition-all duration-200"
                  style={{ 
                    height: `${Math.max(visitsHeight, 2)}px`,
                  }}
                />
                {/* Building clicks bar */}
                <div 
                  className="w-6 bg-gradient-to-t from-green-500 to-green-400 rounded-b-lg shadow-sm group-hover:shadow-md transition-all duration-200"
                  style={{ 
                    height: `${Math.max(clicksHeight, 2)}px`,
                  }}
                />
              </div>
              <span className="text-xs text-gray-500 transform rotate-45 origin-left mt-2">
                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 h-64 flex flex-col justify-between py-4 text-xs text-gray-500">
        <span>{maxValue}</span>
        <span>{Math.round(maxValue * 0.75)}</span>
        <span>{Math.round(maxValue * 0.5)}</span>
        <span>{Math.round(maxValue * 0.25)}</span>
        <span>0</span>
      </div>
    </div>
  );
}

function TopReferrersChart({ data }: { data: Array<{ referrer: string; count: number }> }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-4 group">
          <div className="w-32 text-sm text-gray-700 truncate font-medium">
            {item.referrer === 'Direct' ? '🔗 Direct' : `🌐 ${item.referrer}`}
          </div>
          <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out group-hover:from-blue-600 group-hover:to-blue-700"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            />
          </div>
          <div className="w-12 text-sm text-gray-900 text-right font-semibold">
            {item.count}
          </div>
        </div>
      ))}
    </div>
  );
}

function TimeRangeSelector({ 
  value, 
  onChange 
}: { 
  value: 'day' | 'week' | 'month' | 'year'; 
  onChange: (value: 'day' | 'week' | 'month' | 'year') => void; 
}) {
  const options = [
    { value: 'day', label: '24 Hours', icon: '📅' },
    { value: 'week', label: '7 Days', icon: '📊' },
    { value: 'month', label: '30 Days', icon: '📈' },
    { value: 'year', label: '1 Year', icon: '📋' }
  ] as const;

  return (
    <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
            value === option.value
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
          }`}
        >
          <span>{option.icon}</span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

export function CustomerAnalyticsDashboard({ plotId }: CustomerAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  
  const analyticsData = useQuery(api.analytics.getCustomerAnalytics, {
    plotId,
    timeRange
  });
  
  const buildingClickData = useQuery(api.analytics.getBuildingClickAnalytics, {
    plotId,
    timeRange
  });

  if (!analyticsData || !buildingClickData) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-10 bg-gray-200 rounded w-48"></div>
        </div>
        
        {/* Metrics Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-gray-200 rounded-lg"></div>
          <div className="h-80 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Icons for metrics
  const ClickIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122" />
    </svg>
  );

  const UsersIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  );

  const GlobeIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  );

  const TrendIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Building Analytics</h2>
          <p className="text-gray-600">Track your building's performance and visitor engagement</p>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Building Clicks"
          value={buildingClickData.overview.totalClicks.toLocaleString()}
          subtitle="Total interactions"
          icon={<ClickIcon />}
        />
        <MetricCard
          title="Unique Visitors"
          value={buildingClickData.overview.uniqueVisitors.toLocaleString()}
          subtitle="Individual users"
          icon={<UsersIcon />}
        />
        <MetricCard
          title="Website Visits"
          value={buildingClickData.overview.totalWebsiteVisits.toLocaleString()}
          subtitle="External clicks"
          icon={<GlobeIcon />}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${buildingClickData.overview.clickToWebsiteRate}%`}
          subtitle="Click-to-website rate"
          icon={<TrendIcon />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enhanced Daily Activity Chart */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
            <CardTitle className="flex items-center space-x-2">
              <span>📊</span>
              <span>Activity Overview</span>
            </CardTitle>
            <div className="flex items-center space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-400 rounded"></div>
                <span className="text-sm font-medium text-gray-700">Building Clicks</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-400 rounded"></div>
                <span className="text-sm font-medium text-gray-700">Website Visits</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {buildingClickData.dailyData.length > 0 ? (
              <EnhancedLineChart data={buildingClickData.dailyData} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">📈</div>
                  <p className="text-lg font-medium">No activity data yet</p>
                  <p className="text-sm">Start promoting your building to see analytics</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Top Referrers */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center space-x-2">
              <span>🌐</span>
              <span>Traffic Sources</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {buildingClickData.topReferrers.length > 0 ? (
              <TopReferrersChart data={buildingClickData.topReferrers} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">🔗</div>
                  <p className="text-lg font-medium">No referrer data available</p>
                  <p className="text-sm">Share your building link to track traffic sources</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Insights */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardTitle className="flex items-center space-x-2">
            <span>💡</span>
            <span>Insights & Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {buildingClickData.overview.totalClicks === 0 ? (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-xl">
                <div className="flex items-start space-x-4">
                  <div className="text-3xl">🚀</div>
                  <div>
                    <p className="font-semibold text-blue-900 text-lg mb-2">Ready to Launch!</p>
                    <p className="text-blue-700 mb-4">Your building is set up and ready to attract visitors. Here's how to get started:</p>
                    <ul className="text-blue-700 space-y-2 text-sm">
                      <li className="flex items-center space-x-2">
                        <span>✓</span>
                        <span>Share your MetroSpace plot link on social media</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span>✓</span>
                        <span>Add your building link to your email signature</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span>✓</span>
                        <span>Include it in your business cards and marketing materials</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {buildingClickData.overview.clickToWebsiteRate > 50 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-6 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">🎯</div>
                      <div>
                        <p className="font-semibold text-green-900 mb-2">Excellent Conversion!</p>
                        <p className="text-green-700 text-sm">Your {buildingClickData.overview.clickToWebsiteRate}% click-to-website rate is outstanding. Keep up the great work!</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {buildingClickData.overview.clickToWebsiteRate < 20 && buildingClickData.overview.totalClicks > 10 && (
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 p-6 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">⚡</div>
                      <div>
                        <p className="font-semibold text-yellow-900 mb-2">Boost Your Conversions</p>
                        <p className="text-yellow-700 text-sm">Consider making your website link more prominent or adding compelling call-to-action text.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {buildingClickData.overview.uniqueVisitors > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 p-6 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">👥</div>
                      <div>
                        <p className="font-semibold text-purple-900 mb-2">Growing Audience</p>
                        <p className="text-purple-700 text-sm">You've attracted {buildingClickData.overview.uniqueVisitors} unique visitors. Keep your content fresh to encourage return visits.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {buildingClickData.overview.totalClicks > 100 && (
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 p-6 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">🏆</div>
                      <div>
                        <p className="font-semibold text-indigo-900 mb-2">Milestone Achieved!</p>
                        <p className="text-indigo-700 text-sm">Congratulations on reaching {buildingClickData.overview.totalClicks} total clicks! Your building is gaining traction.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}