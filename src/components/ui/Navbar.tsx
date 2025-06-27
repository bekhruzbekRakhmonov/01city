'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUser, SignInButton, UserButton } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { EnvelopeIcon, CreditCardIcon, ChartBarIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { MailboxModal } from './MailboxModal';
import { SubscriptionModal } from './SubscriptionModal';
// Id import removed as it's not used
import { api } from '../../../convex/_generated/api';

export function Navbar() {
  const { isSignedIn, user } = useUser();
  const [showMailboxModal, setShowMailboxModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Get user's current subscription and usage
  const currentSubscription = useQuery(
    api.subscriptions.getCurrentSubscription,
    user?.id ? { userId: user.id } : 'skip'
  );
  
  const usageStats = useQuery(
    api.subscriptions.getUsageStats,
    user?.id ? { userId: user.id } : 'skip'
  );
  
  // Get user's plots to find mailbox-enabled plots
  const userPlots = useQuery(
    api.plots.getByUserId,
    user?.id ? { userId: user.id } : 'skip'
  );
  
  // Find the first plot with mailbox enabled for the navbar mailbox
  const mailboxPlot = userPlots?.find(plot => plot.mailbox?.enabled);
  
  // Get subscription tier display info
  const getSubscriptionDisplay = () => {
    if (!currentSubscription) return { name: 'Free', color: 'text-gray-500' };
    
    const tierInfo = {
      startup: { name: 'Startup', color: 'text-blue-500' },
      business: { name: 'Business', color: 'text-purple-500' },
      corporate: { name: 'Corporate', color: 'text-emerald-500' },
      enterprise: { name: 'Enterprise', color: 'text-amber-500' }
    };
    
    return tierInfo[currentSubscription.tier as keyof typeof tierInfo] || { name: 'Free', color: 'text-gray-500' };
  };
  
  const subscriptionDisplay = getSubscriptionDisplay();

  return (
    <nav className="fixed top-0 left-0 right-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <SparklesIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  MetroSpace
                </span>
              </div>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                href="/"
                className="border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Explore
              </Link>
              <Link 
                href="/build"
                className="border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Build
              </Link>
              {isSignedIn && (
                <Link 
                  href="/dashboard"
                  className="border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  <ChartBarIcon className="h-4 w-4 mr-1" />
                  Dashboard
                </Link>
              )}
              {isSignedIn && (
                <Link 
                  href="/my-analytics"
                  className="border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  <ChartBarIcon className="h-4 w-4 mr-1" />
                  My Analytics
                </Link>
              )}
              <Link 
                href="/about"
                className="border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                About
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isSignedIn ? (
              <>
                {/* Subscription Status */}
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="text-xs">
                    <div className={`font-medium ${subscriptionDisplay.color}`}>
                      {subscriptionDisplay.name}
                    </div>
                    {usageStats && (
                      <div className="text-gray-500 dark:text-gray-400">
                        {usageStats.plotsCount} plots
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Subscription Button */}
                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white focus:outline-none"
                  title="Manage Subscription"
                  aria-label="Manage subscription"
                >
                  <CreditCardIcon className="h-5 w-5" />
                </button>
                
                {/* Mailbox Button */}
                <div className="relative">
                  <button 
                    onClick={() => {
                      if (mailboxPlot) {
                        setShowMailboxModal(true);
                      } else {
                        alert('No mailbox-enabled plots found. Create a plot with mailbox enabled to use this feature.');
                      }
                    }}
                    className={`p-2 focus:outline-none ${
                      mailboxPlot 
                        ? 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white' 
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                    title={mailboxPlot ? "Mailbox" : "No mailbox-enabled plots"}
                    aria-label="Open mailbox"
                  >
                    <EnvelopeIcon className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" />
                    )}
                  </button>
                </div>
                
                {/* User Info */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{user.username || user.firstName}</span>
                  <UserButton afterSignOutUrl="/" />
                </div>

              </>
            ) : (
              <div className="flex items-center space-x-4">
                <SignInButton mode="modal">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Sign In
                  </button>
                </SignInButton>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modals - Rendered outside nav to avoid z-index issues */}
      {isSignedIn && (
        <>
          {mailboxPlot && (
            <MailboxModal
              isOpen={showMailboxModal}
              onClose={() => setShowMailboxModal(false)}
              plotId={mailboxPlot._id}
              plotOwnerId={user.id}
              plotMailboxAddress={mailboxPlot.mailbox?.address}
              onMessageRead={() => {
                // Update unread count when messages are read
                setUnreadCount(prev => Math.max(0, prev - 1));
              }}
            />
          )}
          
          <SubscriptionModal
            isOpen={showSubscriptionModal}
            onClose={() => setShowSubscriptionModal(false)}
          />
        </>
      )}
    </nav>
  );
}