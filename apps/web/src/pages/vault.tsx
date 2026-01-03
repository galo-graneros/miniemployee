import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAuth } from '@/components/auth/auth-provider'
import { supabase, SecretVault } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Plus, Key, Trash2, Eye, EyeOff } from 'lucide-react'

export default function VaultPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [secrets, setSecrets] = useState<SecretVault[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newSecretName, setNewSecretName] = useState('')
  const [newSecretValue, setNewSecretValue] = useState('')
  const [savingSecret, setSavingSecret] = useState(false)
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user) {
      fetchSecrets()
    }
  }, [user])

  const fetchSecrets = async () => {
    const { data, error } = await supabase
      .from('secrets_vault')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setSecrets(data)
    }
    setLoading(false)
  }

  const handleAddSecret = async () => {
    if (!newSecretName || !newSecretValue) return
    
    setSavingSecret(true)
    try {
      const { error } = await supabase
        .from('secrets_vault')
        .insert({
          user_id: user?.id,
          name: newSecretName,
          encrypted_value: newSecretValue, // In production, encrypt client-side
        })

      if (error) throw error

      toast({
        title: 'Secret added',
        description: 'Your secret has been saved securely',
      })
      setShowAddDialog(false)
      setNewSecretName('')
      setNewSecretValue('')
      fetchSecrets()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save secret',
        variant: 'destructive',
      })
    } finally {
      setSavingSecret(false)
    }
  }

  const handleDeleteSecret = async (id: string) => {
    if (!confirm('Are you sure you want to delete this secret?')) return

    const { error } = await supabase
      .from('secrets_vault')
      .delete()
      .eq('id', id)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete secret',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Secret deleted',
        description: 'Your secret has been removed',
      })
      fetchSecrets()
    }
  }

  const toggleSecretVisibility = (id: string) => {
    const newVisible = new Set(visibleSecrets)
    if (newVisible.has(id)) {
      newVisible.delete(id)
    } else {
      newVisible.add(id)
    }
    setVisibleSecrets(newVisible)
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Secrets Vault - MiniEmployee</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to app
          </Button>
        </Link>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Secrets Vault</h1>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Secret
          </Button>
        </div>

        <p className="text-muted-foreground mb-6">
          Store credentials securely. The AI agent will use these when needed for your tasks.
        </p>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : secrets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Key className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No secrets stored yet</p>
            <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
              Add your first secret
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {secrets.map((secret) => (
              <div
                key={secret.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{secret.name}</h3>
                  <p className="text-sm text-muted-foreground font-mono">
                    {visibleSecrets.has(secret.id)
                      ? secret.encrypted_value
                      : '••••••••••••'}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleSecretVisibility(secret.id)}
                  >
                    {visibleSecrets.has(secret.id) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSecret(secret.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Secret</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secret-name">Name</Label>
              <Input
                id="secret-name"
                placeholder="e.g., GitHub Token"
                value={newSecretName}
                onChange={(e) => setNewSecretName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret-value">Value</Label>
              <Input
                id="secret-value"
                type="password"
                placeholder="Enter secret value"
                value={newSecretValue}
                onChange={(e) => setNewSecretValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSecret} disabled={savingSecret}>
              {savingSecret ? 'Saving...' : 'Save Secret'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
