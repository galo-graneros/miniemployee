import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/components/auth/auth-provider'
import { supabase, Message, Task, Chat as ChatType } from '@/lib/supabase'
import { canCreateTask } from '@/lib/supabase-functions'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Send, Bot, User, Loader2, AlertCircle, CheckCircle2, Clock, Play } from 'lucide-react'

export interface ChatRef {
  createNewChat: () => Promise<ChatType | null>
}

export const Chat = forwardRef<ChatRef>(function Chat(_, ref) {
  const { user, profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentChat, setCurrentChat] = useState<ChatType | null>(null)
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Human-in-the-loop dialog state
  const [showSecretDialog, setShowSecretDialog] = useState(false)
  const [secretRequest, setSecretRequest] = useState<{
    taskId: string
    field: string
    hint: string
  } | null>(null)
  const [secretValue, setSecretValue] = useState('')

  // Load messages when chat changes
  useEffect(() => {
    if (!currentChat) {
      setMessages([])
      return
    }

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', currentChat.id)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setMessages(data)
      }
    }

    loadMessages()
  }, [currentChat])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!currentChat) return

    // Subscribe to messages
    const messagesChannel = supabase
      .channel(`messages:${currentChat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${currentChat.id}`,
        },
        (payload) => {
          setMessages((prev) => {
            const newMessage = payload.new as Message
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${currentChat.id}`,
        },
        (payload) => {
          setMessages((prev) => 
            prev.map(m => m.id === (payload.new as Message).id ? payload.new as Message : m)
          )
        }
      )
      .subscribe()

    // Subscribe to task updates
    const tasksChannel = supabase
      .channel(`tasks:${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          const task = payload.new as Task
          
          // Only update if it's for current chat
          if (task.chat_id === currentChat?.id) {
            setCurrentTask(task)

            // Check if human input is needed
            if (task.status === 'waiting_for_human') {
              try {
                const result = JSON.parse(task.result || '{}')
                if (result.needs_secret) {
                  setSecretRequest({
                    taskId: task.id,
                    field: result.field || 'credential',
                    hint: result.hint || 'Please provide the requested information',
                  })
                  setShowSecretDialog(true)
                }
              } catch {
                // Not a secret request
              }
            }

            // Refresh profile to update credits
            if (task.status === 'completed' || task.status === 'failed') {
              refreshProfile()
              setLoading(false)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(tasksChannel)
    }
  }, [currentChat, user?.id, refreshProfile])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  const createNewChat = async (): Promise<ChatType | null> => {
    const { data, error } = await supabase
      .from('chats')
      .insert({
        user_id: user?.id,
        title: 'New Chat',
      })
      .select()
      .single()

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create chat',
        variant: 'destructive',
      })
      return null
    }

    setCurrentChat(data)
    setMessages([])
    setCurrentTask(null)
    return data
  }

  // Expose createNewChat to parent
  useImperativeHandle(ref, () => ({
    createNewChat,
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    // Check if user can create task
    const canCreate = await canCreateTask(user?.id || '')
    if (!canCreate) {
      toast({
        title: 'No credits remaining',
        description: 'Upgrade to Pro for unlimited tasks',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    const messageContent = input.trim()
    setInput('')

    try {
      // Create chat if needed
      let chat = currentChat
      if (!chat) {
        chat = await createNewChat()
        if (!chat) {
          setLoading(false)
          return
        }
      }

      // Update chat title based on first message
      if (messages.length === 0) {
        await supabase
          .from('chats')
          .update({ title: messageContent.slice(0, 50) })
          .eq('id', chat.id)
      }

      // Add user message optimistically
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        chat_id: chat.id,
        role: 'user',
        content: messageContent,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, tempUserMessage])

      // Add user message to database
      const { error: msgError } = await supabase.from('messages').insert({
        chat_id: chat.id,
        role: 'user',
        content: messageContent,
      })

      if (msgError) throw msgError

      // Create task for the worker
      const { data: taskData, error: taskError } = await supabase.from('tasks').insert({
        user_id: user?.id,
        chat_id: chat.id,
        status: 'pending',
        task_description: messageContent,
      }).select().single()

      if (taskError) throw taskError
      
      setCurrentTask(taskData)

      // Add assistant thinking message
      await supabase.from('messages').insert({
        chat_id: chat.id,
        role: 'assistant',
        content: '🤖 Processing your request... The agent is starting up.',
      })
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  const handleSecretSubmit = async () => {
    if (!secretRequest || !secretValue) return

    try {
      // Update task with the secret
      await supabase
        .from('tasks')
        .update({
          status: 'running',
          result: JSON.stringify({ secret_provided: secretValue }),
        })
        .eq('id', secretRequest.taskId)

      setShowSecretDialog(false)
      setSecretRequest(null)
      setSecretValue('')
      
      toast({
        title: 'Submitted',
        description: 'Your input has been submitted. Resuming task...',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to submit',
        variant: 'destructive',
      })
    }
  }

  const handleCancelTask = async () => {
    if (!secretRequest) return
    
    try {
      await supabase
        .from('tasks')
        .update({
          status: 'failed',
          error: 'Cancelled by user',
        })
        .eq('id', secretRequest.taskId)
      
      setShowSecretDialog(false)
      setSecretRequest(null)
      setSecretValue('')
      setLoading(false)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to cancel task',
        variant: 'destructive',
      })
    }
  }

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'running':
        return <Play className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'waiting_for_human':
        return <User className="h-4 w-4 text-orange-500" />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Bot className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-3">How can I help you today?</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Describe a browser task and I'll execute it for you using AI automation.
            </p>
            <div className="grid gap-3 max-w-lg w-full">
              <button 
                onClick={() => setInput("Go to Amazon and find the best-selling book today")}
                className="text-left p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <p className="font-medium">📚 Find best-selling book on Amazon</p>
                <p className="text-sm text-muted-foreground">Navigate to Amazon and find today's top book</p>
              </button>
              <button 
                onClick={() => setInput("Go to Google and search for the latest AI news")}
                className="text-left p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <p className="font-medium">🔍 Search for AI news on Google</p>
                <p className="text-sm text-muted-foreground">Find the latest news about artificial intelligence</p>
              </button>
              <button 
                onClick={() => setInput("Go to GitHub and star the browser-use repository")}
                className="text-left p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <p className="font-medium">⭐ Star a GitHub repository</p>
                <p className="text-sm text-muted-foreground">Navigate to GitHub and star a repo</p>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role !== 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    'rounded-lg px-4 py-3 max-w-[80%]',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.role === 'agent_log'
                      ? 'bg-muted/50 text-muted-foreground text-sm font-mono border border-border'
                      : 'bg-muted'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {/* Task Status Indicator */}
            {currentTask && ['pending', 'running', 'waiting_for_human'].includes(currentTask.status) && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                {currentTask.status === 'running' ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  getStatusIcon(currentTask.status)
                )}
                <div className="flex-1">
                  <p className="font-medium">
                    {currentTask.status === 'pending' && 'Task queued...'}
                    {currentTask.status === 'running' && 'Agent is executing your task...'}
                    {currentTask.status === 'waiting_for_human' && 'Waiting for your input...'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentTask.status === 'pending' && 'Your task is in the queue and will start shortly.'}
                    {currentTask.status === 'running' && 'The AI agent is navigating and performing actions.'}
                    {currentTask.status === 'waiting_for_human' && 'Please provide the requested information.'}
                  </p>
                </div>
              </div>
            )}

            {currentTask && currentTask.status === 'failed' && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Task failed</p>
                  <p className="text-sm text-muted-foreground">{currentTask.error || 'An unknown error occurred'}</p>
                </div>
              </div>
            )}

            {currentTask && currentTask.status === 'completed' && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-600 dark:text-green-400">Task completed!</p>
                  <p className="text-sm text-muted-foreground">The agent has finished executing your request.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border p-4 bg-background">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your browser task... (e.g., 'Go to Google and search for AI news')"
              disabled={loading}
              className="flex-1 bg-muted/50"
            />
            <Button type="submit" disabled={loading || !input.trim()} size="icon">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {profile?.subscription_tier === 'free' && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {profile.credits_remaining} of 5 free credits remaining •{' '}
              <a href="/settings" className="text-primary hover:underline">Upgrade to Pro</a>
            </p>
          )}
        </form>
      </div>

      {/* Secret Input Dialog */}
      <Dialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-orange-500" />
              Input Required
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">{secretRequest?.hint}</p>
            <div className="space-y-2">
              <Label htmlFor="secret-input">{secretRequest?.field}</Label>
              <Input
                id="secret-input"
                type="password"
                value={secretValue}
                onChange={(e) => setSecretValue(e.target.value)}
                placeholder="Enter value..."
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancelTask}>
              Cancel Task
            </Button>
            <Button onClick={handleSecretSubmit} disabled={!secretValue}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
})
