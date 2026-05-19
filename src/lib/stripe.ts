import Stripe from 'stripe';

// ---------------------------------------------------------------------------
// Lazy initialisation — prevents the module from crashing the Next.js build
// when STRIPE_SECRET_KEY isn't set at build time.  The key only needs to be
// present when a Stripe API route is actually invoked.
// ---------------------------------------------------------------------------

let _stripe: Stripe | null = null;

function getStripeClient(): Stripe {
  if (_stripe) return _stripe;

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
  }

  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    // @ts-expect-error - Using latest Stripe API version
    apiVersion: '2025-01-27.acacia',
    typescript: true,
  });

  return _stripe;
}

/**
 * Lazy Stripe client.  Behaves identically to a Stripe instance but defers
 * instantiation until the first property access.  All consumers that previously
 * did `import { stripe } from '@/lib/stripe'` continue to work unchanged.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop: string | symbol) {
    const client = getStripeClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || '';
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
