"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient, Task } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn, formatTimestamp } from "@/lib/utils";
import {
    Send,
    Bot,
    User,
    Terminal,
    Loader2,
    Key,
    ChevronDown,
    ChevronRight,
    Paperclip,
    KeyRound,
    AlertTriangle,
    Sparkles,
    Zap,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import Link from "next/link";

interface LogEntry {
    timestamp: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
}

interface ChatMessage {
    id: string;
    role: "user" | "assistant" | "system" | "agent_log";
    content: string;
    timestamp: string;
    taskId?: string;
    logs?: LogEntry[];
    isResult?: boolean;
    isWorking?: boolean;
}

interface TaskPermission {
    allowed: boolean;
    reason: string;
    message?: string;
    credits_remaining?: number;
}

export function Chat() {
    const supabase = createClient();
    const { user, profile, refreshProfile } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentTask, setCurrentTask] = useState<Task | null>(null);
    const [showSecretDialog, setShowSecretDialog] = useState(false);
    const [secretInput, setSecretInput] = useState("");
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
    const [chatTitle, setChatTitle] = useState("New Chat");
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
    const [upgradeReason, setUpgradeReason] = useState<string>("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Toggle logs visibility
    const toggleLogs = (messageId: string) => {
        setExpandedLogs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(messageId)) {
                newSet.delete(messageId);
            } else {
                newSet.add(messageId);
            }
            return newSet;
        });
    };

    // Format result text from JSON
    const formatResult = (result: any): string => {
        if (!result) return "Tarea completada.";
        if (typeof result === 'string') return result;
        if (result.result) return result.result;
        if (result.message) return result.message;
        return "Tarea completada exitosamente.";
    };

    // Auto-resize textarea
    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    };

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, currentTask?.logs]);

    // Subscribe to task updates via Supabase Realtime
    useEffect(() => {
        const channel = supabase
            .channel("task-updates")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "tasks",
                },
                (payload) => {
                    const task = payload.new as Task;
                    if (task) {
                        setCurrentTask(task);

                        // Show secret dialog when waiting for input
                        if (task.status === "waiting_for_secret") {
                            setShowSecretDialog(true);
                        }

                        // Update messages when task completes
                        if (task.status === "completed" || task.status === "failed") {
                            setIsLoading(false);
                            setMessages((prev) => {
                                // Remove working message
                                const filtered = prev.filter(m => m.id !== `working-${task.id}`);
                                if (filtered.some((m) => m.id === `result-${task.id}`)) {
                                    return filtered;
                                }
                                return [
                                    ...filtered,
                                    {
                                        id: `result-${task.id}`,
                                        role: "assistant",
                                        content:
                                            task.status === "completed"
                                                ? formatResult(task.result)
                                                : `${task.error_message || "Ha ocurrido un error."}`,
                                        timestamp: new Date().toISOString(),
                                        taskId: task.id,
                                        logs: task.logs || [],
                                        isResult: true,
                                    },
                                ];
                            });
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    // Submit a new task
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        // Check if user is authenticated
        if (!user) {
            setUpgradeReason("Please sign in to use AutoAgent.");
            setShowUpgradeDialog(true);
            return;
        }

        // Check if user can create a task
        try {
            const { data: permission, error: permError } = await supabase.rpc(
                'can_create_task', 
                { p_user_id: user.id }
            );

            if (permError) throw permError;

            const taskPermission = permission as TaskPermission;

            if (!taskPermission.allowed) {
                if (taskPermission.reason === 'task_in_progress') {
                    setUpgradeReason("You already have a task in progress. Please wait for it to complete before starting a new one.");
                } else if (taskPermission.reason === 'no_credits') {
                    setUpgradeReason("You've used all your free credits this month. Upgrade to Pro for unlimited tasks!");
                } else {
                    setUpgradeReason(taskPermission.message || "Unable to create task.");
                }
                setShowUpgradeDialog(true);
                return;
            }

            // Deduct credit for free users
            if (taskPermission.reason === 'has_credits') {
                await supabase.rpc('deduct_credit', { p_user_id: user.id });
                refreshProfile(); // Update credits in sidebar
            }
        } catch (error) {
            console.error("Error checking task permission:", error);
        }

        const userInput = input.trim();
        
        // Update chat title based on first message
        if (messages.length === 0) {
            const title = userInput.length > 40 ? userInput.substring(0, 40) + "..." : userInput;
            setChatTitle(title);
        }

        const userMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            role: "user",
            content: userInput,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
        setIsLoading(true);

        try {
            // Create a new task in Supabase
            const { data: task, error } = await supabase
                .from("tasks")
                .insert({
                    user_id: user.id,
                    prompt: userInput,
                    status: "pending",
                    logs: [],
                })
                .select()
                .single();

            if (error) throw error;

            setCurrentTask(task);
            setMessages((prev) => [
                ...prev,
                {
                    id: `working-${task.id}`,
                    role: "assistant",
                    content: generateWorkingMessage(userInput),
                    timestamp: new Date().toISOString(),
                    taskId: task.id,
                    isWorking: true,
                },
            ]);
        } catch (error) {
            console.error("Error creating task:", error);
            setIsLoading(false);
            setMessages((prev) => [
                ...prev,
                {
                    id: `error-${Date.now()}`,
                    role: "assistant",
                    content: "Failed to create task. Please try again.",
                    timestamp: new Date().toISOString(),
                },
            ]);
        }
    };

    // Generate a contextual working message
    const generateWorkingMessage = (prompt: string): string => {
        const lower = prompt.toLowerCase();
        if (lower.includes("amazon")) {
            return "I'll help you with that. Let me start by navigating to Amazon and searching for what you need.";
        }
        if (lower.includes("google")) {
            return "I'll search Google for you. Let me navigate there and find the information.";
        }
        if (lower.includes("search")) {
            return "I'll help you search for that. Let me start browsing.";
        }
        return "I'll help you with that. Let me start working on your request.";
    };

    // Submit secret input
    const handleSecretSubmit = async () => {
        if (!secretInput.trim() || !currentTask) return;

        try {
            const { error } = await supabase
                .from("tasks")
                .update({
                    user_provided_input: secretInput,
                    status: "running",
                })
                .eq("id", currentTask.id);

            if (error) throw error;

            setSecretInput("");
            setShowSecretDialog(false);
            setMessages((prev) => [
                ...prev,
                {
                    id: `secret-${Date.now()}`,
                    role: "system",
                    content: "🔐 Secret provided. Agent resuming...",
                    timestamp: new Date().toISOString(),
                },
            ]);
        } catch (error) {
            console.error("Error submitting secret:", error);
        }
    };

    // Handle key press for textarea
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="flex flex-col flex-1 h-full bg-[#0d0d0d]">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-3 border-b border-border/50 bg-[#0a0a0a]">
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Workspace</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground font-medium">{chatTitle}</span>
                </div>

            </header>

            {/* Messages Area */}
            <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Welcome message */}
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
                                <Bot className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-2xl font-semibold text-foreground mb-2">
                                What can I help you with?
                            </h2>
                            <p className="text-muted-foreground max-w-md mb-8">
                                I can browse the web, fill forms, extract data, and complete tasks for you.
                            </p>
                            <div className="grid gap-3 text-sm w-full max-w-lg">
                                <button 
                                    className="px-4 py-3 rounded-xl bg-[#1a1a1a] border border-border/50 hover:border-primary/50 transition-colors text-left"
                                    onClick={() => setInput("Browse Amazon and find the best laptops under $1000")}
                                >
                                    <span className="text-primary">→</span>{" "}
                                    <span className="text-foreground">Browse Amazon and find the best laptops under $1000</span>
                                </button>
                                <button 
                                    className="px-4 py-3 rounded-xl bg-[#1a1a1a] border border-border/50 hover:border-primary/50 transition-colors text-left"
                                    onClick={() => setInput("Search Google for the latest tech news")}
                                >
                                    <span className="text-primary">→</span>{" "}
                                    <span className="text-foreground">Search Google for the latest tech news</span>
                                </button>
                                <button 
                                    className="px-4 py-3 rounded-xl bg-[#1a1a1a] border border-border/50 hover:border-primary/50 transition-colors text-left"
                                    onClick={() => setInput("Go to Wikipedia and summarize the article about AI")}
                                >
                                    <span className="text-primary">→</span>{" "}
                                    <span className="text-foreground">Go to Wikipedia and summarize the article about AI</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Chat messages */}
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={cn(
                                "flex gap-3",
                                message.role === "user" && "justify-end"
                            )}
                        >
                            {/* Avatar for non-user messages */}
                            {message.role !== "user" && (
                                <div className="flex items-start">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 shrink-0">
                                        <Bot className="w-4 h-4 text-primary" />
                                    </div>
                                </div>
                            )}

                            {/* Message content */}
                            <div
                                className={cn(
                                    "max-w-[75%]",
                                    message.role === "user" && "order-first"
                                )}
                            >
                                {message.role === "user" ? (
                                    <div className="px-4 py-3 rounded-2xl bg-primary/20 border border-primary/30">
                                        <p className="text-sm text-foreground">{message.content}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-sm text-foreground leading-relaxed">{message.content}</p>
                                        
                                        {/* Activity Log for working state */}
                                        {message.isWorking && currentTask && (
                                            <ActivityLog 
                                                logs={currentTask.logs || []} 
                                                isLoading={isLoading}
                                                taskPrompt={currentTask.prompt}
                                            />
                                        )}
                                        
                                        {/* Collapsible logs for completed tasks */}
                                        {message.isResult && message.logs && message.logs.length > 0 && (
                                            <div className="mt-2">
                                                <button
                                                    onClick={() => toggleLogs(message.id)}
                                                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {expandedLogs.has(message.id) ? (
                                                        <ChevronDown className="w-3 h-3" />
                                                    ) : (
                                                        <ChevronRight className="w-3 h-3" />
                                                    )}
                                                    {expandedLogs.has(message.id) ? "Hide" : "Show"} activity log ({message.logs.length} steps)
                                                </button>
                                                
                                                {expandedLogs.has(message.id) && (
                                                    <ActivityLog 
                                                        logs={message.logs} 
                                                        isLoading={false}
                                                        collapsed={false}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <span className="text-[10px] text-muted-foreground mt-1.5 block">
                                    {formatTimestamp(message.timestamp)}
                                </span>
                            </div>

                            {/* Avatar for user */}
                            {message.role === "user" && (
                                <div className="flex items-start">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 shrink-0">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="px-6 py-4 border-t border-border/50 bg-[#0a0a0a]">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSubmit}>
                        <div className="rounded-xl bg-[#1a1a1a] border border-border/50 focus-within:border-primary/50 transition-colors">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={handleTextareaChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your message... (Shift+Enter for new line)"
                                disabled={isLoading}
                                rows={1}
                                className="w-full px-4 py-3 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none min-h-[48px] max-h-[200px]"
                            />
                            <div className="flex items-center justify-between px-3 py-2 border-t border-border/30">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                                    >
                                        <Paperclip className="w-4 h-4" />
                                        Attach
                                    </button>
                                    <button
                                        type="button"
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                                    >
                                        <KeyRound className="w-4 h-4" />
                                        Add Secret
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground">{input.length} characters</span>
                                    <Button
                                        type="submit"
                                        disabled={isLoading || !input.trim()}
                                        size="sm"
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                    <p className="text-[11px] text-muted-foreground text-center mt-2">
                        AutoAgent can make mistakes. Verify important information.
                    </p>
                </div>
            </div>

            {/* Secret Input Dialog */}
            <Dialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Key className="w-5 h-5 text-yellow-500" />
                            Input Required
                        </DialogTitle>
                        <DialogDescription>
                            {currentTask?.required_input?.hint ||
                                "The agent needs additional input to continue. Please provide the requested information."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <label className="text-sm font-medium text-foreground block mb-2">
                            {currentTask?.required_input?.field_name || "Secret / Code"}
                        </label>
                        <Input
                            type={currentTask?.required_input?.type === "password" ? "password" : "text"}
                            value={secretInput}
                            onChange={(e) => setSecretInput(e.target.value)}
                            placeholder="Enter the value..."
                            className="bg-secondary"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSecretDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSecretSubmit}>
                            Submit & Continue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Upgrade / Limit Dialog */}
            <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {upgradeReason.includes("sign in") ? (
                                <Key className="w-5 h-5 text-blue-500" />
                            ) : upgradeReason.includes("in progress") ? (
                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            ) : (
                                <Sparkles className="w-5 h-5 text-purple-500" />
                            )}
                            {upgradeReason.includes("sign in") 
                                ? "Sign In Required" 
                                : upgradeReason.includes("in progress")
                                ? "Task In Progress"
                                : "Upgrade to Pro"}
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            {upgradeReason}
                        </DialogDescription>
                    </DialogHeader>
                    
                    {upgradeReason.includes("credits") && (
                        <div className="py-4">
                            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20 p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground">Pro Plan</h4>
                                        <p className="text-sm text-muted-foreground">Unlimited AI tasks</p>
                                    </div>
                                </div>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-center gap-2">
                                        <span className="text-green-400">✓</span> Unlimited browser automation
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-green-400">✓</span> Priority support
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-green-400">✓</span> Secrets vault
                                    </li>
                                </ul>
                                <div className="mt-4 pt-4 border-t border-border/50">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-foreground">$49</span>
                                        <span className="text-muted-foreground">/month</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setShowUpgradeDialog(false)}
                            className="w-full sm:w-auto"
                        >
                            {upgradeReason.includes("in progress") ? "Got it" : "Maybe Later"}
                        </Button>
                        {upgradeReason.includes("sign in") ? (
                            <Link href="/login" className="w-full sm:w-auto">
                                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                                    Sign In
                                </Button>
                            </Link>
                        ) : upgradeReason.includes("credits") ? (
                            <Link href="/settings" className="w-full sm:w-auto">
                                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                                    Upgrade Now
                                </Button>
                            </Link>
                        ) : null}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Activity Log Component
interface ActivityLogProps {
    logs: LogEntry[];
    isLoading: boolean;
    taskPrompt?: string;
    collapsed?: boolean;
}

function ActivityLog({ logs, isLoading, taskPrompt, collapsed = true }: ActivityLogProps) {
    const [isExpanded, setIsExpanded] = useState(!collapsed);

    return (
        <div className="rounded-xl bg-[#141414] border border-border/40 overflow-hidden mt-3">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full px-4 py-3 hover:bg-[#1a1a1a] transition-colors"
            >
                <div className="flex items-center gap-2">
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                        <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                        </div>
                    )}
                    <span className="text-sm text-foreground">
                        {isLoading ? `Browsing${taskPrompt?.toLowerCase().includes("amazon") ? " Amazon" : ""}...` : "Completed"}
                    </span>
                </div>
                {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
            </button>
            
            {isExpanded && (
                <div className="px-4 pb-3 border-t border-border/30">
                    <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                        <Terminal className="w-3 h-3" />
                        Activity Log
                    </div>
                    <div className="space-y-1 font-mono text-xs">
                        {logs.length === 0 ? (
                            <div className="flex items-center gap-2 text-muted-foreground py-1">
                                <span className="text-primary">›</span>
                                <span>Initializing...</span>
                                {isLoading && <span className="inline-block w-2 h-3 bg-primary animate-pulse" />}
                            </div>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className="flex items-start gap-2 py-0.5">
                                    <span className={cn(
                                        "shrink-0",
                                        log.type === "info" && "text-primary",
                                        log.type === "success" && "text-green-500",
                                        log.type === "warning" && "text-yellow-500",
                                        log.type === "error" && "text-red-500"
                                    )}>›</span>
                                    <span className={cn(
                                        log.type === "info" && "text-foreground/80",
                                        log.type === "success" && "text-green-400",
                                        log.type === "warning" && "text-yellow-400",
                                        log.type === "error" && "text-red-400"
                                    )}>
                                        {log.message}
                                    </span>
                                </div>
                            ))
                        )}
                        {isLoading && logs.length > 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground py-0.5">
                                <span className="text-primary">›</span>
                                <span className="inline-block w-2 h-3 bg-primary animate-pulse" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
