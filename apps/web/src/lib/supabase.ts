import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file or deployment settings.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  subscription_tier: 'free' | 'pro'
  credits_remaining: number
  two_factor_enabled: boolean
  created_at: string
  updated_at: string
}

export interface Chat {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  chat_id: string
  role: 'user' | 'assistant' | 'system' | 'agent_log'
  content: string
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  chat_id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting_for_human'
  task_description: string
  result: string | null
  error: string | null
  created_at: string
  updated_at: string
}

export interface SecretVault {
  id: string
  user_id: string
  name: string
  encrypted_value: string
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  lemonsqueezy_subscription_id: string
  status: 'active' | 'cancelled' | 'expired' | 'past_due'
  plan: 'monthly' | 'yearly'
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}
