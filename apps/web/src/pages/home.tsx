import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/components/auth/auth-provider'
import { Chat } from '@/components/chat'
import { Sidebar } from '@/components/sidebar'

export default function HomePage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/landing')
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Chat />
      </main>
    </div>
  )
}
