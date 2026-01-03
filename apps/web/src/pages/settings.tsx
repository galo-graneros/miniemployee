import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/components/auth/auth-provider'
import { useToast } from '@/hooks/use-toast'
import {
  setup2FA,
  verify2FA,
  disable2FA,
  createCheckout,
  getSubscriptionStatus,
  cancelSubscription,
  resumeSubscription,
  deleteAccount,
} from '@/lib/supabase-functions'
import { ArrowLeft, Shield, CreditCard, Trash2 } from 'lucide-react'

interface SubscriptionData {
  status: string
  plan: string
  current_period_end: string
  cancel_at_period_end: boolean
}

export default function SettingsPage() {
  const { profile, refreshProfile, signOut } = useAuth()
  const { toast } = useToast()
  
  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showSetup2FA, setShowSetup2FA] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verifyCode, setVerifyCode] = useState('')
  const [loading2FA, setLoading2FA] = useState(false)
  
  // Billing state
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loadingBilling, setLoadingBilling] = useState(false)
  
  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [loadingDelete, setLoadingDelete] = useState(false)

  useEffect(() => {
    if (profile) {
      setTwoFactorEnabled(profile.two_factor_enabled)
      fetchSubscription()
    }
  }, [profile])

  const fetchSubscription = async () => {
    try {
      const data = await getSubscriptionStatus()
      setSubscription(data.subscription)
    } catch {
      // No subscription
    }
  }

  const handleSetup2FA = async () => {
    setLoading2FA(true)
    try {
      const data = await setup2FA()
      setQrCode(data.qrCode)
      setSecret(data.secret)
      setBackupCodes(data.backupCodes)
      setShowSetup2FA(true)
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to setup 2FA',
        variant: 'destructive',
      })
    } finally {
      setLoading2FA(false)
    }
  }

  const handleVerify2FA = async () => {
    setLoading2FA(true)
    try {
      await verify2FA(verifyCode)
      setTwoFactorEnabled(true)
      setShowSetup2FA(false)
      await refreshProfile()
      toast({
        title: 'Success',
        description: 'Two-factor authentication enabled',
      })
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Invalid code',
        variant: 'destructive',
      })
    } finally {
      setLoading2FA(false)
    }
  }

  const handleDisable2FA = async () => {
    const code = prompt('Enter your 2FA code to disable:')
    if (!code) return
    
    setLoading2FA(true)
    try {
      await disable2FA(code)
      setTwoFactorEnabled(false)
      await refreshProfile()
      toast({
        title: 'Success',
        description: 'Two-factor authentication disabled',
      })
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Invalid code',
        variant: 'destructive',
      })
    } finally {
      setLoading2FA(false)
    }
  }

  const handleCheckout = async (plan: 'monthly' | 'yearly') => {
    setLoadingBilling(true)
    try {
      const data = await createCheckout(plan)
      window.location.href = data.checkoutUrl
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create checkout',
        variant: 'destructive',
      })
    } finally {
      setLoadingBilling(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return
    
    setLoadingBilling(true)
    try {
      await cancelSubscription()
      await fetchSubscription()
      toast({
        title: 'Subscription cancelled',
        description: 'Your subscription will remain active until the end of the billing period',
      })
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel',
        variant: 'destructive',
      })
    } finally {
      setLoadingBilling(false)
    }
  }

  const handleResumeSubscription = async () => {
    setLoadingBilling(true)
    try {
      await resumeSubscription()
      await fetchSubscription()
      toast({
        title: 'Subscription resumed',
        description: 'Your subscription has been reactivated',
      })
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to resume',
        variant: 'destructive',
      })
    } finally {
      setLoadingBilling(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    
    setLoadingDelete(true)
    try {
      await deleteAccount()
      toast({
        title: 'Account scheduled for deletion',
        description: 'Your account will be deleted in 30 days',
      })
      await signOut()
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete account',
        variant: 'destructive',
      })
    } finally {
      setLoadingDelete(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Settings - MiniEmployee</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to app
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {/* Account Info */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Account</h2>
          <div className="space-y-2 text-muted-foreground">
            <p><strong>Email:</strong> {profile?.email}</p>
            <p><strong>Name:</strong> {profile?.full_name || 'Not set'}</p>
            <p><strong>Plan:</strong> {profile?.subscription_tier === 'pro' ? 'Pro' : 'Free'}</p>
            {profile?.subscription_tier === 'free' && (
              <p><strong>Credits remaining:</strong> {profile?.credits_remaining}/5</p>
            )}
          </div>
        </section>

        <Separator className="my-8" />

        {/* Two-Factor Authentication */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Two-Factor Authentication</h2>
          </div>
          
          {twoFactorEnabled ? (
            <div className="space-y-4">
              <p className="text-green-600">✓ Two-factor authentication is enabled</p>
              <Button
                variant="outline"
                onClick={handleDisable2FA}
                disabled={loading2FA}
              >
                Disable 2FA
              </Button>
            </div>
          ) : showSetup2FA ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Scan this QR code with your authenticator app:
              </p>
              {qrCode && (
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              )}
              <p className="text-sm text-muted-foreground">
                Or enter this secret manually: <code className="bg-muted px-2 py-1 rounded">{secret}</code>
              </p>
              <div className="space-y-2">
                <Label>Backup codes (save these somewhere safe!):</Label>
                <div className="bg-muted p-4 rounded font-mono text-sm">
                  {backupCodes.map((code, i) => (
                    <div key={i}>{code}</div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="verify-code">Enter code from app to verify:</Label>
                <Input
                  id="verify-code"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleVerify2FA} disabled={loading2FA}>
                  {loading2FA ? 'Verifying...' : 'Verify & Enable'}
                </Button>
                <Button variant="outline" onClick={() => setShowSetup2FA(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Add an extra layer of security to your account.
              </p>
              <Button onClick={handleSetup2FA} disabled={loading2FA}>
                {loading2FA ? 'Setting up...' : 'Enable 2FA'}
              </Button>
            </div>
          )}
        </section>

        <Separator className="my-8" />

        {/* Billing */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Billing</h2>
          </div>
          
          {profile?.subscription_tier === 'pro' && subscription ? (
            <div className="space-y-4">
              <p className="text-green-600">✓ Pro subscription active</p>
              <p className="text-muted-foreground">
                Plan: {subscription.plan === 'yearly' ? 'Yearly' : 'Monthly'}
              </p>
              <p className="text-muted-foreground">
                {subscription.cancel_at_period_end
                  ? `Cancels on: ${new Date(subscription.current_period_end).toLocaleDateString()}`
                  : `Renews on: ${new Date(subscription.current_period_end).toLocaleDateString()}`
                }
              </p>
              {subscription.cancel_at_period_end ? (
                <Button onClick={handleResumeSubscription} disabled={loadingBilling}>
                  Resume Subscription
                </Button>
              ) : (
                <Button variant="outline" onClick={handleCancelSubscription} disabled={loadingBilling}>
                  Cancel Subscription
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Upgrade to Pro for unlimited tasks.
              </p>
              <div className="flex gap-4">
                <Button onClick={() => handleCheckout('monthly')} disabled={loadingBilling}>
                  $49/month
                </Button>
                <Button variant="outline" onClick={() => handleCheckout('yearly')} disabled={loadingBilling}>
                  $490/year (save $98)
                </Button>
              </div>
            </div>
          )}
        </section>

        <Separator className="my-8" />

        {/* Delete Account */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="h-5 w-5 text-destructive" />
            <h2 className="text-xl font-semibold text-destructive">Delete Account</h2>
          </div>
          
          {showDeleteConfirm ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                This action cannot be undone. Your account will be scheduled for deletion
                in 30 days. Type <strong>DELETE</strong> to confirm.
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || loadingDelete}
                >
                  {loadingDelete ? 'Deleting...' : 'Delete Account'}
                </Button>
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Permanently delete your account and all associated data.
              </p>
              <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                Delete Account
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
