"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import {
    ChevronRight,
    User,
    Bell,
    Shield,
    CreditCard,
    AlertTriangle,
    Loader2,
    Check,
    Eye,
    EyeOff,
    Sparkles,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase";
import { validatePassword, PASSWORD_RULES } from "@/lib/auth";
import {
    setup2FA,
    verify2FA,
    disable2FA,
    createCheckout,
    getSubscriptionStatus,
    cancelSubscription,
    resumeSubscription,
    deleteAccount,
} from "@/lib/supabase-functions";

interface ToggleProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
}

function Toggle({ enabled, onChange, disabled = false }: ToggleProps) {
    return (
        <button
            onClick={() => !disabled && onChange(!enabled)}
            disabled={disabled}
            className={cn(
                "relative w-12 h-6 rounded-full transition-colors",
                enabled ? "bg-primary" : "bg-[#333333]",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            <div
                className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                    enabled ? "left-7" : "left-1"
                )}
            />
        </button>
    );
}

export default function SettingsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, profile, refreshProfile, signOut } = useAuth();
    const supabase = createClient();
    
    // Loading states
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    
    // Profile state
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");

    // Notifications state
    const [taskAlerts, setTaskAlerts] = useState(true);
    const [securityAlerts, setSecurityAlerts] = useState(true);
    const [weeklyReport, setWeeklyReport] = useState(false);

    // Security state
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [show2FADialog, setShow2FADialog] = useState(false);
    const [show2FASetup, setShow2FASetup] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState("");
    const [twoFactorSecret, setTwoFactorSecret] = useState("");
    const [twoFactorQR, setTwoFactorQR] = useState("");
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [twoFALoading, setTwoFALoading] = useState(false);

    // Billing state
    const [subscription, setSubscription] = useState<any>(null);
    const [billingHistory, setBillingHistory] = useState<any[]>([]);
    const [loadingBilling, setLoadingBilling] = useState(true);
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    // Account deletion state
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Initialize form with profile data
    useEffect(() => {
        if (profile) {
            setFullName(profile.fullName || "");
        }
        if (user) {
            setEmail(user.email || "");
        }
    }, [profile, user]);

    // Check for checkout success
    useEffect(() => {
        if (searchParams.get('checkout') === 'success') {
            refreshProfile();
            router.replace('/settings');
        }
    }, [searchParams, refreshProfile, router]);

    // Fetch billing info
    useEffect(() => {
        const fetchBilling = async () => {
            if (!user) return;
            
            try {
                const data = await getSubscriptionStatus();
                setSubscription(data.subscription);
                setBillingHistory(data.billing_history || []);
            } catch (error) {
                console.error('Error fetching billing:', error);
            } finally {
                setLoadingBilling(false);
            }
        };

        fetchBilling();
    }, [user, supabase]);

    // Save profile
    const handleSaveProfile = async () => {
        if (!user) return;
        setSaving(true);
        
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', user.id);
            
            if (error) throw error;
            
            await refreshProfile();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) {
            console.error('Error saving profile:', error);
        } finally {
            setSaving(false);
        }
    };

    // Change password
    const handleChangePassword = async () => {
        setPasswordError("");
        setPasswordLoading(true);
        
        const validation = validatePassword(newPassword);
        if (!validation.valid) {
            setPasswordError(validation.errors[0]);
            setPasswordLoading(false);
            return;
        }
        
        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords do not match");
            setPasswordLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });
            
            if (error) throw error;
            
            setShowPasswordDialog(false);
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            setPasswordError(error.message || "Failed to change password");
        } finally {
            setPasswordLoading(false);
        }
    };

    // Setup 2FA
    const handleSetup2FA = async () => {
        setTwoFALoading(true);
        try {
            const data = await setup2FA();
            setTwoFactorSecret(data.secret);
            setTwoFactorQR(data.otpauthUrl);
            setBackupCodes(data.backupCodes);
            setShow2FASetup(true);
        } catch (error) {
            console.error('2FA setup error:', error);
        } finally {
            setTwoFALoading(false);
        }
    };

    // Verify and enable 2FA
    const handleVerify2FA = async () => {
        setTwoFALoading(true);
        setPasswordError("");
        try {
            await verify2FA(twoFactorCode);
            await refreshProfile();
            setShow2FASetup(false);
            setShow2FADialog(false);
            setTwoFactorCode("");
        } catch (error: any) {
            setPasswordError(error.message);
        } finally {
            setTwoFALoading(false);
        }
    };

    // Disable 2FA
    const handleDisable2FA = async () => {
        setTwoFALoading(true);
        setPasswordError("");
        try {
            await disable2FA(twoFactorCode);
            await refreshProfile();
            setShow2FADialog(false);
            setTwoFactorCode("");
        } catch (error: any) {
            setPasswordError(error.message);
        } finally {
            setTwoFALoading(false);
        }
    };

    // Checkout
    const handleCheckout = async (plan: 'monthly' | 'yearly') => {
        setCheckoutLoading(true);
        
        try {
            const data = await createCheckout(plan);
            window.location.href = data.checkoutUrl;
        } catch (error) {
            console.error('Checkout error:', error);
            setCheckoutLoading(false);
        }
    };

    // Cancel subscription
    const handleCancelSubscription = async () => {
        try {
            await cancelSubscription();
            const data = await getSubscriptionStatus();
            setSubscription(data.subscription);
        } catch (error) {
            console.error('Cancel error:', error);
        }
    };

    // Resume subscription
    const handleResumeSubscription = async () => {
        try {
            await resumeSubscription();
            const data = await getSubscriptionStatus();
            setSubscription(data.subscription);
            await refreshProfile();
        } catch (error) {
            console.error('Resume error:', error);
        }
    };

    // Delete account
    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') return;
        setDeleteLoading(true);
        
        try {
            await deleteAccount();
            await signOut();
            router.push('/');
        } catch (error) {
            console.error('Delete error:', error);
            setDeleteLoading(false);
        }
    };

    if (!user) {
        return (
            <main className="flex h-screen w-full bg-[#050505]">
                <Sidebar activePage="settings" />
                <div className="flex flex-col flex-1 h-full bg-[#0d0d0d] items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Loading settings...</p>
                </div>
            </main>
        );
    }

    const isPro = profile?.subscriptionTier === 'pro' || profile?.subscriptionTier === 'enterprise';

    return (
        <main className="flex h-screen w-full bg-[#050505]">
            <Sidebar activePage="settings" />
            <div className="flex flex-col flex-1 h-full bg-[#0d0d0d]">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-3 border-b border-border/50 bg-[#0a0a0a]">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Workspace</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground font-medium">Settings</span>
                    </div>
                    {saveSuccess && (
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                            <Check className="w-4 h-4" />
                            Saved
                        </div>
                    )}
                </header>

                {/* Content */}
                <div className="flex-1 overflow-auto px-6 py-6">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Profile Settings */}
                        <section className="p-6 rounded-xl bg-[#141414] border border-border/40">
                            <div className="flex items-center gap-3 mb-6">
                                <User className="w-5 h-5 text-primary" />
                                <h2 className="text-lg font-semibold text-foreground">
                                    Profile Settings
                                </h2>
                            </div>

                            {/* Avatar */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-500">
                                    {profile?.avatarUrl ? (
                                        <img 
                                            src={profile.avatarUrl} 
                                            alt={profile.fullName || 'User'} 
                                            className="w-16 h-16 rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-8 h-8 text-white" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        {profile?.fullName || 'User'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{email}</p>
                                </div>
                            </div>

                            {/* Name */}
                            <div className="mb-4">
                                <label className="text-sm text-muted-foreground block mb-2">
                                    Full Name
                                </label>
                                <Input
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="bg-[#0a0a0a] border-border/50 max-w-md"
                                />
                            </div>
                            
                            <Button onClick={handleSaveProfile} disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </section>

                        {/* Security */}
                        <section className="p-6 rounded-xl bg-[#141414] border border-border/40">
                            <div className="flex items-center gap-3 mb-6">
                                <Shield className="w-5 h-5 text-primary" />
                                <h2 className="text-lg font-semibold text-foreground">
                                    Security
                                </h2>
                            </div>

                            <div className="space-y-1">
                                <button 
                                    onClick={() => setShowPasswordDialog(true)}
                                    className="flex items-center justify-between w-full px-4 py-4 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                                >
                                    <span className="text-sm text-foreground">Change Password</span>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </button>

                                <button 
                                    onClick={() => profile?.twoFactorEnabled ? setShow2FADialog(true) : handleSetup2FA()}
                                    disabled={twoFALoading}
                                    className="flex items-center justify-between w-full px-4 py-4 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                                >
                                    <span className="text-sm text-foreground">
                                        Two-Factor Authentication
                                    </span>
                                    {twoFALoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                    ) : (
                                        <span className={cn(
                                            "text-xs font-medium px-2 py-1 rounded-full",
                                            profile?.twoFactorEnabled 
                                                ? "bg-green-500/20 text-green-400" 
                                                : "bg-gray-500/20 text-muted-foreground"
                                        )}>
                                            {profile?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </section>

                        {/* Billing & Plan */}
                        <section className="p-6 rounded-xl bg-[#141414] border border-border/40">
                            <div className="flex items-center gap-3 mb-6">
                                <CreditCard className="w-5 h-5 text-primary" />
                                <h2 className="text-lg font-semibold text-foreground">
                                    Billing & Plan
                                </h2>
                            </div>

                            {loadingBilling ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Current Plan */}
                                    <div className="flex items-center justify-between px-4 py-4 rounded-lg bg-[#1a1a1a]">
                                        <div className="flex items-center gap-3">
                                            {isPro && <Sparkles className="w-5 h-5 text-blue-400" />}
                                            <div>
                                                <p className="text-sm font-medium text-foreground">
                                                    {isPro ? 'Pro Plan' : 'Free Trial'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {isPro && subscription ? (
                                                        subscription.cancel_at_period_end 
                                                            ? `Cancels ${new Date(subscription.current_period_end).toLocaleDateString()}`
                                                            : `${subscription.plan_name === 'yearly' ? '$490/year' : '$49/month'} • Renews ${new Date(subscription.current_period_end).toLocaleDateString()}`
                                                    ) : (
                                                        `${profile?.creditsRemaining ?? 5} credits remaining this month`
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {isPro ? (
                                            subscription?.cancel_at_period_end ? (
                                                <Button size="sm" onClick={handleResumeSubscription}>
                                                    Resume Plan
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="outline" onClick={handleCancelSubscription}>
                                                    Cancel Plan
                                                </Button>
                                            )
                                        ) : (
                                            <Button 
                                                size="sm" 
                                                onClick={() => setShowUpgradeDialog(true)}
                                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                                            >
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                Upgrade to Pro
                                            </Button>
                                        )}
                                    </div>

                                    {/* Usage Stats for Free Users */}
                                    {!isPro && (
                                        <div className="px-4 py-3 rounded-lg bg-[#0a0a0a]">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-muted-foreground">Monthly Credits</span>
                                                <span className="text-foreground">{profile?.creditsRemaining ?? 5} / 5</span>
                                            </div>
                                            <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all"
                                                    style={{ width: `${((profile?.creditsRemaining ?? 5) / 5) * 100}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Credits reset on {profile?.creditsResetAt 
                                                    ? new Date(profile.creditsResetAt).toLocaleDateString() 
                                                    : 'the 1st of each month'}
                                            </p>
                                        </div>
                                    )}

                                    {/* Billing History */}
                                    {billingHistory.length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="text-sm font-medium text-foreground mb-3">Billing History</h4>
                                            <div className="space-y-2">
                                                {billingHistory.slice(0, 5).map((invoice) => (
                                                    <div 
                                                        key={invoice.id} 
                                                        className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#0a0a0a]"
                                                    >
                                                        <div>
                                                            <p className="text-sm text-foreground">{invoice.description}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {new Date(invoice.billing_date).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm text-foreground">
                                                                ${(invoice.amount_cents / 100).toFixed(2)}
                                                            </p>
                                                            <p className={cn(
                                                                "text-xs",
                                                                invoice.status === 'paid' ? "text-green-400" : "text-yellow-400"
                                                            )}>
                                                                {invoice.status}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Customer Portal */}
                                    {subscription?.customer_portal_url && (
                                        <a 
                                            href={subscription.customer_portal_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm text-primary hover:bg-[#1a1a1a] transition-colors"
                                        >
                                            Manage Payment Method
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            )}
                        </section>

                        {/* Notifications */}
                        <section className="p-6 rounded-xl bg-[#141414] border border-border/40">
                            <div className="flex items-center gap-3 mb-6">
                                <Bell className="w-5 h-5 text-primary" />
                                <h2 className="text-lg font-semibold text-foreground">
                                    Notifications
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            Task Completion Alerts
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Get notified when agents complete tasks
                                        </p>
                                    </div>
                                    <Toggle enabled={taskAlerts} onChange={setTaskAlerts} />
                                </div>

                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            Security Alerts
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Important security notifications
                                        </p>
                                    </div>
                                    <Toggle enabled={securityAlerts} onChange={setSecurityAlerts} />
                                </div>

                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            Weekly Summary Report
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Receive weekly activity summaries
                                        </p>
                                    </div>
                                    <Toggle enabled={weeklyReport} onChange={setWeeklyReport} />
                                </div>
                            </div>
                        </section>

                        {/* Danger Zone */}
                        <section className="p-6 rounded-xl bg-[#141414] border border-red-500/30">
                            <div className="flex items-center gap-3 mb-6">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                <h2 className="text-lg font-semibold text-red-500">Danger Zone</h2>
                            </div>

                            <div className="space-y-3">
                                <button 
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="w-full px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
                                >
                                    Delete Account
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                Account deletion is permanent. Your data will be scheduled for removal within 30 days.
                            </p>
                        </section>
                    </div>
                </div>
            </div>

            {/* Password Dialog */}
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                            Enter your new password. Must be at least {PASSWORD_RULES.minLength} characters with uppercase, lowercase, number, and special character.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium block mb-2">New Password</label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-2">Confirm Password</label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••••••"
                            />
                        </div>
                        {passwordError && (
                            <p className="text-sm text-red-400">{passwordError}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleChangePassword} disabled={passwordLoading}>
                            {passwordLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Changing...
                                </>
                            ) : (
                                'Change Password'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 2FA Setup Dialog */}
            <Dialog open={show2FASetup} onOpenChange={setShow2FASetup}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
                        <DialogDescription>
                            Add your account to your authenticator app using the secret below, then enter the 6-digit code to verify.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Secret Key */}
                        <div className="bg-[#1a1a1a] p-4 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-2">Secret Key (for manual entry):</p>
                            <code className="text-sm text-foreground break-all font-mono bg-[#0a0a0a] px-3 py-2 rounded block">
                                {twoFactorSecret || 'Loading...'}
                            </code>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium block mb-2">Enter 6-digit code from your app</label>
                            <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                className="text-center text-2xl tracking-widest font-mono"
                            />
                        </div>

                        {backupCodes.length > 0 && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                                <p className="text-sm text-yellow-400 font-medium mb-2">
                                    ⚠️ Save your backup codes:
                                </p>
                                <p className="text-xs text-muted-foreground mb-3">
                                    Store these codes safely. Each can only be used once.
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                    {backupCodes.map((code, i) => (
                                        <div key={i} className="bg-[#0a0a0a] px-3 py-2 rounded text-center">
                                            {code}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {passwordError && (
                            <p className="text-sm text-red-400">{passwordError}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShow2FASetup(false);
                            setTwoFactorCode("");
                            setPasswordError("");
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={handleVerify2FA} disabled={twoFactorCode.length !== 6 || twoFALoading}>
                            {twoFALoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify & Enable'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 2FA Disable Dialog */}
            <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                        <DialogDescription>
                            Enter your 2FA code or a backup code to disable two-factor authentication.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium block mb-2">Enter code</label>
                            <Input
                                type="text"
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value)}
                                placeholder="000000 or backup code"
                                className="text-center font-mono"
                            />
                        </div>
                        {passwordError && (
                            <p className="text-sm text-red-400">{passwordError}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShow2FADialog(false);
                            setTwoFactorCode("");
                            setPasswordError("");
                        }}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDisable2FA} disabled={!twoFactorCode || twoFALoading}>
                            {twoFALoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Disabling...
                                </>
                            ) : (
                                'Disable 2FA'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Upgrade Dialog */}
            <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-400" />
                            Upgrade to Pro
                        </DialogTitle>
                        <DialogDescription>
                            Get unlimited AI tasks and premium features.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setSelectedPlan('monthly')}
                                className={cn(
                                    "p-4 rounded-lg border text-left transition-colors",
                                    selectedPlan === 'monthly' 
                                        ? "border-blue-500 bg-blue-500/10" 
                                        : "border-border hover:border-border/80"
                                )}
                            >
                                <p className="font-medium text-foreground">Monthly</p>
                                <p className="text-2xl font-bold text-foreground">$49<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                            </button>
                            <button
                                onClick={() => setSelectedPlan('yearly')}
                                className={cn(
                                    "p-4 rounded-lg border text-left transition-colors relative",
                                    selectedPlan === 'yearly' 
                                        ? "border-blue-500 bg-blue-500/10" 
                                        : "border-border hover:border-border/80"
                                )}
                            >
                                <div className="absolute -top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded font-medium">
                                    Save $98
                                </div>
                                <p className="font-medium text-foreground">Yearly</p>
                                <p className="text-2xl font-bold text-foreground">$490<span className="text-sm font-normal text-muted-foreground">/yr</span></p>
                            </button>
                        </div>
                        
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2 text-foreground">
                                <Check className="w-4 h-4 text-green-400" />
                                <span>Unlimited AI tasks</span>
                            </li>
                            <li className="flex items-center gap-2 text-foreground">
                                <Check className="w-4 h-4 text-green-400" />
                                <span>Priority support</span>
                            </li>
                            <li className="flex items-center gap-2 text-foreground">
                                <Check className="w-4 h-4 text-green-400" />
                                <span>Secrets vault for credentials</span>
                            </li>
                            <li className="flex items-center gap-2 text-foreground">
                                <Check className="w-4 h-4 text-green-400" />
                                <span>Full task history & analytics</span>
                            </li>
                        </ul>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={() => handleCheckout(selectedPlan)}
                            disabled={checkoutLoading}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        >
                            {checkoutLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Redirecting...
                                </>
                            ) : (
                                `Subscribe for $${selectedPlan === 'yearly' ? '490/year' : '49/month'}`
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Account Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-500 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Delete Account
                        </DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. Your account and all associated data will be permanently deleted within 30 days.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                            <p className="text-sm text-red-400">
                                This will permanently delete:
                            </p>
                            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                                <li>• All your chat history and tasks</li>
                                <li>• Your saved credentials in vault</li>
                                <li>• Your profile and settings</li>
                                {isPro && <li>• Your active subscription (no refunds)</li>}
                            </ul>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-2">
                                Type <strong className="text-foreground">DELETE</strong> to confirm:
                            </p>
                            <Input
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="DELETE"
                                className="font-mono"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowDeleteDialog(false);
                            setDeleteConfirmText("");
                        }}>
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                        >
                            {deleteLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete My Account'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}
