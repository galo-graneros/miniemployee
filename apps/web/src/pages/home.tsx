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
    if (!loading && !user) {
      navigate('/landing')
    }
  }, [user, loading, navigate])

  const handleNewChat = useCallback(() => {
    chatRef.current?.createNewChat()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
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
