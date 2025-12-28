'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '£0',
    period: 'forever',
    description: 'Perfect for trying out meal planning',
    features: [
      'Up to 42 meals',
      'Basic meal planning',
      'Shopping list generation',
      'Meal suggestions',
      'Mobile access',
    ],
    limitations: [
      'Limited to 42 meals',
      'Single meal plan at a time',
    ],
    cta: 'Get Started',
    ctaLink: '/signup',
    highlighted: false,
  },
  {
    name: 'Premium',
    price: '£4.99',
    period: 'per month',
    description: 'Unlimited meal planning for serious home cooks',
    features: [
      'Unlimited meals',
      'Multiple meal plans',
      'Advanced analytics',
      'Recipe scraping (coming soon)',
      'Priority support',
      'Export to PDF',
      'Meal history insights',
      'Custom categories',
    ],
    limitations: [],
    cta: 'Upgrade to Premium',
    ctaLink: '/api/stripe/checkout',
    highlighted: true,
  },
];

export default function PricingPage() {
  const [_billingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start free and upgrade when you&apos;re ready. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border-2 p-8 ${
                plan.highlighted
                  ? 'border-green-500 shadow-xl scale-105'
                  : 'border-gray-200 shadow-md'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 ml-2">/{plan.period}</span>
                </div>
              </div>

              <Link
                href={plan.ctaLink}
                className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors mb-6 ${
                  plan.highlighted
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </Link>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  What&apos;s included:
                </p>
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {plan.limitations.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                    Limitations:
                  </p>
                  {plan.limitations.map((limitation) => (
                    <div key={limitation} className="flex items-start mb-2">
                      <span className="text-gray-500 text-sm">• {limitation}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can cancel your subscription at any time. You&apos;ll continue to have access until the end of your billing period.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happens to my data if I downgrade?
              </h3>
              <p className="text-gray-600">
                Your data is never deleted. If you downgrade to the free tier, you&apos;ll keep all your meals but won&apos;t be able to add more than 42 total meals.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is my payment information secure?
              </h3>
              <p className="text-gray-600">
                Absolutely. We use Stripe for payment processing, which is PCI-DSS compliant. We never store your credit card information on our servers.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                We offer a 14-day money-back guarantee. If you&apos;re not satisfied with Premium, contact us within 14 days for a full refund.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            Still have questions?{' '}
            <a href="mailto:support@forkast.app" className="text-green-600 hover:underline">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
