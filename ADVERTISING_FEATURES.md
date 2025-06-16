# Advertising Features for 01City

This document outlines the new advertising features that allow companies to advertise their products or services on buildings in the virtual city.

## Overview

The advertising system enables plot owners to:
- Add company information to their buildings
- Upload SVG logos
- Display company websites and contact information
- Showcase company descriptions
- Allow visitors to interact with the advertising content

## Features Added

### 1. Database Schema Updates

#### Plot Schema (`convex/schema.ts`)
Added `advertising` field to the plots table with the following structure:
```typescript
advertising: v.optional(v.object({
  enabled: v.boolean(),
  companyName: v.string(),
  website: v.optional(v.string()),
  logoUrl: v.optional(v.string()),
  logoFileName: v.optional(v.string()),
  description: v.optional(v.string()),
  contactEmail: v.optional(v.string()),
  uploadedAt: v.optional(v.number()),
}))
```

### 2. API Functions

#### Updated Functions
- **`purchasePlot`** (`convex/api.ts`): Now accepts advertising data when creating plots
- **`create`** (`convex/plots.ts`): Updated to handle advertising information

#### New Functions (`convex/advertising.ts`)
- **`uploadLogo`**: Upload and store SVG logos for companies
- **`updateAdvertising`**: Update advertising information for existing plots
- **`getAdvertisingPlots`**: Retrieve all plots with advertising enabled
- **`getPlotAdvertising`**: Get advertising information for a specific plot
- **`searchByCompany`**: Search plots by company name
- **`removeAdvertising`**: Remove advertising from a plot

### 3. UI Components

#### PlotCreator Updates (`src/components/ui/PlotCreator.tsx`)
Added advertising configuration section in Step 3 with:
- Enable/disable advertising toggle
- Company name input (required)
- Website URL input
- SVG logo file upload
- Company description textarea
- Contact email input

#### New Components
- **`AdvertisingDisplay.tsx`**: Modal component to display company advertising information
- **`AdvertisingManager.tsx`**: Management interface for editing advertising settings

## Usage

### For Plot Owners

1. **During Plot Creation**:
   - Navigate to Step 3 of the plot creation process
   - Enable the "Company Advertising" option
   - Fill in company details:
     - Company name (required)
     - Website URL (optional)
     - Upload SVG logo (optional)
     - Company description (optional)
     - Contact email (optional)

2. **Managing Existing Plots**:
   - Use the `AdvertisingManager` component to update advertising settings
   - Enable/disable advertising
   - Update company information
   - Remove advertising entirely

### For Visitors

1. **Viewing Advertising**:
   - Click on buildings with advertising enabled
   - View company information in the `AdvertisingDisplay` modal
   - Click "Visit Website" to open company website
   - Click "Contact Us" to send an email

## Technical Implementation

### Logo Upload
- Only SVG format is supported for scalability and small file size
- Logos are stored as base64 data URLs (for development)
- In production, consider using a file storage service like AWS S3

### Data Validation
- Company name is required when advertising is enabled
- Website URLs are validated for proper format
- Email addresses are validated for proper format
- SVG files are validated by checking file extension and MIME type

### Security Considerations
- User authentication is required for all advertising operations
- Plot ownership is verified before allowing modifications
- Input sanitization is applied to prevent XSS attacks
- File upload validation ensures only SVG files are accepted

## API Endpoints

### Mutations
- `api.advertising.uploadLogo`: Upload company logo
- `api.advertising.updateAdvertising`: Update advertising information
- `api.advertising.removeAdvertising`: Remove advertising from plot

### Queries
- `api.advertising.getAdvertisingPlots`: Get all advertising plots
- `api.advertising.getPlotAdvertising`: Get specific plot advertising
- `api.advertising.searchByCompany`: Search by company name

## Future Enhancements

1. **Analytics**: Track advertising views and interactions
2. **Premium Features**: Paid advertising tiers with enhanced visibility
3. **Moderation**: Admin approval system for advertising content
4. **Categories**: Organize companies by industry categories
5. **Featured Listings**: Highlight specific companies
6. **Advertising Marketplace**: Allow companies to bid for prime locations

## File Structure

```
convex/
├── schema.ts (updated)
├── api.ts (updated)
├── plots.ts (updated)
└── advertising.ts (new)

src/components/ui/
├── PlotCreator.tsx (updated)
├── AdvertisingDisplay.tsx (new)
└── AdvertisingManager.tsx (new)
```

## Testing

To test the advertising features:

1. Create a new plot with advertising enabled
2. Upload an SVG logo and fill in company details
3. Verify the plot is created with advertising data
4. Test the advertising display modal
5. Test updating advertising information
6. Test removing advertising from a plot

## Notes

- The current implementation stores logos as base64 data URLs for simplicity
- For production use, implement proper file storage and CDN integration
- Consider implementing advertising approval workflows for content moderation
- Monitor storage usage as SVG files can vary in size