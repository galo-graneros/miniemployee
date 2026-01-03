import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticator } from 'otplib'

// Create admin client for managing user data
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
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

    // Generate a new secret
    const secret = authenticator.generateSecret()
    
    // Generate the otpauth URL for QR code
    const otpauthUrl = authenticator.keyuri(
      user.email || 'user',
      'AutoAgent',
      secret
    )

    // Generate backup codes
    const backupCodes = Array.from({ length: 8 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    )

    // Store the secret temporarily (user needs to verify before it's fully enabled)
    // We store it in the profile but keep two_factor_enabled as false
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        two_factor_secret: secret,
        two_factor_backup_codes: backupCodes,
      })
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      secret,
      otpauthUrl,
      backupCodes,
    })
  } catch (error: any) {
    console.error('2FA setup error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to setup 2FA' },
      { status: 500 }
    )
  }
}
