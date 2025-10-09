export type NotificationType =
    | "deadline_warning"
    | "priority_alert"
    | "motivation"
    | "task_completion"
    | "exam_warning"
    | "last_task";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface NotificationRule {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    priority: NotificationPriority;
    checkCondition: () => boolean;
    actionLabel?: string;
    actionCallback?: () => void;
}

export interface SmartNotification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    priority: NotificationPriority;
    timestamp: Date;
    sourceModule: "freelancing" | "university" | "system";
    sourceId?: string; // ID of related project/task/exam
    actionLabel?: string;
    actionCallback?: () => void;
}

export interface NotificationConfig {
    enabled: boolean;
    quietHours?: {
        start: string; // "22:00"
        end: string; // "08:00"
    };
    priorityThreshold?: NotificationPriority;
    motivationalMessages: boolean;
    deadlineWarnings: {
        enabled: boolean;
        daysBeforeDeadline: number[]; // [1, 3, 7] means notify 1 day, 3 days, and 7 days before
    };
}
