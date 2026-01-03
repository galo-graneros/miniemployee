import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyWebhookSignature, type WebhookEvent } from '@/lib/lemonsqueezy'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-signature') || ''

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event: WebhookEvent = JSON.parse(rawBody)
    const eventName = event.meta.event_name
    const userId = event.meta.custom_data?.user_id

    console.log(`LemonSqueezy webhook: ${eventName}`, { userId })

    switch (eventName) {
      case 'subscription_created':
        await handleSubscriptionCreated(event, userId)
        break
      
      case 'subscription_updated':
        await handleSubscriptionUpdated(event)
        break
      
      case 'subscription_cancelled':
        await handleSubscriptionCancelled(event)
        break
      
      case 'subscription_resumed':
        await handleSubscriptionResumed(event)
        break
      
      case 'subscription_expired':
        await handleSubscriptionExpired(event)
        break
      
      case 'subscription_payment_success':
        await handlePaymentSuccess(event)
        break
      
      case 'subscription_payment_failed':
        await handlePaymentFailed(event)
        break
      
      default:
        console.log(`Unhandled event: ${eventName}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionCreated(event: WebhookEvent, userId?: string) {
  const { data } = event
  const attrs = data.attributes

  if (!userId) {
    console.error('No user_id in subscription_created event')
    return
  }

  // Determine plan type based on variant
  const planName = attrs.variant_name.toLowerCase().includes('year') ? 'yearly' : 'monthly'

  // Create subscription record
  await supabaseAdmin.from('subscriptions').insert({
    user_id: userId,
    lemonsqueezy_subscription_id: data.id,
    lemonsqueezy_order_id: attrs.order_id.toString(),
    lemonsqueezy_product_id: attrs.product_id.toString(),
    lemonsqueezy_variant_id: attrs.variant_id.toString(),
    plan_name: planName,
    status: 'active',
    price_cents: planName === 'yearly' ? 49000 : 4900,
    current_period_start: new Date().toISOString(),
    current_period_end: attrs.renews_at,
    update_payment_method_url: attrs.urls.update_payment_method,
    customer_portal_url: attrs.urls.customer_portal,
  })

  // Update user profile to pro
  await supabaseAdmin.from('profiles').update({
    subscription_tier: 'pro',
    lemonsqueezy_customer_id: attrs.customer_id.toString(),
  }).eq('id', userId)

  console.log(`Subscription created for user ${userId}`)
}

async function handleSubscriptionUpdated(event: WebhookEvent) {
  const { data } = event
  const attrs = data.attributes

  // Find subscription by LemonSqueezy ID
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('lemonsqueezy_subscription_id', data.id)
    .single()

  if (!subscription) {
    console.error('Subscription not found:', data.id)
    return
  }

  const planName = attrs.variant_name.toLowerCase().includes('year') ? 'yearly' : 'monthly'

  await supabaseAdmin.from('subscriptions').update({
    plan_name: planName,
    lemonsqueezy_variant_id: attrs.variant_id.toString(),
    current_period_end: attrs.renews_at,
    cancel_at_period_end: attrs.cancelled,
    update_payment_method_url: attrs.urls.update_payment_method,
    customer_portal_url: attrs.urls.customer_portal,
  }).eq('lemonsqueezy_subscription_id', data.id)

  console.log(`Subscription updated: ${data.id}`)
}

async function handleSubscriptionCancelled(event: WebhookEvent) {
  const { data } = event

  // Find subscription
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('lemonsqueezy_subscription_id', data.id)
    .single()

  if (!subscription) return

  await supabaseAdmin.from('subscriptions').update({
    status: 'cancelled',
    cancel_at_period_end: true,
    cancelled_at: new Date().toISOString(),
  }).eq('lemonsqueezy_subscription_id', data.id)

  console.log(`Subscription cancelled: ${data.id}`)
}

async function handleSubscriptionResumed(event: WebhookEvent) {
  const { data } = event
  const attrs = data.attributes

  await supabaseAdmin.from('subscriptions').update({
    status: 'active',
    cancel_at_period_end: false,
    cancelled_at: null,
    current_period_end: attrs.renews_at,
  }).eq('lemonsqueezy_subscription_id', data.id)

  console.log(`Subscription resumed: ${data.id}`)
}

async function handleSubscriptionExpired(event: WebhookEvent) {
  const { data } = event

  // Find subscription
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('lemonsqueezy_subscription_id', data.id)
    .single()

  if (!subscription) return

  await supabaseAdmin.from('subscriptions').update({
    status: 'expired',
  }).eq('lemonsqueezy_subscription_id', data.id)

  // Downgrade user to free
  await supabaseAdmin.from('profiles').update({
    subscription_tier: 'free',
    credits_remaining: 5,
    credits_reset_at: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
  }).eq('id', subscription.user_id)

  console.log(`Subscription expired: ${data.id}, user downgraded`)
}

async function handlePaymentSuccess(event: WebhookEvent) {
  const { data } = event
  const attrs = data.attributes

  // Find subscription
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('id, user_id, plan_name')
    .eq('lemonsqueezy_subscription_id', data.id)
    .single()

  if (!subscription) return

  // Record billing history
  await supabaseAdmin.from('billing_history').insert({
    user_id: subscription.user_id,
    subscription_id: subscription.id,
    description: `${subscription.plan_name === 'yearly' ? 'Annual' : 'Monthly'} subscription payment`,
    amount_cents: subscription.plan_name === 'yearly' ? 49000 : 4900,
    status: 'paid',
    billing_date: new Date().toISOString(),
  })

  // Update subscription period
  await supabaseAdmin.from('subscriptions').update({
    status: 'active',
    current_period_end: attrs.renews_at,
  }).eq('lemonsqueezy_subscription_id', data.id)

  console.log(`Payment success for subscription: ${data.id}`)
}

async function handlePaymentFailed(event: WebhookEvent) {
  const { data } = event

  // Find subscription
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('id, user_id, plan_name')
    .eq('lemonsqueezy_subscription_id', data.id)
    .single()

  if (!subscription) return

  await supabaseAdmin.from('subscriptions').update({
    status: 'past_due',
  }).eq('lemonsqueezy_subscription_id', data.id)

  // Record failed payment
  await supabaseAdmin.from('billing_history').insert({
    user_id: subscription.user_id,
    subscription_id: subscription.id,
    description: 'Payment failed',
    amount_cents: subscription.plan_name === 'yearly' ? 49000 : 4900,
    status: 'failed',
    billing_date: new Date().toISOString(),
  })

  console.log(`Payment failed for subscription: ${data.id}`)
}
