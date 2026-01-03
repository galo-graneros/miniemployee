import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cancelSubscription, resumeSubscription } from '@/lib/lemonsqueezy'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
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

    // Get user's subscription
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    if (action === 'cancel') {
      await cancelSubscription(subscription.lemonsqueezy_subscription_id)
      
      await supabaseAdmin.from('subscriptions').update({
        cancel_at_period_end: true,
        cancelled_at: new Date().toISOString(),
      }).eq('id', subscription.id)

      return NextResponse.json({ 
        success: true, 
        message: 'Subscription will be cancelled at the end of the billing period' 
      })
    } else if (action === 'resume') {
      await resumeSubscription(subscription.lemonsqueezy_subscription_id)
      
      await supabaseAdmin.from('subscriptions').update({
        cancel_at_period_end: false,
        cancelled_at: null,
      }).eq('id', subscription.id)

      return NextResponse.json({ 
        success: true, 
        message: 'Subscription resumed successfully' 
      })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Subscription management error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to manage subscription' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
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

    // Get user's subscription
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'cancelled', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get billing history
    const { data: billingHistory } = await supabaseAdmin
      .from('billing_history')
      .select('*')
      .eq('user_id', user.id)
      .order('billing_date', { ascending: false })
      .limit(10)

    return NextResponse.json({
      subscription,
      billingHistory: billingHistory || [],
    })
  } catch (error: any) {
    console.error('Get subscription error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get subscription' },
      { status: 500 }
    )
  }
}
