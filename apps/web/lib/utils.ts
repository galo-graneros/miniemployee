import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

export function getStatusColor(status: string): string {
    switch (status) {
        case 'pending':
            return 'text-muted-foreground';
        case 'running':
            return 'text-primary';
        case 'waiting_for_secret':
            return 'text-yellow-500';
        case 'completed':
            return 'text-green-500';
        case 'failed':
            return 'text-destructive';
        case 'cancelled':
            return 'text-muted-foreground';
        default:
            return 'text-foreground';
    }
}

export function getStatusLabel(status: string): string {
    switch (status) {
        case 'pending':
            return 'Waiting...';
        case 'running':
            return 'Running';
        case 'waiting_for_secret':
            return 'Input Required';
        case 'completed':
            return 'Completed';
        case 'failed':
            return 'Failed';
        case 'cancelled':
            return 'Cancelled';
        default:
            return status;
    }
}
