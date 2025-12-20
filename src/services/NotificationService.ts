import type { AppData } from "@/types";
import type { Project, StandaloneTask } from "@/types/modules/freelancing";
import type {
    SmartNotification,
    NotificationType,
    NotificationPriority,
    NotificationConfig,
} from "@/types/services/notifications";
import { generateId, getDaysUntil } from "@/utils/helpers";

/**
 * NotificationService - Singleton service for managing smart notifications
 * Uses OOP principles with a single instance pattern
 */
class NotificationService {
    private static instance: NotificationService;
    private notifications: SmartNotification[] = [];
    private notificationCallbacks: ((
        notification: SmartNotification
    ) => void)[] = [];
    private config: NotificationConfig = {
        enabled: true,
        motivationalMessages: true,
        deadlineWarnings: {
            enabled: true,
            daysBeforeDeadline: [1, 3, 7],
        },
    };

    // Private constructor for singleton pattern
    private constructor() {}

    /**
     * Get singleton instance
     */
    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    /**
     * Subscribe to notifications
     */
    public subscribe(
        callback: (notification: SmartNotification) => void
    ): () => void {
        this.notificationCallbacks.push(callback);
        // Return unsubscribe function
        return () => {
            this.notificationCallbacks = this.notificationCallbacks.filter(
                (cb) => cb !== callback
            );
        };
    }

    /**
     * Emit notification to all subscribers
     */
    private emit(notification: SmartNotification): void {
        this.notifications.push(notification);
        this.notificationCallbacks.forEach((callback) =>
            callback(notification)
        );
    }

    /**
     * Create and emit a notification
     */
    private createNotification(
        type: NotificationType,
        title: string,
        message: string,
        priority: NotificationPriority,
        sourceModule: "freelancing" | "university" | "system",
        sourceId?: string,
        actionLabel?: string,
        actionCallback?: () => void
    ): void {
        if (!this.config.enabled) return;

        // Check quiet hours
        if (this.isQuietHours()) return;

        const notification: SmartNotification = {
            id: generateId(),
            type,
            title,
            message,
            priority,
            timestamp: new Date(),
            sourceModule,
            sourceId,
            actionLabel,
            actionCallback,
        };

        this.emit(notification);
    }

    /**
     * Check if current time is within quiet hours
     */
    private isQuietHours(): boolean {
        if (!this.config.quietHours) return false;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;

        const [startHour, startMin] = this.config.quietHours.start
            .split(":")
            .map(Number);
        const [endHour, endMin] = this.config.quietHours.end
            .split(":")
            .map(Number);
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;

        if (startTime < endTime) {
            return currentTime >= startTime && currentTime <= endTime;
        } else {
            // Crosses midnight
            return currentTime >= startTime || currentTime <= endTime;
        }
    }

