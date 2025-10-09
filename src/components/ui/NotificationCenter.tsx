import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, X, Zap, AlertCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import {
    formatDate,
    getDaysUntil,
    isDateToday,
    isDateTomorrow,
} from "../../utils/helpers";
import { Badge } from "./Badge";

export const NotificationCenter: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const { data, dismissedNotifications, neverShowAgain } = useApp();
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Calculate ALL notifications (including dismissed ones)
    const allNotifications: Array<{
        id: string;
        type: string;
        title: string;
        message: string;
        icon: string;
        color: string;
        status: string;
        action: () => void;
    }> = [];

    // Priority 10 tasks
    const priority10Tasks = data.university.tasks.filter(
        (task) => task.priority === 10 && task.status !== "done"
    );
    priority10Tasks.forEach((task) => {
        const subject = data.university.subjects.find(
            (s) => s.id === task.subjectId
        );
        const notificationId = task.dueDate
            ? `p10-date-${task.id}`
            : `p10-${task.id}`;

        let status = "active";
        if (neverShowAgain.includes(notificationId)) {
            status = "never";
        } else {
            const dismissedItem = dismissedNotifications.find(
                (d) => d.id === notificationId
            );
            if (dismissedItem) {
                if (!dismissedItem.dismissUntil) {
                    status = "session";
                } else if (new Date(dismissedItem.dismissUntil) > new Date()) {
                    status = "dismissed";
                } else {
                    status = "active";
                }
            }
        }

        allNotifications.push({
            id: notificationId,
            type: "priority10",
            title: task.dueDate
                ? `Priority 10 Task - Due ${formatDate(task.dueDate)}`
                : "Priority 10 Task",
            message: `"${task.title}" (${subject?.name || "Unknown"})`,
            icon: "zap",
            color: "text-destructive",
            status,
            action: () => {
                navigate("/university");
                setIsOpen(false);
            },
        });
    });

    // Exams today
    const examsToday = data.university.exams.filter((exam) =>
        isDateToday(exam.date)
    );
    examsToday.forEach((exam) => {
        const subject = data.university.subjects.find(
            (s) => s.id === exam.subjectId
        );
        const notificationId = `exam-today-${exam.id}`;

        let status = "active";
        if (neverShowAgain.includes(notificationId)) {
            status = "never";
        } else {
            const dismissedItem = dismissedNotifications.find(
                (d) => d.id === notificationId
            );
            if (dismissedItem) {
                if (!dismissedItem.dismissUntil) {
                    status = "session";
                } else if (new Date(dismissedItem.dismissUntil) > new Date()) {
                    status = "dismissed";
                } else {
                    status = "active";
                }
            }
        }

        allNotifications.push({
            id: notificationId,
            type: "exam-today",
            title: "Exam Today",
            message: `${exam.title} (${subject?.name || "Unknown"})`,
            icon: "alert",
            color: "text-destructive",
            status,
            action: () => {
                navigate("/university");
                setIsOpen(false);
            },
        });
    });

    // Exams tomorrow
    const examsTomorrow = data.university.exams.filter((exam) =>
        isDateTomorrow(exam.date)
    );
    examsTomorrow.forEach((exam) => {
        const subject = data.university.subjects.find(
            (s) => s.id === exam.subjectId
        );
        const notificationId = `exam-tomorrow-${exam.id}`;

        let status = "active";
        if (neverShowAgain.includes(notificationId)) {
            status = "never";
        } else {
            const dismissedItem = dismissedNotifications.find(
                (d) => d.id === notificationId
            );
            if (dismissedItem) {
                if (!dismissedItem.dismissUntil) {
                    status = "session";
                } else if (new Date(dismissedItem.dismissUntil) > new Date()) {
                    status = "dismissed";
                } else {
                    status = "active";
                }
            }
        }

        allNotifications.push({
            id: notificationId,
            type: "exam-tomorrow",
            title: "Exam Tomorrow",
            message: `${exam.title} (${subject?.name || "Unknown"})`,
            icon: "bell",
            color: "text-primary",
            status,
            action: () => {
                navigate("/university");
                setIsOpen(false);
            },
        });
    });

    // Exams day after tomorrow
    const examsDayAfter = data.university.exams.filter(
        (exam) => getDaysUntil(exam.date) === 2
    );
    examsDayAfter.forEach((exam) => {
        const subject = data.university.subjects.find(
            (s) => s.id === exam.subjectId
        );
        const notificationId = `exam-day-after-${exam.id}`;

        let status = "active";
        if (neverShowAgain.includes(notificationId)) {
            status = "never";
        } else {
            const dismissedItem = dismissedNotifications.find(
                (d) => d.id === notificationId
            );
            if (dismissedItem) {
                if (!dismissedItem.dismissUntil) {
                    status = "session";
                } else if (new Date(dismissedItem.dismissUntil) > new Date()) {
                    status = "dismissed";
                } else {
                    status = "active";
                }
            }
        }

        allNotifications.push({
            id: notificationId,
            type: "exam-day-after",
            title: "Exam in 2 Days",
            message: `${exam.title} (${subject?.name || "Unknown"})`,
            icon: "bell",
            color: "text-primary",
            status,
            action: () => {
                navigate("/university");
                setIsOpen(false);
            },
        });
    });

    const activeCount = allNotifications.filter(
        (n) => n.status === "active"
    ).length;

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors duration-200"
                title="Notifications"
                aria-label="Notifications">
                <Bell size={20} />
                {activeCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center animate-pulse text-white">
                        {activeCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full mt-2 w-96 max-h-[600px] bg-popover border border-border rounded-lg shadow-2xl z-9999 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-border flex items-center justify-between bg-muted/50">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                            <Bell size={20} className="text-primary" />
                            Notification Center
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                            title="Close"
                            aria-label="Close notification center">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {allNotifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <Bell
                                    size={48}
                                    className="mx-auto mb-3 opacity-30"
                                />
                                <p>No notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {allNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={notification.action}
                                        className={`p-4 cursor-pointer transition-colors ${
                                            notification.status === "active"
                                                ? "hover:bg-accent/50 bg-background"
                                                : "hover:bg-accent/30 opacity-60"
                                        }`}>
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`mt-1 ${notification.color}`}>
                                                {notification.icon ===
                                                    "zap" && <Zap size={20} />}
                                                {notification.icon ===
                                                    "alert" && (
                                                    <AlertCircle size={20} />
                                                )}
                                                {notification.icon ===
                                                    "bell" && (
                                                    <Bell size={20} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="font-semibold text-sm text-foreground">
                                                        {notification.title}
                                                    </h4>
                                                    {notification.status !==
                                                        "active" && (
                                                        <Badge
                                                            variant={
                                                                notification.status ===
                                                                "never"
                                                                    ? "destructive"
                                                                    : notification.status ===
                                                                      "dismissed"
                                                                    ? "secondary"
                                                                    : "default"
                                                            }
                                                            className="text-xs flex-shrink-0">
                                                            {notification.status ===
                                                            "never"
                                                                ? "Never"
                                                                : notification.status ===
                                                                  "dismissed"
                                                                ? "Hidden"
                                                                : "Session"}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 break-words">
                                                    {notification.message}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-border bg-muted/50 text-center">
                        <button
                            onClick={() => {
                                navigate("/settings");
                                setIsOpen(false);
                            }}
                            className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                            Manage Notifications in Settings →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
