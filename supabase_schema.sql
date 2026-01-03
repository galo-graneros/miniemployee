-- ============================================================================
-- AutoAgent SaaS - Supabase Database Schema
-- ============================================================================
-- This schema defines the database structure for a SaaS platform where users
-- have AI "mini-employees" that execute tasks in a real browser.
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PROFILES TABLE
-- Extended user data linked to Supabase Auth
-- ============================================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    
    -- Credits system for free users (5 credits per month)
    credits_remaining INTEGER DEFAULT 5,
    credits_reset_at TIMESTAMPTZ DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month'),
    
    -- 2FA fields
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT DEFAULT NULL,
    two_factor_backup_codes TEXT[] DEFAULT NULL,
    
    -- Account status
    account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending_deletion')),
    deletion_requested_at TIMESTAMPTZ DEFAULT NULL,
    
    -- LemonSqueezy customer ID
    lemonsqueezy_customer_id TEXT DEFAULT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- CHATS TABLE
-- Conversation sessions per user
-- ============================================================================
CREATE TABLE public.chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'New Chat',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Policies for chats
CREATE POLICY "Users can view their own chats"
    ON public.chats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chats"
    ON public.chats FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chats"
    ON public.chats FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chats"
    ON public.chats FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- MESSAGES TABLE
-- Chat history with roles
-- ============================================================================
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'agent_log')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages
CREATE POLICY "Users can view messages in their chats"
    ON public.messages FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert messages in their chats"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Index for faster chat message retrieval
CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- ============================================================================
-- TASKS TABLE (CRITICAL)
-- The core table for task execution with Human-in-the-loop support
-- ============================================================================
CREATE TYPE task_status AS ENUM (
    'pending',           -- Task created, waiting for worker
    'running',           -- Worker is executing the task
    'waiting_for_secret', -- Agent needs user input (2FA, password, etc.)
    'completed',         -- Task finished successfully
    'failed',            -- Task failed with error
    'cancelled'          -- User cancelled the task
);

CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    chat_id UUID REFERENCES public.chats(id) ON DELETE SET NULL,
    
    -- Task definition
    prompt TEXT NOT NULL,                    -- Initial user instruction
    task_type TEXT DEFAULT 'browser_task',   -- Type of task
    
    -- Status tracking
    status task_status DEFAULT 'pending',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    
    -- Human-in-the-loop fields
    required_input JSONB DEFAULT NULL,       -- What input is needed (type, field_name, hint)
    user_provided_input TEXT DEFAULT NULL,   -- The secret/input provided by user
    
    -- Execution logs (agent writes here in real-time)
    logs JSONB DEFAULT '[]',                 -- Array of log entries [{timestamp, message, type}]
    
    -- Results
    result JSONB DEFAULT NULL,               -- Final result/output of the task
    error_message TEXT DEFAULT NULL,         -- Error details if failed
    
    -- Browser state (for pause/resume)
    browser_state JSONB DEFAULT NULL,        -- Serialized browser state for resumption
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ DEFAULT NULL,
    completed_at TIMESTAMPTZ DEFAULT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policies for tasks
CREATE POLICY "Users can view their own tasks"
    ON public.tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
    ON public.tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
    ON public.tasks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
    ON public.tasks FOR DELETE
    USING (auth.uid() = user_id);

-- Service role policy for workers (they use service_role key)
-- Workers need to update tasks they're processing
CREATE POLICY "Service role can manage all tasks"
    ON public.tasks FOR ALL
    USING (auth.role() = 'service_role');

-- Indexes for task processing
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at);

-- ============================================================================
-- REALTIME CONFIGURATION
-- Enable realtime for tasks and messages tables
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to append a log entry to a task
CREATE OR REPLACE FUNCTION public.append_task_log(
    task_id UUID,
    log_message TEXT,
    log_type TEXT DEFAULT 'info'
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.tasks
    SET 
        logs = logs || jsonb_build_object(
            'timestamp', NOW(),
            'message', log_message,
            'type', log_type
        ),
        updated_at = NOW()
    WHERE id = task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update task status with timestamp
CREATE OR REPLACE FUNCTION public.update_task_status(
    task_id UUID,
    new_status task_status,
    error_msg TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.tasks
    SET 
        status = new_status,
        started_at = CASE WHEN new_status = 'running' AND started_at IS NULL THEN NOW() ELSE started_at END,
        completed_at = CASE WHEN new_status IN ('completed', 'failed', 'cancelled') THEN NOW() ELSE completed_at END,
        error_message = COALESCE(error_msg, error_message),
        updated_at = NOW()
    WHERE id = task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATED_AT TRIGGER
-- Automatically update the updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_chats
    BEFORE UPDATE ON public.chats
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_tasks
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- LemonSqueezy subscription tracking
-- ============================================================================
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- LemonSqueezy IDs
    lemonsqueezy_subscription_id TEXT NOT NULL UNIQUE,
    lemonsqueezy_order_id TEXT,
    lemonsqueezy_product_id TEXT,
    lemonsqueezy_variant_id TEXT,
    
    -- Subscription details
    plan_name TEXT NOT NULL CHECK (plan_name IN ('monthly', 'yearly')),
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'paused', 'on_trial')),
    
    -- Pricing
    price_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'USD',
    
    -- Billing cycle
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMPTZ DEFAULT NULL,
    
    -- URLs from LemonSqueezy
    update_payment_method_url TEXT,
    customer_portal_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

