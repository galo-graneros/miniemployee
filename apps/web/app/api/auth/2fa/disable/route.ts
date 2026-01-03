import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    // Get the stored secret and backup codes
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('two_factor_secret, two_factor_backup_codes')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.two_factor_secret) {
      return NextResponse.json(
        { error: '2FA not enabled' },
        { status: 400 }
      )
    }

    // Verify the code using otplib
    const { authenticator } = await import('otplib')
    let isValid = authenticator.verify({
      token: code,
      secret: profile.two_factor_secret,
    })

    // If not valid, check backup codes
    if (!isValid && profile.two_factor_backup_codes) {
      const backupCodes = profile.two_factor_backup_codes as string[]
      const codeIndex = backupCodes.findIndex(
        (c: string) => c.toUpperCase() === code.toUpperCase()
      )
      
      if (codeIndex !== -1) {
        isValid = true
        // Remove used backup code
        backupCodes.splice(codeIndex, 1)
        await supabaseAdmin
          .from('profiles')
          .update({ two_factor_backup_codes: backupCodes })
          .eq('id', user.id)
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Disable 2FA
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        two_factor_enabled: false,
        two_factor_secret: null,
        two_factor_backup_codes: null,
      })
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('2FA disable error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to disable 2FA' },
      { status: 500 }
    )
  }
}
