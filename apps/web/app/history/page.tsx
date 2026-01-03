"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";
import {
    Search,
    Filter,
    Clock,
    MessageSquare,
    ChevronRight,
} from "lucide-react";

interface ChatHistoryItem {
    id: string;
    title: string;
    description: string;
    tags: string[];
    date: string;
    messageCount: number;
}

// Demo data - in production this would come from Supabase
const demoHistory: ChatHistoryItem[] = [
    {
        id: "1",
        title: "Amazon Product Search - Laptops",
        description: "Browse Amazon and find the best laptops under $1000...",
        tags: ["browsing", "shopping"],
        date: "2025-12-30 14:32",
        messageCount: 12,
    },
    {
        id: "2",
        title: "Google Account Login",
        description: "Log into my Google account and check email...",
        tags: ["authentication", "email"],
        date: "2025-12-30 13:15",
        messageCount: 8,
    },
    {
        id: "3",
        title: "LinkedIn Job Search",
        description: "Search for software engineer positions in San Francisco...",
        tags: ["job search", "browsing"],
        date: "2025-12-29 16:45",
        messageCount: 24,
    },
    {
        id: "4",
        title: "Flight Booking Research",
        description: "Find the cheapest flights from NYC to London...",
        tags: ["travel", "research"],
        date: "2025-12-29 10:20",
        messageCount: 15,
    },
    {
        id: "5",
        title: "GitHub Repository Analysis",
        description: "Analyze the trending repositories on GitHub...",
        tags: ["development", "research"],
        date: "2025-12-28 09:00",
        messageCount: 18,
    },
];

type FilterType = "all" | "today" | "week" | "month";

export default function HistoryPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<FilterType>("all");

    const filters: { label: string; value: FilterType }[] = [
        { label: "All", value: "all" },
        { label: "Today", value: "today" },
        { label: "Week", value: "week" },
        { label: "Month", value: "month" },
    ];

    const filteredHistory = demoHistory.filter((item) => {
        const matchesSearch =
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.tags.some((tag) =>
                tag.toLowerCase().includes(searchQuery.toLowerCase())
            );

        // In production, add date filtering logic here
        return matchesSearch;
    });

    return (
        <main className="flex h-screen w-full bg-[#050505]">
            <Sidebar activePage="history" />
            <div className="flex flex-col flex-1 h-full bg-[#0d0d0d]">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-3 border-b border-border/50 bg-[#0a0a0a]">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Workspace</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground font-medium">Chat History</span>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-auto px-6 py-6">
                    <div className="max-w-4xl mx-auto">
                        {/* Search Bar */}
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search chat history..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#1a1a1a] border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-3 mb-6">
                            <Filter className="w-5 h-5 text-muted-foreground" />
                            <div className="flex items-center gap-2">
                                {filters.map((filter) => (
                                    <button
                                        key={filter.value}
                                        onClick={() => setActiveFilter(filter.value)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                                            activeFilter === filter.value
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-[#1a1a1a] text-muted-foreground hover:text-foreground hover:bg-[#252525]"
                                        )}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* History List */}
                        <div className="space-y-3">
                            {filteredHistory.map((item) => (
                                <button
                                    key={item.id}
                                    className="w-full text-left p-5 rounded-xl bg-[#141414] border border-border/40 hover:border-primary/40 hover:bg-[#1a1a1a] transition-all group"
                                >
                                    <h3 className="text-base font-medium text-foreground mb-1.5 group-hover:text-primary transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                                        {item.description}
                                    </p>
                                    
                                    {/* Tags */}
                                    <div className="flex items-center gap-2 mb-3">
                                        {item.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-2.5 py-1 rounded-md text-xs font-medium bg-primary/15 text-primary"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Meta */}
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {item.date}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            {item.messageCount} messages
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Empty State */}
                        {filteredHistory.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] flex items-center justify-center mb-4">
                                    <Search className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium text-foreground mb-2">
                                    No chats found
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Try adjusting your search or filters
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
