import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePassword, validatePassword } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    // Check if we have a valid session from the reset link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasSession(true)
      }
    })
  }, [])

  const passwordValidation = validatePassword(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      })
      return
    }

    if (!passwordValidation.valid) {
      toast({
        title: 'Invalid Password',
        description: passwordValidation.errors[0],
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      await updatePassword(password)
      toast({
        title: 'Success',
        description: 'Your password has been reset',
      })
      navigate('/login')
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reset password',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Helmet>
          <title>Reset Password - MiniEmployee</title>
        </Helmet>
        <div className="w-full max-w-md space-y-8 text-center">
          <h1 className="text-2xl font-bold">Invalid or expired link</h1>
          <p className="text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
          <Button onClick={() => navigate('/forgot-password')}>
            Request new link
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Helmet>
        <title>Reset Password - MiniEmployee</title>
      </Helmet>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="text-muted-foreground mt-2">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {password && (
              <div className="space-y-1 text-sm">
                {[
                  { check: password.length >= 12, text: 'At least 12 characters' },
                  { check: /[A-Z]/.test(password), text: 'One uppercase letter' },
                  { check: /[a-z]/.test(password), text: 'One lowercase letter' },
                  { check: /[0-9]/.test(password), text: 'One number' },
                  { check: /[!@#$%^&*(),.?":{}|<>]/.test(password), text: 'One special character' },
                ].map((req, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {req.check ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={req.check ? 'text-green-500' : 'text-muted-foreground'}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !passwordValidation.valid}
          >
            {loading ? 'Resetting...' : 'Reset password'}
          </Button>
        </form>
      </div>
    </div>
  )
}
