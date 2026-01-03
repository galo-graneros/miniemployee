import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/components/auth/auth-provider'
import { supabase, Chat } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'
import { ArrowLeft, MessageSquare } from 'lucide-react'

export default function HistoryPage() {
  const { user } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchChats()
    }
  }, [user])

  const fetchChats = async () => {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', user?.id)
      .order('updated_at', { ascending: false })

    if (!error && data) {
      setChats(data)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>History - MiniEmployee</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to app
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-8">Chat History</h1>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No chat history yet</p>
            <Link to="/">
              <Button className="mt-4">Start a conversation</Button>
            </Link>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="space-y-2">
              {chats.map((chat) => (
                <Link key={chat.id} to={`/?chat=${chat.id}`}>
                  <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <h3 className="font-medium truncate">{chat.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(chat.updated_at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}
