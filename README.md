# 01 City

01 City is a full-featured 3D web application where anyone can build a personalized plot in a shared, interactive online city. Users can customize a main building, add a garden, and create optional sub-buildings like cafes, studios, or galleries.

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