CREATE TRIGGER set_updated_at_subscriptions
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- BILLING HISTORY TABLE
-- Payment and invoice history
-- ============================================================================
CREATE TABLE public.billing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    
    -- LemonSqueezy IDs
    lemonsqueezy_invoice_id TEXT,
    lemonsqueezy_order_id TEXT,
    
    -- Invoice details
    description TEXT,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'failed', 'refunded')),
    
    -- URLs
    invoice_url TEXT,
    receipt_url TEXT,
    
    billing_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own billing history"
    ON public.billing_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE INDEX idx_billing_history_user_id ON public.billing_history(user_id);

-- ============================================================================
-- SECRETS VAULT TABLE
-- Encrypted storage for user credentials
-- ============================================================================
CREATE TABLE public.secrets_vault (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    
    -- Encrypted credentials (encrypted with user's key)
    encrypted_username TEXT,
    encrypted_password TEXT,
    encrypted_notes TEXT,
    
    -- Metadata
    website_url TEXT,
    category TEXT DEFAULT 'other' CHECK (category IN ('social', 'email', 'work', 'finance', 'shopping', 'other')),
    
    last_used_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.secrets_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own secrets"
    ON public.secrets_vault FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX idx_secrets_vault_user_id ON public.secrets_vault(user_id);

CREATE TRIGGER set_updated_at_secrets_vault
    BEFORE UPDATE ON public.secrets_vault
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- USAGE TRACKING TABLE
-- Track credit usage per month
-- ============================================================================
CREATE TABLE public.usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Usage period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Counts
    tasks_created INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    tasks_failed INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, period_start)
);

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
    ON public.usage_tracking FOR SELECT
    USING (auth.uid() = user_id);

CREATE INDEX idx_usage_tracking_user_id ON public.usage_tracking(user_id);

CREATE TRIGGER set_updated_at_usage_tracking
    BEFORE UPDATE ON public.usage_tracking
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ADDITIONAL HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has active task
CREATE OR REPLACE FUNCTION public.get_active_task_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    active_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO active_count
    FROM public.tasks
    WHERE user_id = p_user_id
    AND status IN ('pending', 'running', 'waiting_for_secret');
    
    RETURN active_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct a credit from user
CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    current_credits INTEGER;
BEGIN
    -- Get user's subscription tier and credits
    SELECT subscription_tier, credits_remaining 
    INTO user_tier, current_credits
    FROM public.profiles
    WHERE id = p_user_id;
    
    -- Pro/Enterprise users have unlimited credits
    IF user_tier IN ('pro', 'enterprise') THEN
        RETURN TRUE;
    END IF;
    
    -- Free users need credits
    IF current_credits <= 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Deduct credit
    UPDATE public.profiles
    SET credits_remaining = credits_remaining - 1
    WHERE id = p_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly credits
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET 
        credits_remaining = 5,
        credits_reset_at = DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
    WHERE subscription_tier = 'free'
    AND credits_reset_at <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can create task
CREATE OR REPLACE FUNCTION public.can_create_task(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    active_count INTEGER;
    user_tier TEXT;
    current_credits INTEGER;
    result JSONB;
BEGIN
    -- Check for active tasks
    SELECT public.get_active_task_count(p_user_id) INTO active_count;
    
    IF active_count > 0 THEN
        RETURN jsonb_build_object(
            'allowed', FALSE,
            'reason', 'task_in_progress',
            'message', 'You already have a task in progress. Please wait for it to complete.'
        );
    END IF;
    
    -- Get user details
    SELECT subscription_tier, credits_remaining 
    INTO user_tier, current_credits
    FROM public.profiles
    WHERE id = p_user_id;
    
    -- Pro/Enterprise can always create
    IF user_tier IN ('pro', 'enterprise') THEN
        RETURN jsonb_build_object(
            'allowed', TRUE,
            'reason', 'unlimited',
            'credits_remaining', -1
        );
    END IF;
    
    -- Free users need credits
    IF current_credits <= 0 THEN
        RETURN jsonb_build_object(
            'allowed', FALSE,
            'reason', 'no_credits',
            'message', 'You have no credits remaining this month. Upgrade to Pro for unlimited tasks.'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'allowed', TRUE,
        'reason', 'has_credits',
        'credits_remaining', current_credits
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle account deletion (soft delete with 30-day grace period)
CREATE OR REPLACE FUNCTION public.request_account_deletion(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET 
        account_status = 'pending_deletion',
        deletion_requested_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel account deletion
CREATE OR REPLACE FUNCTION public.cancel_account_deletion(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET 
        account_status = 'active',
        deletion_requested_at = NULL
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
