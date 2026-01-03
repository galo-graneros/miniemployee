import { createClient } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  subscriptionTier: 'free' | 'pro' | 'enterprise'
  creditsRemaining: number
  creditsResetAt: string | null
  twoFactorEnabled: boolean
  accountStatus: 'active' | 'suspended' | 'pending_deletion'
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  subscription_tier: 'free' | 'pro' | 'enterprise'
  credits_remaining: number
  credits_reset_at: string | null
  two_factor_enabled: boolean
  account_status: 'active' | 'suspended' | 'pending_deletion'
  deletion_requested_at: string | null
  lemonsqueezy_customer_id: string | null
}

// Password validation rules
export const PASSWORD_RULES = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`Password must be at least ${PASSWORD_RULES.minLength} characters`)
  }
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (PASSWORD_RULES.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  if (PASSWORD_RULES.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return { valid: errors.length === 0, errors }
}

export async function signUp(email: string, password: string, fullName: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resetPassword(email: string) {
  const supabase = createClient()
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  if (error) throw error
}

export async function updatePassword(newPassword: string) {
  const supabase = createClient()
  
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) throw error
}

export async function getSession(): Promise<Session | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser(): Promise<User | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null
  return data
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function canCreateTask(userId: string): Promise<{ allowed: boolean; reason: string; message?: string; credits_remaining?: number }> {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('can_create_task', { p_user_id: userId })
  
  if (error) throw error
  return data
}

export async function deductCredit(userId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('deduct_credit', { p_user_id: userId })
  
  if (error) throw error
  return data
}

export async function requestAccountDeletion(userId: string) {
  const supabase = createClient()
  
  const { error } = await supabase.rpc('request_account_deletion', { p_user_id: userId })
  
  if (error) throw error
}

export async function cancelAccountDeletion(userId: string) {
  const supabase = createClient()
  
  const { error } = await supabase.rpc('cancel_account_deletion', { p_user_id: userId })
  
  if (error) throw error
}

export function transformProfile(profile: Profile): AuthUser {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    subscriptionTier: profile.subscription_tier,
    creditsRemaining: profile.credits_remaining,
    creditsResetAt: profile.credits_reset_at,
    twoFactorEnabled: profile.two_factor_enabled,
    accountStatus: profile.account_status,
  }
}
