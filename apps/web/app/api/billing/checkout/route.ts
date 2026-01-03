import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createCheckout, lemonSqueezyConfig } from '@/lib/lemonsqueezy'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json()
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get variant ID based on plan
    let variantId: string
    if (plan === 'monthly') {
      variantId = lemonSqueezyConfig.monthlyVariantId
    } else if (plan === 'yearly') {
      variantId = lemonSqueezyConfig.yearlyVariantId
    } else {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    if (!variantId) {
      return NextResponse.json(
        { error: 'Billing not configured. Please contact support.' },
        { status: 500 }
      )
    }

    // Create checkout URL
    const checkoutUrl = await createCheckout(
      variantId,
      user.id,
      user.email || '',
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?checkout=success`
    )

    return NextResponse.json({ checkoutUrl })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout' },
      { status: 500 }
    )
  }
}
