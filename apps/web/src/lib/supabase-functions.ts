import { supabase } from './supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

// Helper to call Supabase Edge Functions
async function callEdgeFunction(functionName: string, body?: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession()
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Function call failed')
  }

  return response.json()
}

// 2FA Functions
export async function setup2FA() {
  return callEdgeFunction('setup-2fa')
}

export async function verify2FA(code: string) {
  return callEdgeFunction('verify-2fa', { code })
}

export async function disable2FA(code: string) {
  return callEdgeFunction('disable-2fa', { code })
}

// Billing Functions
export async function createCheckout(plan: 'monthly' | 'yearly') {
  return callEdgeFunction('create-checkout', { plan })
}

export async function getSubscriptionStatus() {
  return callEdgeFunction('manage-subscription', { action: 'status' })
}

export async function cancelSubscription() {
  return callEdgeFunction('manage-subscription', { action: 'cancel' })
}

export async function resumeSubscription() {
  return callEdgeFunction('manage-subscription', { action: 'resume' })
}

// Account Functions
export async function deleteAccount() {
  return callEdgeFunction('delete-account')
}

// RPC Functions (direct database calls)
export async function canCreateTask(userId: string) {
  const { data, error } = await supabase.rpc('can_create_task', { p_user_id: userId })
  if (error) throw error
  return data
}

export async function deductCredit(userId: string) {
  const { data, error } = await supabase.rpc('increment_usage', { p_user_id: userId })
  if (error) throw error
  return data
}

export async function get2FAStatus(userId: string) {
  const { data, error } = await supabase.rpc('get_2fa_status', { p_user_id: userId })
  if (error) throw error
  return data
}
