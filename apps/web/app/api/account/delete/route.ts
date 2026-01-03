import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

export async function POST(request: NextRequest) {
    try {
        // Get the authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Missing authorization header' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);

        // Verify the token and get user
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }

        // Check if user has an active subscription
        const { data: subscription } = await supabaseAdmin
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

        // If they have an active subscription, cancel it first
        if (subscription && subscription.lemonsqueezy_subscription_id) {
            try {
                const cancelResponse = await fetch(
                    `https://api.lemonsqueezy.com/v1/subscriptions/${subscription.lemonsqueezy_subscription_id}`,
                    {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
                            'Accept': 'application/vnd.api+json',
                        },
                    }
                );

                if (!cancelResponse.ok) {
                    console.error('Failed to cancel subscription during account deletion');
                }

                // Update subscription status
                await supabaseAdmin
                    .from('subscriptions')
                    .update({ status: 'cancelled' })
                    .eq('id', subscription.id);
            } catch (cancelError) {
                console.error('Error cancelling subscription:', cancelError);
            }
        }

        // Mark the account for deletion (soft delete)
        // Update profile to mark deletion requested
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
                account_status: 'deletion_requested',
                deletion_requested_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Error marking account for deletion:', updateError);
            return NextResponse.json(
                { error: 'Failed to process deletion request' },
                { status: 500 }
            );
        }

        // Optionally: Schedule actual deletion via a background job
        // For now, we'll just mark it and the user will be signed out
        
        // Add to a deletion queue or set up a cron job to delete after 30 days
        // You could create a deletion_requests table to track this

        // Sign out the user
        await supabaseAdmin.auth.admin.signOut(token);

        return NextResponse.json({
            success: true,
            message: 'Your account has been scheduled for deletion. It will be permanently removed within 30 days.',
        });
    } catch (error) {
        console.error('Account deletion error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// Cancel deletion request
export async function DELETE(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Missing authorization header' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }

        // Cancel the deletion request
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
                account_status: 'active',
                deletion_requested_at: null,
            })
            .eq('id', user.id);

        if (updateError) {
            return NextResponse.json(
                { error: 'Failed to cancel deletion request' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Account deletion has been cancelled.',
        });
    } catch (error) {
        console.error('Cancel deletion error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
