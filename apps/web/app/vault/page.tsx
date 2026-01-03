"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import {
    Search,
    Plus,
    Key,
    Eye,
    EyeOff,
    Copy,
    Trash2,
    ChevronRight,
    Loader2,
    Check,
    Lock,
    Sparkles,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type SecretType = "password" | "api_key" | "token" | "credential";

interface Secret {
    id: string;
    name: string;
    secret_type: SecretType;
    website: string | null;
    encrypted_value: string;
    last_used_at: string | null;
    created_at: string;
}

const typeLabels: Record<SecretType, string> = {
    password: "Password",
    api_key: "API Key",
    token: "Token",
    credential: "Credential",
};

const typeColors: Record<SecretType, string> = {
    password: "bg-blue-500/20 text-blue-400",
    api_key: "bg-green-500/20 text-green-400",
    token: "bg-purple-500/20 text-purple-400",
    credential: "bg-orange-500/20 text-orange-400",
};

export default function VaultPage() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const supabase = createClient();

    const [secrets, setSecrets] = useState<Secret[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
    const [copiedId, setCopiedId] = useState<string | null>(null);
    
    // Dialog states
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [secretToDelete, setSecretToDelete] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [newSecret, setNewSecret] = useState({
        name: "",
        type: "password" as SecretType,
        website: "",
        value: "",
    });

    const isPro = profile?.subscriptionTier === 'pro' || profile?.subscriptionTier === 'enterprise';

    // Fetch secrets from database
    useEffect(() => {
        const fetchSecrets = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from('secrets_vault')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setSecrets(data || []);
            } catch (error) {
                console.error('Error fetching secrets:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSecrets();
    }, [user, supabase]);

    const filteredSecrets = secrets.filter(
        (secret) =>
            secret.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (secret.website?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    );

    const toggleVisibility = (id: string) => {
        setVisibleSecrets((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const copyToClipboard = async (id: string, value: string) => {
        await navigator.clipboard.writeText(value);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);

        // Update last_used_at
        await supabase
            .from('secrets_vault')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', id);
    };

    const handleDeleteSecret = async () => {
        if (!secretToDelete) return;
        setDeleting(true);

        try {
            const { error } = await supabase
                .from('secrets_vault')
                .delete()
                .eq('id', secretToDelete);

            if (error) throw error;

            setSecrets((prev) => prev.filter((s) => s.id !== secretToDelete));
            setShowDeleteDialog(false);
            setSecretToDelete(null);
        } catch (error) {
            console.error('Error deleting secret:', error);
        } finally {
            setDeleting(false);
        }
    };

    const handleAddSecret = async () => {
        if (!newSecret.name || !newSecret.value || !user) return;
        setSaving(true);

        try {
            // In a real app, you'd encrypt the value before storing
            // For now, we'll store it as-is (Supabase RLS protects access)
            const { data, error } = await supabase
                .from('secrets_vault')
                .insert({
                    user_id: user.id,
                    name: newSecret.name,
                    secret_type: newSecret.type,
                    website: newSecret.website || null,
                    encrypted_value: newSecret.value, // Should be encrypted in production
                })
                .select()
                .single();

            if (error) throw error;

            setSecrets((prev) => [data, ...prev]);
            setNewSecret({ name: "", type: "password", website: "", value: "" });
            setShowAddDialog(false);
        } catch (error) {
            console.error('Error adding secret:', error);
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    // Show upgrade prompt for free users
    if (!loading && !isPro) {
        return (
            <main className="flex h-screen w-full bg-[#050505]">
                <Sidebar activePage="vault" />
                <div className="flex flex-col flex-1 h-full bg-[#0d0d0d]">
                    <header className="flex items-center justify-between px-6 py-3 border-b border-border/50 bg-[#0a0a0a]">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Workspace</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground font-medium">Secrets Vault</span>
                        </div>
                    </header>

                    <div className="flex-1 flex items-center justify-center px-6">
                        <div className="max-w-md text-center">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
                                <Lock className="w-10 h-10 text-blue-400" />
                            </div>
                            <h2 className="text-2xl font-semibold text-foreground mb-3">
                                Secrets Vault is a Pro Feature
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Securely store your passwords, API keys, and credentials. The vault keeps your secrets safe and makes them available to the AI agent when needed.
                            </p>
                            <div className="space-y-3">
                                <Button 
                                    onClick={() => router.push('/settings')}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                                >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Upgrade to Pro
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                    Starting at $49/month
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (loading) {
        return (
            <main className="flex h-screen w-full bg-[#050505]">
                <Sidebar activePage="vault" />
                <div className="flex flex-col flex-1 h-full bg-[#0d0d0d] items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            </main>
        );
    }

    return (
        <main className="flex h-screen w-full bg-[#050505]">
            <Sidebar activePage="vault" />
            <div className="flex flex-col flex-1 h-full bg-[#0d0d0d]">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-3 border-b border-border/50 bg-[#0a0a0a]">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Workspace</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground font-medium">Secrets Vault</span>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-auto px-6 py-6">
                    <div className="max-w-4xl mx-auto">
                        {/* Title Section */}
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-semibold text-foreground mb-1">
                                    Secrets Vault
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Securely store credentials and API keys for AI tasks
                                </p>
                            </div>
                            <Button
                                onClick={() => setShowAddDialog(true)}
                                className="bg-primary hover:bg-primary/90"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Secret
                            </Button>
                        </div>

                        {/* Search Bar */}
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search secrets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#1a1a1a] border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>

                        {/* Secrets List */}
                        <div className="space-y-4">
                            {filteredSecrets.map((secret) => (
                                <div
                                    key={secret.id}
                                    className="p-5 rounded-xl bg-[#141414] border border-border/40"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            {/* Icon */}
                                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                                                <Key className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-base font-medium text-foreground">
                                                        {secret.name}
                                                    </h3>
                                                    <span
                                                        className={cn(
                                                            "px-2 py-0.5 rounded text-xs font-medium",
                                                            typeColors[secret.secret_type]
                                                        )}
                                                    >
                                                        {typeLabels[secret.secret_type]}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {secret.website || 'No website'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleVisibility(secret.id)}
                                                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[#1a1a1a] transition-colors"
                                                title={visibleSecrets.has(secret.id) ? "Hide" : "Show"}
                                            >
                                                {visibleSecrets.has(secret.id) ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => copyToClipboard(secret.id, secret.encrypted_value)}
                                                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[#1a1a1a] transition-colors"
                                                title="Copy"
                                            >
                                                {copiedId === secret.id ? (
                                                    <Check className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSecretToDelete(secret.id);
                                                    setShowDeleteDialog(true);
                                                }}
                                                className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-[#1a1a1a] transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Secret Value */}
                                    <div className="mb-3">
                                        <div className="px-4 py-3 rounded-lg bg-[#0a0a0a] border border-border/30 font-mono text-sm">
                                            {visibleSecrets.has(secret.id)
                                                ? secret.encrypted_value
                                                : "••••••••••••••••••••••••••••••"}
                                        </div>
                                    </div>

                                    {/* Meta */}
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span>Last used: {formatDate(secret.last_used_at)}</span>
                                        <span>Created: {new Date(secret.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Empty State */}
                        {filteredSecrets.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] flex items-center justify-center mb-4">
                                    <Key className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium text-foreground mb-2">
                                    {searchQuery ? "No secrets found" : "No secrets yet"}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {searchQuery
                                        ? "Try adjusting your search"
                                        : "Add credentials for the AI agent to use in tasks"}
                                </p>
                                {!searchQuery && (
                                    <Button
                                        onClick={() => setShowAddDialog(true)}
                                        variant="outline"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Secret
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Secret Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Secret</DialogTitle>
                        <DialogDescription>
                            Store a new credential or API key securely. The AI agent can use these when performing tasks.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium text-foreground block mb-2">
                                Name *
                            </label>
                            <Input
                                value={newSecret.name}
                                onChange={(e) =>
                                    setNewSecret((prev) => ({ ...prev, name: e.target.value }))
                                }
                                placeholder="e.g., Amazon Login"
                                className="bg-secondary"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground block mb-2">
                                Type
                            </label>
                            <select
                                value={newSecret.type}
                                onChange={(e) =>
                                    setNewSecret((prev) => ({
                                        ...prev,
                                        type: e.target.value as SecretType,
                                    }))
                                }
                                className="w-full px-3 py-2 rounded-md bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="password">Password</option>
                                <option value="api_key">API Key</option>
                                <option value="token">Token</option>
                                <option value="credential">Credential</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground block mb-2">
                                Website / Service
                            </label>
                            <Input
                                value={newSecret.website}
                                onChange={(e) =>
                                    setNewSecret((prev) => ({ ...prev, website: e.target.value }))
                                }
                                placeholder="e.g., amazon.com"
                                className="bg-secondary"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground block mb-2">
                                Secret Value *
                            </label>
                            <Input
                                type="password"
                                value={newSecret.value}
                                onChange={(e) =>
                                    setNewSecret((prev) => ({ ...prev, value: e.target.value }))
                                }
                                placeholder="Enter the secret value"
                                className="bg-secondary"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleAddSecret} 
                            disabled={!newSecret.name || !newSecret.value || saving}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Add Secret'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Secret</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this secret? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowDeleteDialog(false);
                            setSecretToDelete(null);
                        }}>
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDeleteSecret}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}
