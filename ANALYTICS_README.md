# Analytics Dashboard

This document describes the analytics system and dashboard implementation for the MetroSpace application.

## Features Implemented

### 1. Analytics Data Collection
- **Event Recording**: Track visitor interactions, lead generation, and revenue events
- **Real-time Metrics**: Monitor active visitors, recent leads, and AI interactions
- **Performance Insights**: Get automated recommendations and performance scoring

### 2. Dashboard Components
- **Metrics Overview**: Key performance indicators (KPIs) cards
- **Time Range Selection**: Filter data by day, week, month, or year
- **Plot Selection**: View analytics for specific plots or all plots
- **Charts and Visualizations**: Trend lines and traffic source breakdowns

### 3. API Endpoints

#### Analytics Functions (`convex/analytics.ts`)
- `recordEvent`: Record analytics events (visitors, interactions, revenue)
- `getBusinessDashboard`: Get comprehensive analytics data for a time period
- `getRealTimeData`: Get current active sessions and recent activity
- `exportAnalytics`: Export analytics data in various formats
- `getPerformanceInsights`: Get AI-powered insights and recommendations

#### Plots Functions (`convex/plots.ts`)
- `getUserPlots`: Get user's plots for dashboard filtering

## Usage

### Accessing the Dashboard
1. Sign in to your account
2. Navigate to `/dashboard` or click "Dashboard" in the navigation bar
3. Select a time range and optionally filter by specific plots
4. View your analytics data and insights

### Testing Analytics
1. Visit `/test-analytics` to test the analytics system
2. Use the test buttons to record sample events and verify data collection
3. Check that queries return expected data

### Recording Events
Events are automatically recorded when:
- Users visit plots
- AI chatbot interactions occur
- Leads are generated
- Revenue events happen

Manual event recording:
```typescript
const recordEvent = useMutation(api.analytics.recordEvent);

await recordEvent({
  plotId: 'plot_id_here',
  visitors: 1, // optional: number of visitors
  interactions: 1, // optional: number of interactions
  leadsGenerated: 0, // optional: number of leads
  revenue: 0 // optional: revenue amount
});
```

## Components Created

### UI Components
- `Card`, `CardHeader`, `CardTitle`, `CardContent`: Basic card components
- `Button`: Reusable button component with variants
- `Select`, `SelectContent`, `SelectItem`: Dropdown selection components

### Pages
- `/dashboard`: Main analytics dashboard
- `/test-analytics`: Analytics testing and debugging page

## Data Schema

The analytics system uses the following Convex tables:
- `analytics`: Daily aggregated metrics
- `revenueEvents`: Financial transaction records
- `leads`: Lead generation data
- `aiInteractions`: AI chatbot interaction logs

## Performance Insights

The system provides automated insights based on:
- Revenue performance vs. industry benchmarks
- Conversion rate analysis
- Traffic volume assessment
- AI interaction quality scoring

Recommendations are generated for:
- Subscription upgrades
- Feature enablement
- Content optimization
- Traffic improvement strategies

## Next Steps

1. **Real Data Integration**: Replace placeholder data with actual metrics
2. **Advanced Charts**: Add more sophisticated visualization components
3. **Export Functionality**: Implement CSV/PDF export features
4. **Alert System**: Add notifications for significant metric changes
5. **A/B Testing**: Implement split testing for optimization

## Troubleshooting

### Common Issues
1. **No data showing**: Ensure events are being recorded and user has plots
2. **Permission errors**: Verify user authentication and plot ownership
3. **Loading issues**: Check Convex connection and API endpoints

### Debug Tools
- Use `/test-analytics` page to verify system functionality
- Check browser console for error messages
- Verify Convex dashboard for data presence