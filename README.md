# 01 City - Virtual Land & Advertising Platform

A virtual city platform where users can purchase land, place buildings, and advertise their products or brands. Users can upload custom 3D models (GLB/GLTF format) and create immersive advertising experiences.

## Features

### 🏗️ Land Management
- **Free Land Allocation**: Each user gets 25 free squares to start
- **Paid Land Expansion**: Additional land at $1 per square
- **Custom 3D Models**: Upload GLB/GLTF models for $20 (with subscription discounts)
- **Real-time Availability**: Check available plots in any region

### 💳 Payment System
- **Flexible Pricing**: Pay only for what you need beyond free allocation
- **Stripe Integration**: Secure payment processing
- **Transaction History**: Complete payment tracking and refunds
- **Subscription Tiers**: Basic and Premium plans with benefits

### 👤 User Management
- **User Profiles**: Track spending, land ownership, and subscription status
- **Dashboard Analytics**: Comprehensive overview of user activity
- **Subscription Benefits**: Extra free squares and custom model discounts

## Pricing Structure

### Base Pricing
- **Free Squares**: 25 squares per user
- **Additional Land**: $1.00 per square
- **Custom Model Upload**: $20.00 per model

### Subscription Tiers

#### Basic Plan - $9.99/month
- 50 bonus free squares (75 total)
- 50% discount on custom models ($10 instead of $20)
- Priority support

#### Premium Plan - $19.99/month
- 100 bonus free squares (125 total)
- Free custom model uploads
- Advanced analytics
- Priority support

## API Documentation

### Core Functions

#### Land Purchase
```typescript
// Calculate plot cost before purchase
const cost = await api.query("api/calculatePlotCost", {
  userId: "user123",
  plotSize: { width: 5, depth: 5 },
  hasCustomModel: true
});

// Purchase plot
const result = await api.mutation("api/purchasePlot", {
  userId: "user123",
  position: { x: 10, z: 15 },
  size: { width: 5, depth: 5 },
  building: {
    type: "custom",
    modelUrl: "https://example.com/model.glb",
    customModel: true
  },
  paymentIntentId: "pi_1234567890" // If payment required
});
```

#### Payment Processing
```typescript
// Create payment intent
const paymentIntent = await api.mutation("payments/createPlotPaymentIntent", {
  userId: "user123",
  plotSize: { width: 5, depth: 5 },
  hasCustomModel: true
});

// Confirm payment
const confirmation = await api.mutation("payments/confirmPayment", {
  paymentIntentId: paymentIntent.paymentIntentId,
  status: "succeeded"
});
```

#### User Dashboard
```typescript
// Get user dashboard data
const dashboard = await api.query("api/getUserDashboard", {
  userId: "user123"
});

// Returns:
// - User profile with subscription info
// - All owned plots
// - Recent transactions
// - Usage statistics
```

### Database Schema

#### Users Table
```typescript
interface User {
  userId: string;
  username: string;
  email: string;
  credits: number;
  totalSpent: number;
  subscriptionTier: "free" | "basic" | "premium";
  subscriptionExpiry?: number;
  freeSquaresUsed: number;
  freeSquaresLimit: number;
  createdAt: number;
  updatedAt: number;
}
```

#### Plots Table
```typescript
interface Plot {
  owner: string;
  position: { x: number; z: number };
  size: { width: number; depth: number };
  building: {
    type: string;
    modelUrl?: string;
    customModel?: boolean;
    scale?: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number };
  };
  pricing: {
    totalCost: number;
    freeSquares: number;
    paidSquares: number;
    pricePerSquare: number;
  };
  paymentStatus: "free" | "paid" | "refunded";
  paymentId?: Id<"transactions">;
  metadata?: any;
  createdAt: number;
  updatedAt: number;
}
```

#### Transactions Table
```typescript
interface Transaction {
  userId: string;
  plotId?: Id<"plots">;
  amount: number;
  currency: string;
  type: "plot_purchase" | "subscription_upgrade" | "custom_model_upload";
  paymentProcessor: "stripe";
  transactionId: string;
  status: "pending" | "completed" | "failed" | "refunded";
  metadata?: any;
  createdAt: number;
  updatedAt: number;
}
```

## Frontend Integration

### React Example
```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function LandPurchase({ userId }: { userId: string }) {
  const [plotSize, setPlotSize] = useState({ width: 3, depth: 3 });
  const [hasCustomModel, setHasCustomModel] = useState(false);
  
  // Calculate cost in real-time
  const costCalculation = useQuery(api.api.calculatePlotCost, {
    userId,
    plotSize,
    hasCustomModel
  });
  
  const purchasePlot = useMutation(api.api.purchasePlot);
  const createPaymentIntent = useMutation(api.payments.createPlotPaymentIntent);
  
  const handlePurchase = async () => {
    if (costCalculation?.totalCost > 0) {
      // Create payment intent
      const paymentIntent = await createPaymentIntent({
        userId,
        plotSize,
        hasCustomModel
      });
      
      // Process payment with Stripe
      // ... Stripe payment flow
      
      // Confirm payment and create plot
      await purchasePlot({
        userId,
        position: selectedPosition,
        size: plotSize,
        paymentIntentId: paymentIntent.paymentIntentId
      });
    } else {
      // Free plot
      await purchasePlot({
        userId,
        position: selectedPosition,
        size: plotSize
      });
    }
  };
  
  return (
    <div>
      <h3>Land Purchase</h3>
      <p>Total Cost: {costCalculation?.breakdown.totalCostFormatted}</p>
      <p>Free Squares Used: {costCalculation?.freeSquares}</p>
      <p>Paid Squares: {costCalculation?.paidSquares}</p>
      <button onClick={handlePurchase}>
        {costCalculation?.totalCost > 0 ? 'Purchase Land' : 'Claim Free Land'}
      </button>
    </div>
  );
}
```

## Features

- **Interactive 3D Environment**: Explore a shared virtual city in your browser
- **Personalized Plots**: Create and customize your own space in the city
- **Building Customization**: Choose from different building types, colors, and sizes
- **Gardens & Sub-buildings**: Add gardens with various elements and additional structures
- **Real-time Updates**: See changes from other users in real-time
- **User Authentication**: Secure user accounts and plot ownership

## Tech Stack

- **Frontend**: React, Next.js, TailwindCSS
- **3D Rendering**: React Three Fiber, Three.js
- **Backend**: Convex for real-time data storage and synchronization
- **Authentication**: Clerk
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/01city.git
   cd 01city
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables
   - Copy `.env.local.example` to `.env.local`
   - Fill in the required environment variables:
     - Convex deployment URL
     - Clerk authentication keys

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. In a separate terminal, start the Convex development server
   ```bash
   npx convex dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
01city/
├── convex/              # Convex backend functions and schema
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js app router pages
│   ├── components/       # React components
│   │   ├── 3d/          # 3D components using React Three Fiber
│   │   └── ui/          # UI components
│   └── providers/       # Context providers
├── .env.local.example   # Example environment variables
└── README.md            # Project documentation
```

## Deployment

The application is configured for easy deployment on Vercel:

1. Push your code to a GitHub repository
2. Connect the repository to Vercel
3. Configure the environment variables in Vercel
4. Deploy your Convex backend using `npx convex deploy`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
