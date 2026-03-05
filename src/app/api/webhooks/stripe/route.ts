import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/lib/env';
import { stripe } from '@/lib/stripe/server';
import { createAdminClient } from '@/lib/supabase/admin';

import type Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Tipos temporales para operaciones en subscriptions.
// Se eliminan cuando CAJA_3 genere los tipos reales de Database.
interface SubscriptionRow {
  user_id: string;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;
      default:
        // Evento no reconocido — ignorar silenciosamente
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[STRIPE_WEBHOOK] event=${event.id} error=${message}`);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

// Helper para queries tipadas en tabla subscriptions (placeholder Database).
// Se elimina cuando CAJA_3 genere los tipos reales.
function subscriptions(supabase: ReturnType<typeof createAdminClient>) {
  // Database placeholder tiene Tables: Record<string, never>.
  // Las columnas reales se definen en CAJA_3. Este cast es seguro para el webhook.
  return supabase.from('subscriptions') as unknown as {
    select: (columns: string) => {
      eq: (
        col: string,
        val: string,
      ) => {
        eq: (
          col: string,
          val: string,
        ) => { maybeSingle: () => Promise<{ data: SubscriptionRow | null; error: unknown }> };
        maybeSingle: () => Promise<{ data: SubscriptionRow | null; error: unknown }>;
      };
    };
    update: (values: Partial<SubscriptionRow>) => {
      eq: (
        col: string,
        val: string,
      ) => {
        select: (
          columns: string,
        ) => Promise<{ data: SubscriptionRow[] | null; error: { message: string } | null }>;
      };
    };
  };
}

async function handleCheckoutCompleted(event: Stripe.CheckoutSessionCompletedEvent) {
  const session = event.data.object;
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
  const userId = session.metadata?.userId;

  if (!userId || !subscriptionId || !customerId) {
    console.error(
      `[STRIPE_WEBHOOK] event=${event.id} type=checkout.session.completed missing required fields`,
    );
    return;
  }

  // Obtener detalles de la suscripcion para current_period_end
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000).toISOString();

  const supabase = createAdminClient();
  const table = subscriptions(supabase);

  // Idempotencia: verificar que no exista ya un registro con este stripe_subscription_id
  const { data: existing } = await table
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .eq('status', 'active')
    .maybeSingle();

  if (existing) {
    console.log(
      `[STRIPE_WEBHOOK] event=${event.id} type=checkout.session.completed already processed`,
    );
    return;
  }

  const { error } = await table
    .update({
      status: 'active',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      current_period_end: currentPeriodEnd,
    })
    .eq('user_id', userId)
    .select('user_id, status, current_period_end');

  if (error) {
    console.error(
      `[STRIPE_WEBHOOK] event=${event.id} type=checkout.session.completed db_error=${error.message}`,
    );
    return;
  }

  console.log(
    `[STRIPE_WEBHOOK] event=${event.id} type=checkout.session.completed userId=${userId}`,
  );
}

async function handleInvoicePaid(event: Stripe.InvoicePaidEvent) {
  const invoice = event.data.object;
  const subscriptionId =
    typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;

  if (!subscriptionId) {
    console.error(`[STRIPE_WEBHOOK] event=${event.id} type=invoice.paid missing subscriptionId`);
    return;
  }

  // Obtener detalles actualizados de la suscripcion
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000).toISOString();

  const supabase = createAdminClient();
  const table = subscriptions(supabase);

  // Idempotencia: verificar que current_period_end no sea ya >= al nuevo periodo
  const { data: existing } = await table
    .select('current_period_end')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();

  if (existing?.current_period_end && existing.current_period_end >= currentPeriodEnd) {
    console.log(`[STRIPE_WEBHOOK] event=${event.id} type=invoice.paid already processed`);
    return;
  }

  const { error } = await table
    .update({
      status: 'active',
      current_period_end: currentPeriodEnd,
    })
    .eq('stripe_subscription_id', subscriptionId)
    .select('user_id, status, current_period_end');

  if (error) {
    console.error(`[STRIPE_WEBHOOK] event=${event.id} type=invoice.paid db_error=${error.message}`);
    return;
  }

  console.log(
    `[STRIPE_WEBHOOK] event=${event.id} type=invoice.paid subscriptionId=${subscriptionId}`,
  );
}

async function handleInvoicePaymentFailed(event: Stripe.InvoicePaymentFailedEvent) {
  const invoice = event.data.object;
  const subscriptionId =
    typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;

  if (!subscriptionId) {
    console.error(
      `[STRIPE_WEBHOOK] event=${event.id} type=invoice.payment_failed missing subscriptionId`,
    );
    return;
  }

  const supabase = createAdminClient();
  const table = subscriptions(supabase);

  const { error } = await table
    .update({ status: 'limbo' })
    .eq('stripe_subscription_id', subscriptionId)
    .select('user_id, status');

  if (error) {
    console.error(
      `[STRIPE_WEBHOOK] event=${event.id} type=invoice.payment_failed db_error=${error.message}`,
    );
    return;
  }

  console.log(
    `[STRIPE_WEBHOOK] event=${event.id} type=invoice.payment_failed subscriptionId=${subscriptionId}`,
  );
}

async function handleSubscriptionDeleted(event: Stripe.CustomerSubscriptionDeletedEvent) {
  const stripeSubscription = event.data.object;
  const subscriptionId = stripeSubscription.id;

  const supabase = createAdminClient();
  const table = subscriptions(supabase);

  const { error } = await table
    .update({ status: 'cancelled' })
    .eq('stripe_subscription_id', subscriptionId)
    .select('user_id, status');

  if (error) {
    console.error(
      `[STRIPE_WEBHOOK] event=${event.id} type=customer.subscription.deleted db_error=${error.message}`,
    );
    return;
  }

  console.log(
    `[STRIPE_WEBHOOK] event=${event.id} type=customer.subscription.deleted subscriptionId=${subscriptionId}`,
  );
}
