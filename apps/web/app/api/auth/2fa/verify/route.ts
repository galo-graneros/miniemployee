import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticator } from 'otplib'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

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

    // Get the stored secret
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('two_factor_secret')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.two_factor_secret) {
      return NextResponse.json(
        { error: '2FA not setup. Please start setup first.' },
        { status: 400 }
      )
    }

    // Verify the code
    const isValid = authenticator.verify({
      token: code,
      secret: profile.two_factor_secret,
    })

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Enable 2FA
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ two_factor_enabled: true })
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('2FA verify error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify 2FA' },
      { status: 500 }
    )
  }
}
