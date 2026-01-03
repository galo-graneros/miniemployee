"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    MessageSquarePlus,
    History,
    Bot,
    Vault,
    Settings,
    User,
    LogOut,
    LogIn,
    Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

interface SidebarProps {
    className?: string;
    activePage?: "chat" | "history" | "agents" | "vault" | "settings";
}

interface NavItem {
    icon: React.ReactNode;
    label: string;
    href: string;
    key: string;
}

export function Sidebar({ className, activePage = "chat" }: SidebarProps) {
    const { user, profile, loading, signOut } = useAuth();
    const router = useRouter();
    
    const navItems: NavItem[] = [
        { icon: <MessageSquarePlus className="w-5 h-5" />, label: "New Chat", href: "/", key: "chat" },
        { icon: <History className="w-5 h-5" />, label: "History", href: "/history", key: "history" },
        { icon: <Vault className="w-5 h-5" />, label: "Vault", href: "/vault", key: "vault" },
        { icon: <Settings className="w-5 h-5" />, label: "Settings", href: "/settings", key: "settings" },
    ];

    // Credits for free users
    const creditsRemaining = profile?.creditsRemaining ?? 5;
    const creditsTotal = 5;
    const isPro = profile?.subscriptionTier === 'pro' || profile?.subscriptionTier === 'enterprise';

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
        router.refresh();
    };

    return (
        <aside
            className={cn(
                "flex flex-col w-[220px] bg-[#0a0a0a] border-r border-border h-full",
                className
            )}
        >
            {/* Logo */}
            <div className="flex items-center gap-2 px-4 py-5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 border border-primary/40">
                    <Bot className="w-5 h-5 text-primary" />
                </div>
                <span className="text-lg font-semibold text-white">AutoAgent</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1 mt-2">
                {navItems.map((item) => (
                    <Link
                        key={item.key}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                            activePage === item.key
                                ? "bg-primary/15 text-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        )}
                    >
                        {item.icon}
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* Credits / Plan Status */}
            <div className="px-4 py-4 border-t border-border">
                {loading ? (
                    <div className="animate-pulse">
                        <div className="h-4 bg-secondary rounded w-24 mb-2"></div>
                        <div className="h-8 bg-secondary rounded w-full mb-2"></div>
                        <div className="h-1.5 bg-secondary rounded"></div>
                    </div>
                ) : isPro ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-blue-400">Pro Plan</span>
                    </div>
                ) : user ? (
                    <>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground">Credits Remaining</span>
                        </div>
                        <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-2xl font-bold text-white">{creditsRemaining}</span>
                            <span className="text-sm text-muted-foreground">/ {creditsTotal}</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-3">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all",
                                    creditsRemaining > 2 ? "bg-primary" : creditsRemaining > 0 ? "bg-yellow-500" : "bg-red-500"
                                )}
                                style={{ width: `${(creditsRemaining / creditsTotal) * 100}%` }}
                            />
                        </div>
                        <Link href="/settings">
                            <button className="w-full px-3 py-1.5 text-xs font-medium text-primary hover:text-primary/80 border border-primary/30 hover:border-primary/50 rounded-lg transition-colors">
                                Upgrade to Pro
                            </button>
                        </Link>
                    </>
                ) : (
                    <Link href="/signup">
                        <button className="w-full px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg transition-colors">
                            Get Started Free
                        </button>
                    </Link>
                )}
            </div>

            {/* User */}
            <div className="px-4 py-4 border-t border-border">
                {loading ? (
                    <div className="flex items-center gap-3 animate-pulse">
                        <div className="w-9 h-9 rounded-full bg-secondary"></div>
                        <div className="flex-1">
                            <div className="h-4 bg-secondary rounded w-24 mb-1"></div>
                            <div className="h-3 bg-secondary rounded w-16"></div>
                        </div>
                    </div>
                ) : user ? (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-pink-500">
                            {profile?.avatarUrl ? (
                                <img 
                                    src={profile.avatarUrl} 
                                    alt={profile.fullName || 'User'} 
                                    className="w-9 h-9 rounded-full object-cover"
                                />
                            ) : (
                                <User className="w-5 h-5 text-white" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                                {profile?.fullName || user.email?.split('@')[0] || 'User'}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                                {profile?.subscriptionTier || 'Free'} Plan
                            </p>
                        </div>
                        <button 
                            onClick={handleSignOut}
                            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors"
                            title="Sign out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary">
                            <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">Guest</p>
                            <Link href="/login" className="text-xs text-primary hover:text-primary/80">
                                Sign in
                            </Link>
                        </div>
                        <Link 
                            href="/login"
                            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors"
                            title="Sign in"
                        >
                            <LogIn className="w-4 h-4" />
                        </Link>
                    </div>
                )}
            </div>
        </aside>
    );
}
