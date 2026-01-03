// LemonSqueezy API Integration
// Documentation: https://docs.lemonsqueezy.com/api

const LEMONSQUEEZY_API_URL = 'https://api.lemonsqueezy.com/v1'

interface LemonSqueezyConfig {
  apiKey: string
  storeId: string
  monthlyVariantId: string
  yearlyVariantId: string
  webhookSecret: string
}

export const lemonSqueezyConfig: LemonSqueezyConfig = {
  apiKey: process.env.LEMONSQUEEZY_API_KEY || '',
  storeId: process.env.LEMONSQUEEZY_STORE_ID || '',
  monthlyVariantId: process.env.LEMONSQUEEZY_MONTHLY_VARIANT_ID || '',
  yearlyVariantId: process.env.LEMONSQUEEZY_YEARLY_VARIANT_ID || '',
  webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '',
}

// Plans configuration
export const PLANS = {
  free: {
    name: 'Free Trial',
    price: 0,
    credits: 5,
    features: [
      '5 AI tasks per month',
      'Basic browser automation',
      'Email support',
      '1 concurrent task',
    ],
  },
  monthly: {
    name: 'Pro Monthly',
    price: 49,
    variantId: lemonSqueezyConfig.monthlyVariantId,
    features: [
      'Unlimited AI tasks',
      'Advanced browser automation',
      'Priority support',
      '1 concurrent task',
      'Secrets vault',
      'Task history',
    ],
  },
  yearly: {
    name: 'Pro Yearly',
    price: 490,
    priceMonthly: 40.83, // ~$490/12
    variantId: lemonSqueezyConfig.yearlyVariantId,
    savings: '2 months free',
    features: [
      'Unlimited AI tasks',
      'Advanced browser automation',
      'Priority support',
      '1 concurrent task',
      'Secrets vault',
      'Task history',
    ],
  },
}

async function lemonSqueezyFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${LEMONSQUEEZY_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${lemonSqueezyConfig.apiKey}`,
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.detail || 'LemonSqueezy API error')
  }

  return response.json()
}

export async function createCheckout(
  variantId: string,
  userId: string,
  email: string,
  redirectUrl: string
) {
  const data = await lemonSqueezyFetch('/checkouts', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email,
            custom: {
              user_id: userId,
            },
          },
          checkout_options: {
            embed: false,
            media: true,
            logo: true,
          },
          product_options: {
            enabled_variants: [parseInt(variantId)],
            redirect_url: redirectUrl,
            receipt_link_url: redirectUrl,
            receipt_button_text: 'Go to Dashboard',
          },
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: lemonSqueezyConfig.storeId,
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: variantId,
            },
          },
        },
      },
    }),
  })

  return data.data.attributes.url
}

export async function getSubscription(subscriptionId: string) {
  const data = await lemonSqueezyFetch(`/subscriptions/${subscriptionId}`)
  return data.data
}

export async function cancelSubscription(subscriptionId: string) {
  const data = await lemonSqueezyFetch(`/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
  })
  return data.data
}

export async function resumeSubscription(subscriptionId: string) {
  const data = await lemonSqueezyFetch(`/subscriptions/${subscriptionId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      data: {
        type: 'subscriptions',
        id: subscriptionId,
        attributes: {
          cancelled: false,
        },
      },
    }),
  })
  return data.data
}

export async function updateSubscription(
  subscriptionId: string,
  variantId: string
) {
  const data = await lemonSqueezyFetch(`/subscriptions/${subscriptionId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      data: {
        type: 'subscriptions',
        id: subscriptionId,
        attributes: {
          variant_id: parseInt(variantId),
        },
      },
    }),
  })
  return data.data
}

export async function getCustomerPortalUrl(customerId: string) {
  const data = await lemonSqueezyFetch(`/customers/${customerId}`)
  return data.data.attributes.urls.customer_portal
}

// Webhook signature verification
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', lemonSqueezyConfig.webhookSecret)
  const digest = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  )
}

export interface WebhookEvent {
  meta: {
    event_name: string
    custom_data?: {
      user_id?: string
    }
  }
  data: {
    id: string
    type: string
    attributes: {
      store_id: number
      customer_id: number
      order_id: number
      product_id: number
      variant_id: number
      product_name: string
      variant_name: string
      status: string
      status_formatted: string
      card_brand: string | null
      card_last_four: string | null
      pause: null | object
      cancelled: boolean
      trial_ends_at: string | null
      billing_anchor: number
      first_subscription_item: {
        id: number
        subscription_id: number
        price_id: number
        quantity: number
        created_at: string
        updated_at: string
      }
      urls: {
        update_payment_method: string
        customer_portal: string
      }
      renews_at: string
      ends_at: string | null
      created_at: string
      updated_at: string
      test_mode: boolean
    }
  }
}