    /**
     * Motivational messages pool
     */
    private getMotivationalMessage(): string {
        const messages = [
            "You've got this! Just one more task to conquer! 💪",
            "Almost there! This is the last one standing between you and success! 🎯",
            "One task left! Time to finish strong! 🚀",
            "Final stretch! You're doing amazing! ⭐",
            "Last task alert! Let's crush this! 🔥",
            "One more to go! You're unstoppable! 💫",
            "The finish line is in sight! Keep pushing! 🏆",
            "Final task! Make it count! 🎖️",
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    /**
     * Check freelancing projects and tasks
     * Freelancing data is stored separately, so it must be passed in explicitly
     */
    public checkFreelancingData(
        projects: Project[],
        tasks: StandaloneTask[]
    ): void {
        // Check projects with priority 10
        projects
            .filter(
                (project) =>
                    project.priority &&
                    project.priority === 10 &&
                    project.status !== "done"
            )
            .forEach((project) => {
                this.createNotification(
                    "priority_alert",
                    "🔴 Critical Priority Project",
                    `"${project.name}" has maximum priority (10)! This needs your immediate attention.`,
                    "urgent",
                    "freelancing",
                    project.id
                );
            });

        // Check project deadlines
        if (this.config.deadlineWarnings.enabled) {
            projects
                .filter(
                    (project) => project.status !== "done" && project.deadline
                )
                .forEach((project) => {
                    const daysUntil = getDaysUntil(project.deadline);

                    if (
                        this.config.deadlineWarnings.daysBeforeDeadline.includes(
                            daysUntil
                        )
                    ) {
                        const urgency =
                            daysUntil === 1
                                ? "urgent"
                                : daysUntil <= 3
                                ? "high"
                                : "medium";
                        const emoji =
                            daysUntil === 1
                                ? "🚨"
                                : daysUntil <= 3
                                ? "⚠️"
                                : "📅";

                        this.createNotification(
                            "deadline_warning",
                            `${emoji} Project Deadline Approaching`,
                            `"${project.name}" is due in ${daysUntil} day${
                                daysUntil > 1 ? "s" : ""
                            }!`,
                            urgency,
                            "freelancing",
                            project.id
                        );
                    }

                    // Overdue projects
                    if (daysUntil < 0) {
                        this.createNotification(
                            "deadline_warning",
                            "🚨 Overdue Project",
                            `"${project.name}" is ${Math.abs(daysUntil)} day${
                                Math.abs(daysUntil) > 1 ? "s" : ""
                            } overdue!`,
                            "urgent",
                            "freelancing",
                            project.id
                        );
                    }
                });
        }

        // Check standalone tasks with priority 10
        tasks
            .filter(
                (task) => task.priority === 10 && task.status !== "completed"
            )
            .forEach((task) => {
                this.createNotification(
                    "priority_alert",
                    "🔴 Critical Priority Task",
                    `"${task.title}" has maximum priority! Don't let this slip.`,
                    "urgent",
                    "freelancing",
                    task.id
                );
            });

        // Check standalone task deadlines
        if (this.config.deadlineWarnings.enabled) {
            tasks
                .filter((task) => task.status !== "completed" && task.dueDate)
                .forEach((task) => {
                    const daysUntil = getDaysUntil(task.dueDate!);

                    if (
                        this.config.deadlineWarnings.daysBeforeDeadline.includes(
                            daysUntil
                        )
                    ) {
                        const urgency =
                            daysUntil === 1
                                ? "urgent"
                                : daysUntil <= 3
                                ? "high"
                                : "medium";
                        const emoji =
                            daysUntil === 1
                                ? "🚨"
                                : daysUntil <= 3
                                ? "⚠️"
                                : "📅";

                        this.createNotification(
                            "deadline_warning",
                            `${emoji} Task Deadline Approaching`,
                            `"${task.title}" is due in ${daysUntil} day${
                                daysUntil > 1 ? "s" : ""
                            }!`,
                            urgency,
                            "freelancing",
                            task.id
                        );
                    }
                });
        }

        // Motivational: Only one standalone task left
        const incompleteTasks = tasks.filter(
            (task) => task.status !== "completed"
        );

        if (incompleteTasks.length === 1 && this.config.motivationalMessages) {
            const task = incompleteTasks[0];
            this.createNotification(
                "last_task",
                "🎯 Last Task Standing!",
                this.getMotivationalMessage(),
                "medium",
                "freelancing",
                task.id
            );
        }

        // Motivational: All tasks completed
        if (
            tasks.length > 0 &&
            incompleteTasks.length === 0 &&
            this.config.motivationalMessages
        ) {
            this.createNotification(
                "task_completion",
                "🎉 All Tasks Completed!",
                "Incredible work! You've cleared your entire task list! Time to celebrate! 🥳",
                "low",
                "freelancing"
            );
        }
    }

    /**
     * Check university tasks and exams
     */
    public checkUniversity(data: AppData): void {
        // Check exam deadlines
        if (this.config.deadlineWarnings.enabled) {
            data.university.exams.forEach((exam) => {
                const daysUntil = getDaysUntil(exam.date);
                const subject = data.university.subjects.find(
                    (s) => s.id === exam.subjectId
                );
                const subjectName = subject ? subject.name : "Unknown Subject";

                if (
                    this.config.deadlineWarnings.daysBeforeDeadline.includes(
                        daysUntil
                    )
                ) {
                    const urgency =
                        daysUntil === 1
                            ? "urgent"
                            : daysUntil <= 3
                            ? "high"
                            : "medium";
                    const emoji =
                        daysUntil === 1 ? "🚨" : daysUntil <= 3 ? "⚠️" : "📚";

                    this.createNotification(
                        "exam_warning",
                        `${emoji} Exam Coming Up`,
                        `Exam for "${subjectName}" is in ${daysUntil} day${
                            daysUntil > 1 ? "s" : ""
                        }!`,
                        urgency,
                        "university",
                        exam.id
                    );
                }
            });
        }

        // Check high priority university tasks
        data.university.tasks
            .filter((task) => task.priority >= 8 && task.status !== "done")
            .forEach((task) => {
                this.createNotification(
                    "priority_alert",
                    "🔴 High Priority Task",
                    `"${task.title}" has priority ${task.priority}! Focus on this.`,
                    task.priority >= 9 ? "urgent" : "high",
                    "university",
                    task.id
                );
            });

        // Check university task deadlines
        if (this.config.deadlineWarnings.enabled) {
            data.university.tasks
                .filter((task) => task.status !== "done" && task.dueDate)
                .forEach((task) => {
                    const daysUntil = getDaysUntil(task.dueDate!);

                    if (
                        this.config.deadlineWarnings.daysBeforeDeadline.includes(
                            daysUntil
                        )
                    ) {
                        const urgency =
                            daysUntil === 1
                                ? "urgent"
                                : daysUntil <= 3
                                ? "high"
                                : "medium";
                        const emoji =
                            daysUntil === 1
                                ? "🚨"
                                : daysUntil <= 3
                                ? "⚠️"
                                : "📅";

                        this.createNotification(
                            "deadline_warning",
                            `${emoji} Assignment Due Soon`,
                            `"${task.title}" is due in ${daysUntil} day${
                                daysUntil > 1 ? "s" : ""
                            }!`,
                            urgency,
                            "university",
                            task.id
                        );
                    }
                });
        }

        // Motivational: Only one university task left
        const incompleteTasks = data.university.tasks.filter(
            (task) => task.status !== "done"
        );

        if (incompleteTasks.length === 1 && this.config.motivationalMessages) {
            const task = incompleteTasks[0];
            this.createNotification(
                "last_task",
                "🎯 Final Task!",
                this.getMotivationalMessage(),
                "medium",
                "university",
                task.id
            );
        }

        // Motivational: All university tasks completed
        if (
            data.university.tasks.length > 0 &&
            incompleteTasks.length === 0 &&
            this.config.motivationalMessages
        ) {
            this.createNotification(
                "task_completion",
                "🎉 All Tasks Complete!",
                "Outstanding! You've finished all your university tasks! Keep up the excellent work! 🌟",
                "low",
                "university"
            );
        }
    }

    /**
     * Run all checks for AppData
     * Note: Freelancing data must be checked separately using checkFreelancingData()
     */
    public checkAll(data: AppData): void {
        this.checkUniversity(data);
        // Freelancing checks are done separately when freelancing data is available
    }

    /**
     * Update configuration
     */
    public updateConfig(config: Partial<NotificationConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    public getConfig(): NotificationConfig {
        return { ...this.config };
    }

    /**
     * Clear all notifications
     */
    public clearNotifications(): void {
        this.notifications = [];
    }

    /**
     * Get all notifications
     */
    public getNotifications(): SmartNotification[] {
        return [...this.notifications];
    }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
