'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Crown, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { PaperPage } from '@/components/layout/PaperPage';

interface SubscriptionData {
  subscription_status: 'free' | 'premium';
  subscription_current_period_end: string | null;
  stripe_customer_id: string | null;
}

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [mealCount, setMealCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function loadAccountData() {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Get subscription data
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_current_period_end, stripe_customer_id')
        .eq('id', user.id)
        .single();

      setSubscription(profile);

      // Get meal count
      const { count } = await supabase
        .from('meals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setMealCount(count || 0);
      setLoading(false);
    }

    loadAccountData();
  }, [router]);

  const handleManageBilling = async () => {
    const response = await fetch('/api/stripe/portal', {
      method: 'POST',
    });

    if (response.ok) {
      const { url } = await response.json();
      window.location.href = url;
    }
  };

  if (loading) {
    return (
      <PaperPage>
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forkast-crimson mx-auto"></div>
            <p className="mt-4 text-forkast-ink-soft font-serif">Loading account...</p>
          </div>
        </div>
      </PaperPage>
    );
  }

  const isPremium = subscription?.subscription_status === 'premium';
  const periodEnd = subscription?.subscription_current_period_end 
    ? new Date(subscription.subscription_current_period_end)
    : null;

  return (
    <PaperPage>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-hand font-bold text-forkast-ink mb-8">Account Settings</h1>

        {/* Subscription Status Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${isPremium ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                <Crown className={`w-6 h-6 ${isPremium ? 'text-yellow-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {isPremium ? 'Premium Plan' : 'Free Plan'}
                </h2>
                <p className="text-sm text-gray-600">
                  {isPremium ? '£4.99/month' : 'Limited to 42 meals'}
                </p>
              </div>
            </div>
            {!isPremium && (
              <Link
                href="/pricing"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Upgrade
              </Link>
            )}
          </div>

          {isPremium && periodEnd && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <Calendar className="w-4 h-4" />
              <span>
                Renews on {periodEnd.toLocaleDateString('en-GB', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          )}

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Meals used</span>
              <span className="text-sm font-semibold text-gray-900">
                {mealCount} {isPremium ? '(unlimited)' : '/ 42'}
              </span>
            </div>
            {!isPremium && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((mealCount / 42) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Billing Management */}
        {isPremium && subscription?.stripe_customer_id && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-100">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Billing & Payments</h2>
                  <p className="text-sm text-gray-600">
                    Manage your payment methods and billing history
                  </p>
                </div>
              </div>
              <button
                onClick={handleManageBilling}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                Manage
              </button>
            </div>
          </div>
        )}

        {/* Free Tier Warning */}
        {!isPremium && mealCount >= 35 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-1">
                  Approaching Meal Limit
                </h3>
                <p className="text-sm text-yellow-800 mb-3">
                  You have {42 - mealCount} meal{42 - mealCount === 1 ? '' : 's'} remaining on the free tier.
                  Upgrade to Premium for unlimited meals.
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center text-sm font-medium text-yellow-900 hover:text-yellow-800"
                >
                  View Pricing →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Taste Preferences */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-100">
                <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none">
                  <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Taste Preferences</h2>
                <p className="text-sm text-gray-600">Dietary needs, disliked ingredients and meal styles</p>
              </div>
            </div>
            <Link
              href="/onboarding"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 text-sm"
            >
              Edit
            </Link>
          </div>
        </div>

        {/* Features List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isPremium ? 'Your Premium Features' : 'Upgrade to Premium'}
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                isPremium ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {isPremium ? (
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <span className={isPremium ? 'text-gray-900' : 'text-gray-500'}>
                Unlimited meals
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                isPremium ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {isPremium ? (
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <span className={isPremium ? 'text-gray-900' : 'text-gray-500'}>
                Multiple meal plans
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                isPremium ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {isPremium ? (
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <span className={isPremium ? 'text-gray-900' : 'text-gray-500'}>
                Advanced analytics
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                isPremium ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {isPremium ? (
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <span className={isPremium ? 'text-gray-900' : 'text-gray-500'}>
                Priority support
              </span>
            </div>
          </div>
        </div>
      </div>
    </PaperPage>
  );
}
