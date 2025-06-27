'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation } from 'convex/react';
import { useUser } from '@clerk/nextjs';
import { api } from '../../../convex/_generated/api';
import { CheckIcon, XMarkIcon, SparklesIcon, RocketLaunchIcon, BuildingOfficeIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  interval: string;
  description: string;
  features: string[];
  limits: {
    plots: number;
    aiCredits: number;
    customModels: number;
    analytics: boolean;
    priority: boolean;
  };
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  popular?: boolean;
  color: string;
}

const subscriptionTiers: SubscriptionTier[] = [
  {
    id: 'startup',
    name: 'Startup District',
    price: 99,
    interval: 'month',
    description: 'Perfect for entrepreneurs and small businesses starting their digital presence',
    features: [
      'Up to 5 virtual plots',
      '1,000 AI chat credits/month',
      'Basic analytics dashboard',
      'Email support',
      'Custom mailbox addresses',
      'Basic AI chatbot',
      'Lead capture forms'
    ],
    limits: {
      plots: 5,
      aiCredits: 1000,
      customModels: 2,
      analytics: true,
      priority: false
    },
    icon: SparklesIcon,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'business',
    name: 'Business Quarter',
    price: 299,
    interval: 'month',
    description: 'Ideal for growing businesses that need advanced features and analytics',
    features: [
      'Up to 20 virtual plots',
      '5,000 AI chat credits/month',
      'Advanced analytics & insights',
      'Priority email support',
      'Custom domain mailboxes',
      'Advanced AI with personality',
      'CRM integration',
      'A/B testing tools',
      'Custom branding'
    ],
    limits: {
      plots: 20,
      aiCredits: 5000,
      customModels: 10,
      analytics: true,
      priority: true
    },
    icon: RocketLaunchIcon,
    popular: true,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'corporate',
    name: 'Corporate Campus',
    price: 799,
    interval: 'month',
    description: 'Comprehensive solution for established companies with multiple departments',
    features: [
      'Up to 100 virtual plots',
      '20,000 AI chat credits/month',
      'Real-time business intelligence',
      'Dedicated account manager',
      'White-label solutions',
      'Advanced AI automation',
      'Multi-team collaboration',
      'Custom integrations',
      'Advanced security features',
      'API access'
    ],
    limits: {
      plots: 100,
      aiCredits: 20000,
      customModels: 50,
      analytics: true,
      priority: true
    },
    icon: BuildingOfficeIcon,
    color: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Metropolis',
    price: 1999,
    interval: 'month',
    description: 'Ultimate solution for large enterprises with unlimited scalability',
    features: [
      'Unlimited virtual plots',
      'Unlimited AI chat credits',
      'Custom AI model training',
      '24/7 phone & chat support',
      'Dedicated infrastructure',
      'Custom AI personalities',
      'Enterprise SSO',
      'Advanced compliance tools',
      'Custom development',
      'SLA guarantees'
    ],
    limits: {
      plots: -1, // Unlimited
      aiCredits: -1, // Unlimited
      customModels: -1, // Unlimited
      analytics: true,
      priority: true
    },
    icon: GlobeAltIcon,
    color: 'from-amber-500 to-orange-500'
  }
];

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const { user } = useUser();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const currentSubscription = useQuery(
    api.subscriptions.getCurrentSubscription,
    user?.id ? { userId: user.id } : 'skip'
  );
  
  const createSubscription = useMutation(api.subscriptions.createSubscription);
  // Note: updateSubscription mutation may not exist, using createSubscription for now
  
  if (!isOpen) return null;
  
  const handleSubscribe = async (tierId: string) => {
    if (!user?.id) return;
    
    setIsProcessing(true);
    setSelectedTier(tierId);
    
    try {
      // For now, always create a new subscription (update functionality to be implemented)
      await createSubscription({
        userId: user.id,
        tier: tierId
        // Note: paymentMethod removed as it's not in the schema
      });
      
      // In a real implementation, this would redirect to Stripe or handle payment
      console.log(`Subscribing to ${tierId}`);
      onClose();
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setIsProcessing(false);
      setSelectedTier(null);
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };
  
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto z-[10000]">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Choose Your MetroSpace Plan
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Unlock the full potential of your virtual business ecosystem
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          {/* Current Subscription */}
          {currentSubscription && (
            <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Current Plan: {currentSubscription.tier}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {currentSubscription.status === 'active' ? 'Active' : 'Inactive'} • 
                    Renews {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Active Subscription
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Subscription Tiers */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {subscriptionTiers.map((tier) => {
                const Icon = tier.icon;
                const isCurrentTier = currentSubscription?.tier === tier.id;
                const isProcessingThis = isProcessing && selectedTier === tier.id;
                
                return (
                  <div
                    key={tier.id}
                    className={`relative rounded-xl border-2 p-6 transition-all duration-200 ${
                      tier.popular
                        ? 'border-purple-500 shadow-lg scale-105'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    } ${
                      isCurrentTier ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${tier.color} mb-4`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {tier.name}
                      </h3>
                      
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(tier.price)}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">/{tier.interval}</span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        {tier.description}
                      </p>
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckIcon className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    <button
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={isCurrentTier || isProcessingThis}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        isCurrentTier
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          : tier.popular
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                          : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                      } ${
                        isProcessingThis ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isProcessingThis ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : isCurrentTier ? (
                        'Current Plan'
                      ) : (
                        `Upgrade to ${tier.name}`
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            
            {/* Features Comparison */}
            <div className="mt-12">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                Feature Comparison
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                        Feature
                      </th>
                      {subscriptionTiers.map((tier) => (
                        <th key={tier.id} className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                          {tier.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                        Virtual Plots
                      </td>
                      {subscriptionTiers.map((tier) => (
                        <td key={tier.id} className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                          {tier.limits.plots === -1 ? 'Unlimited' : tier.limits.plots}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                        AI Credits/Month
                      </td>
                      {subscriptionTiers.map((tier) => (
                        <td key={tier.id} className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                          {tier.limits.aiCredits === -1 ? 'Unlimited' : tier.limits.aiCredits.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                        Custom Models
                      </td>
                      {subscriptionTiers.map((tier) => (
                        <td key={tier.id} className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                          {tier.limits.customModels === -1 ? 'Unlimited' : tier.limits.customModels}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                        Priority Support
                      </td>
                      {subscriptionTiers.map((tier) => (
                        <td key={tier.id} className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                          {tier.limits.priority ? (
                            <CheckIcon className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <XMarkIcon className="h-4 w-4 text-red-500 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}