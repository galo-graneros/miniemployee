import { createClient } from './supabase'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

// Helper to call Supabase Edge Functions
async function callEdgeFunction<T>(
  functionName: string, 
  options: {
    method?: 'GET' | 'POST' | 'DELETE' | 'PATCH'
    body?: Record<string, unknown>
  } = {}
): Promise<T> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: options.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || 'Function call failed')
  }

  return data
}

// ==================== 2FA Functions ====================

export interface Setup2FAResponse {
  success: boolean
  secret: string
  otpauthUrl: string
  backupCodes: string[]
}

export async function setup2FA(): Promise<Setup2FAResponse> {
  return callEdgeFunction<Setup2FAResponse>('setup-2fa')
}

export async function verify2FA(code: string): Promise<{ success: boolean }> {
  return callEdgeFunction('verify-2fa', { body: { code } })
}

export async function disable2FA(code: string): Promise<{ success: boolean }> {
  return callEdgeFunction('disable-2fa', { body: { code } })
}

// ==================== Billing Functions ====================

export interface CheckoutResponse {
  success: boolean
  checkoutUrl: string
}

export async function createCheckout(variantId: 'monthly' | 'yearly'): Promise<CheckoutResponse> {
  return callEdgeFunction<CheckoutResponse>('create-checkout', { body: { variantId } })
}

export interface SubscriptionStatus {
  success: boolean
  tier: 'free' | 'pro' | 'enterprise'
  has_subscription: boolean
  subscription: {
    id: string
    plan_name: string
    status: string
    cancel_at_period_end: boolean
    current_period_end: string
  } | null
  billing_history: Array<{
    id: string
    amount: number
    currency: string
    description: string
    status: string
    created_at: string
  }>
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  return callEdgeFunction<SubscriptionStatus>('manage-subscription', { method: 'GET' })
}

export async function cancelSubscription(): Promise<{ success: boolean; ends_at?: string }> {
  return callEdgeFunction('manage-subscription', { body: { action: 'cancel' } })
}

export async function resumeSubscription(): Promise<{ success: boolean }> {
  return callEdgeFunction('manage-subscription', { body: { action: 'resume' } })
}

// ==================== Account Functions ====================

export async function deleteAccount(): Promise<{ success: boolean; message: string }> {
  return callEdgeFunction('delete-account', { method: 'DELETE' })
}

// ==================== RPC Functions (direct database calls) ====================

export async function canCreateTask(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('can_create_task', { p_user_id: userId })
  if (error) throw error
  return data
}

export async function deductCredit(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('increment_usage', { p_user_id: userId })
  if (error) throw error
  return data
}

export async function get2FAStatus(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_2fa_status', { p_user_id: userId })
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
