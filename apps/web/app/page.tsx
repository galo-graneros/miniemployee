'use client'

import { Chat } from "@/components/chat";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/components/auth/auth-provider";
import LandingPage from "./(marketing)/landing/page";
import { Loader2 } from "lucide-react";

export default function Home() {
    const { user, loading } = useAuth();

    // Show loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen w-full bg-zinc-950">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    // Show landing page for non-authenticated users
    if (!user) {
        return <LandingPage />;
    }

    // Show app for authenticated users
    return (
        <main className="flex h-screen w-full bg-[#050505]">
            <Sidebar activePage="chat" />
            <Chat />
        </main>
    );
}
