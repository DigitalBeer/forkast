'use client';

import Link from 'next/link';
import { Crown } from 'lucide-react';

interface UpgradePromptProps {
  mealCount: number;
  mealLimit: number;
  variant?: 'banner' | 'modal' | 'inline';
}

export function UpgradePrompt({ mealCount, mealLimit, variant = 'banner' }: UpgradePromptProps) {
  const remaining = mealLimit - mealCount;
  const isAtLimit = remaining <= 0;
  const isNearLimit = remaining <= 5 && remaining > 0;

  if (variant === 'banner' && (isAtLimit || isNearLimit)) {
    return (
      <div className={`p-4 rounded-lg border-2 ${
        isAtLimit 
          ? 'bg-red-50 border-red-200' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-gray-900">
                {isAtLimit ? 'Meal Limit Reached' : 'Approaching Meal Limit'}
              </h3>
            </div>
            <p className="text-sm text-gray-700 mb-3">
              {isAtLimit 
                ? `You've reached the free tier limit of ${mealLimit} meals. Upgrade to Premium for unlimited meals!`
                : `You have ${remaining} meal${remaining === 1 ? '' : 's'} remaining on the free tier.`
              }
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'modal' && isAtLimit) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Meal Limit Reached
            </h2>
            <p className="text-gray-600">
              You&apos;ve reached the free tier limit of {mealLimit} meals. Upgrade to Premium for unlimited meals and advanced features!
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">Unlimited meals</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">Multiple meal plans</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">Advanced analytics</span>
            </div>
          </div>

          <Link
            href="/pricing"
            className="block w-full text-center py-3 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            View Pricing
          </Link>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="text-center py-8">
        <Crown className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Unlock Unlimited Meals
        </h3>
        <p className="text-gray-600 mb-4">
          Upgrade to Premium for unlimited meals and advanced features
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Crown className="w-5 h-5 mr-2" />
          Upgrade Now
        </Link>
      </div>
    );
  }

  return null;
}
