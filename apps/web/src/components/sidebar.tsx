import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/components/auth/auth-provider'
import {
  Bot,
  MessageSquare,
  Settings,
  Key,
  History,
  LogOut,
  Plus,
} from 'lucide-react'

interface SidebarProps {
  onNewChat?: () => void
}

export function Sidebar({ onNewChat }: SidebarProps) {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/landing')
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <aside className="w-64 border-r bg-muted/30 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <Link to="/" className="flex items-center gap-2">
          <Bot className="h-8 w-8 text-primary" />
          <span className="text-lg font-bold">MiniEmployee</span>
        </Link>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button className="w-full" onClick={onNewChat}>
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <Link to="/history">
          <Button variant="ghost" className="w-full justify-start">
            <History className="mr-2 h-4 w-4" />
            History
          </Button>
        </Link>
        <Link to="/vault">
          <Button variant="ghost" className="w-full justify-start">
            <Key className="mr-2 h-4 w-4" />
            Secrets Vault
          </Button>
        </Link>
        <Link to="/settings">
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
      </nav>

      {/* Credits/Plan Info */}
      <div className="p-4 border-t">
        {profile?.subscription_tier === 'free' ? (
          <div className="bg-muted rounded-lg p-3 mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Free Plan</span>
              <span className="text-sm text-muted-foreground">
                {profile.credits_remaining}/5 credits
              </span>
            </div>
            <div className="w-full bg-muted-foreground/20 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(profile.credits_remaining / 5) * 100}%` }}
              />
            </div>
            <Link to="/settings">
              <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                Upgrade to Pro
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-primary/10 rounded-lg p-3 mb-4">
            <span className="text-sm font-medium text-primary">Pro Plan</span>
            <p className="text-xs text-muted-foreground">Unlimited tasks</p>
          </div>
        )}

        <Separator className="my-4" />

        {/* User Info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {profile?.full_name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
