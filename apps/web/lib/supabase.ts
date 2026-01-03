import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

// Type definitions for our database
export type TaskStatus =
    | 'pending'
    | 'running'
    | 'waiting_for_secret'
    | 'completed'
    | 'failed'
    | 'cancelled';

export interface Task {
    id: string;
    user_id: string;
    chat_id: string | null;
    prompt: string;
    task_type: string;
    status: TaskStatus;
    progress: number;
    required_input: {
        type: string;
        field_name: string;
        hint: string;
    } | null;
    user_provided_input: string | null;
    logs: Array<{
        timestamp: string;
        message: string;
        type: 'info' | 'success' | 'warning' | 'error';
    }>;
    result: Record<string, unknown> | null;
    error_message: string | null;
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
    updated_at: string;
}

export interface Message {
    id: string;
    chat_id: string;
    user_id: string;
    role: 'user' | 'assistant' | 'system' | 'agent_log';
    content: string;
    metadata: Record<string, unknown>;
    created_at: string;
}

export interface Chat {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

export interface Profile {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    subscription_tier: 'free' | 'pro' | 'enterprise';
    created_at: string;
    updated_at: string;
}
