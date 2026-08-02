import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { logError, logWarn } from '@/lib/logger';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.EDGE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    logError('POST /api/stripe/webhook (signature)', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 },
    );
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Idempotency: Stripe retries webhook deliveries on timeout/5xx. Record
    // this event id before processing; a unique-violation means it was
    // already handled (e.g. a retried subscription.deleted arriving after
    // the user already re-subscribed must not re-downgrade them).
    const { error: dedupeError } = await supabaseAdmin
      .from('stripe_webhook_events')
      .insert({ id: event.id, type: event.type });

    if (dedupeError) {
      if (dedupeError.code === '23505') {
        console.info(`Ignoring already-processed Stripe event ${event.id}`);
        return NextResponse.json({ received: true, duplicate: true });
      }
      // Fail open on infra errors unrelated to duplication — dropping a
      // real event because the ledger write hiccuped is worse than a rare
      // double-processing.
      logError('POST /api/stripe/webhook (dedupe)', dedupeError);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;

        if (!userId) {
          logWarn('POST /api/stripe/webhook', 'checkout.session.completed with no user ID in metadata');
          break;
        }

        // Update user's subscription status
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'premium',
            stripe_customer_id: session.customer as string,
          })
          .eq('id', userId);

        console.info(`Subscription activated for user ${userId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get user by Stripe customer ID
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!profile) {
          logWarn('POST /api/stripe/webhook', `No profile found for Stripe customer ${customerId}`);
          break;
        }

        const status = subscription.status === 'active' ? 'premium' : 'free';

        const periodEnd = (
          subscription as unknown as { current_period_end?: number }
        ).current_period_end;

        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: status,
            subscription_current_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : null,
          })
          .eq('id', profile.id);

        console.info(`Subscription updated for user ${profile.id}: ${status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get user by Stripe customer ID
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!profile) {
          logWarn('POST /api/stripe/webhook', `No profile found for Stripe customer ${customerId}`);
          break;
        }

        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'free',
            subscription_current_period_end: null,
          })
          .eq('id', profile.id);

        console.info(`Subscription canceled for user ${profile.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Get user by Stripe customer ID
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          logWarn('POST /api/stripe/webhook', `Payment failed for user ${profile.id}`);
          // TODO: Send email notification
        }
        break;
      }

      default:
        console.info(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logError('POST /api/stripe/webhook', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    );
  }
}
