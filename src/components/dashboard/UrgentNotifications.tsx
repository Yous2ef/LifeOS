import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, AlertTriangle, Calendar, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DismissMenu } from "../ui/DismissMenu";
import { useApp } from "@/context/AppContext";
import { getDaysUntil, isDateToday, isDateTomorrow } from "@/utils/helpers";

export const UrgentNotifications = React.memo(() => {
    const { data, dismissedNotifications, dismissNotification, neverShowAgain } =
        useApp();
    const navigate = useNavigate();

    const notifications = useMemo(() => {
        const list: Array<{
            id: string;
            type: string;
            title: string;
            message: string;
            icon: typeof Zap;
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
            if (task.dueDate) {
                const daysUntil = getDaysUntil(task.dueDate);
                if (daysUntil <= 3) {
                    list.push({
                        id: `p10-date-${task.id}`,
                        type: "priority10-approaching",
                        title:
                            daysUntil < 0
                                ? "⚠️ OVERDUE Priority 10!"
                                : `🔥 Priority 10 Due ${
                                      daysUntil === 0
                                          ? "TODAY"
                                          : `in ${daysUntil} day(s)`
                                  }`,
                        message: `${task.title} (${
                            subject?.name || "Unknown"
                        })`,
                        icon: Zap,
                        action: () => navigate("/university"),
                    });
                }
            } else {
                list.push({
                    id: `p10-${task.id}`,
                    type: "priority10",
                    title: "🚨 Priority 10 Task!",
                    message: `${task.title} (${subject?.name || "Unknown"})`,
                    icon: Zap,
                    action: () => navigate("/university"),
                });
            }
        });

        // Exams
        data.university.exams.forEach((exam) => {
            const daysUntil = getDaysUntil(exam.date);
            const subject = data.university.subjects.find(
                (s) => s.id === exam.subjectId
            );

            if (isDateToday(exam.date)) {
                list.push({
                    id: `exam-today-${exam.id}`,
                    type: "exam-today",
                    title: "📚 EXAM TODAY!",
                    message: `${exam.title} (${subject?.name || "Unknown"})`,
                    icon: AlertTriangle,
                    action: () => navigate("/university"),
                });
            } else if (isDateTomorrow(exam.date)) {
                list.push({
                    id: `exam-tomorrow-${exam.id}`,
                    type: "exam-tomorrow",
                    title: "⚠️ Exam Tomorrow!",
                    message: `${exam.title} (${subject?.name || "Unknown"})`,
                    icon: Calendar,
                    action: () => navigate("/university"),
                });
            } else if (daysUntil === 2) {
                list.push({
                    id: `exam-day-after-${exam.id}`,
                    type: "exam-day-after",
                    title: "📅 Exam in 2 Days",
                    message: `${exam.title} (${subject?.name || "Unknown"})`,
                    icon: Calendar,
                    action: () => navigate("/university"),
                });
            }
        });

        // Filter based on dismissal settings
        const now = new Date();
        return list.filter((notification) => {
            if (neverShowAgain.includes(notification.id)) return false;
            const dismissedItem = dismissedNotifications.find(
                (d) => d.id === notification.id
            );
            if (dismissedItem) {
                if (!dismissedItem.dismissUntil) return false;
                if (new Date(dismissedItem.dismissUntil) > now) return false;
            }
            return true;
        });
    }, [
        data.university.tasks,
        data.university.exams,
        data.university.subjects,
        dismissedNotifications,
        neverShowAgain,
        navigate,
    ]);

    if (notifications.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                    Urgent Notifications
                </h2>
                <Badge
                    variant="destructive"
                    className="text-base px-4 py-2 animate-pulse"
                >
                    <Bell className="mr-2 h-4 w-4" />
                    {notifications.length} Urgent
                </Badge>
            </div>
            <div className="grid gap-4">
                {notifications.map((notification) => (
                    <Card
                        key={notification.id}
                        className="border-l-4 border-l-destructive cursor-pointer hover:shadow-md transition-all"
                        onClick={notification.action}
                    >
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="p-3 rounded-lg bg-destructive/10">
                                        <notification.icon className="h-6 w-6 text-destructive" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-1">
                                            {notification.title}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {notification.message}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            notification.action();
                                        }}
                                    >
                                        View
                                    </Button>
                                    <DismissMenu
                                        onDismiss={(period) => {
                                            dismissNotification(
                                                notification.id,
                                                period
                                            );
                                        }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
});
