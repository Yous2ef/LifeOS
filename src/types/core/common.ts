/**
 * Common Types for LifeOS
 *
 * Contains shared types used across multiple modules including
 * Toast notifications, notification settings, and dismissed notifications.
 */

// Toast notification type for in-app notifications
export interface Toast {
    id: string;
    type: "success" | "error" | "info" | "warning";
    message: string;
    duration?: number;
}

// Notification Settings Types
export interface NotificationSettings {
    dismissedNotifications: DismissedNotification[];
    neverShowAgain: string[]; // notification IDs to never show again
}

export interface DismissedNotification {
    id: string;
    dismissedAt: string;
    dismissUntil?: string; // When to show again (undefined = show on next session, null = never)
}
