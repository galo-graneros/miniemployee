import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/components/auth/auth-provider'
import { Chat, ChatRef } from '@/components/chat'
import { Sidebar } from '@/components/sidebar'

export default function HomePage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const chatRef = useRef<ChatRef>(null)

  useEffect(() => {
    // Only redirect if we're done loading and there's no user
    if (!loading && !user) {
      navigate('/landing')
    }
  }, [user, loading, navigate])

  const handleNewChat = useCallback(() => {
    chatRef.current?.createNewChat()
  }, [])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    )
  }

  // Don't render anything while redirecting
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground text-sm">Redirecting...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar onNewChat={handleNewChat} />
      <main className="flex-1 overflow-hidden">
        <Chat ref={chatRef} />
      </main>
    </div>
  )
}
