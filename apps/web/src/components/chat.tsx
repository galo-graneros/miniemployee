import { useState, useEffect, useRef } from 'react'
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
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react'

export function Chat() {
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
          setMessages((prev) => [...prev, payload.new as Message])
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
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const createNewChat = async () => {
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
    return data
  }

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

      // Add user message
      const { error: msgError } = await supabase.from('messages').insert({
        chat_id: chat.id,
        role: 'user',
        content: messageContent,
      })

      if (msgError) throw msgError

      // Create task for the worker
      const { error: taskError } = await supabase.from('tasks').insert({
        user_id: user?.id,
        chat_id: chat.id,
        status: 'pending',
        task_description: messageContent,
      })

      if (taskError) throw taskError

      // Add assistant thinking message
      await supabase.from('messages').insert({
        chat_id: chat.id,
        role: 'assistant',
        content: 'Processing your request...',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      })
    } finally {
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
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to submit',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">How can I help you?</h2>
            <p className="text-muted-foreground max-w-md">
              Describe a browser task and I'll execute it for you. For example:
              "Go to LinkedIn and send a connection request to John Smith"
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role !== 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    'rounded-lg px-4 py-2 max-w-[80%]',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.role === 'agent_log'
                      ? 'bg-muted text-muted-foreground text-sm font-mono'
                      : 'bg-muted'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {/* Task Status */}
            {currentTask &&
              (currentTask.status === 'pending' ||
                currentTask.status === 'running') && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {currentTask.status === 'pending'
                      ? 'Task queued...'
                      : 'Executing task...'}
                  </span>
                </div>
              )}

            {currentTask && currentTask.status === 'failed' && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>Task failed: {currentTask.error}</span>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your browser task..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {profile?.subscription_tier === 'free' && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {profile.credits_remaining} credits remaining
            </p>
          )}
        </form>
      </div>

      {/* Secret Input Dialog */}
      <Dialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Input Required</DialogTitle>
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSecretDialog(false)}>
              Cancel Task
            </Button>
            <Button onClick={handleSecretSubmit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
