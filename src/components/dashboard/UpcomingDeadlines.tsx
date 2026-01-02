import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle2, AlertTriangle, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { UniversityData } from "@/types/modules/university";
import { formatDate, getDaysUntil } from "@/utils/helpers";

interface UpcomingDeadlinesProps {
    universityData: UniversityData;
    className?: string;
}

export const UpcomingDeadlines = React.memo(({ universityData, className }: UpcomingDeadlinesProps) => {
    const navigate = useNavigate();

    const deadlines = useMemo(() => {
        const tasks = universityData.tasks
            .filter((t) => t.status !== "done" && t.dueDate)
            .map((t) => ({
                id: t.id,
                title: t.title,
                type: "Task",
                module: "University",
                date: t.dueDate!,
                priority: t.priority,
                color: "from-purple-500 to-violet-600",
                status: t.status,
                isExam: false,
            }));

        const exams = universityData.exams
            .filter((e) => !e.taken)
            .map((e) => {
                const subject = universityData.subjects.find(
                    (s) => s.id === e.subjectId
                );
                return {
                    id: e.id,
                    title: `${e.title} (${subject?.name || "Unknown"})`,
                    type: "Exam",
                    module: "University",
                    date: e.date,
                    priority: 10,
                    color: "from-red-500 to-rose-600",
                    isExam: true,
                    status: "todo",
                };
            });

        return [...tasks, ...exams]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5);
    }, [universityData.tasks, universityData.exams, universityData.subjects]);

    if (deadlines.length === 0) {
        return (
            <Card className={cn("col-span-full opacity-50", className)}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Upcoming Deadlines
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-4">
                        No upcoming deadlines. Great job! 🎉
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("col-span-full", className)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Upcoming Deadlines
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {deadlines.map((item) => {
                        const daysUntil = getDaysUntil(item.date);
                        let daysText = "";
                        let daysColor = "text-muted-foreground";

                        if (daysUntil < 0) {
                            daysText = "Overdue";
                            daysColor = "text-destructive font-bold";
                        } else if (daysUntil === 0) {
                            daysText = "Today";
                            daysColor = "text-destructive font-bold";
                        } else if (daysUntil === 1) {
                            daysText = "Tomorrow";
                            daysColor = "text-orange-500 font-bold";
                        } else {
                            daysText = `in ${daysUntil} days`;
                        }

                        return (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors cursor-pointer"
                                onClick={() => navigate("/university")}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center bg-gradient-to-br text-white shadow-sm",
                                            item.color
                                        )}
                                    >
                                        {item.isExam ? (
                                            <AlertTriangle className="h-5 w-5" />
                                        ) : (
                                            <CheckCircle2 className="h-5 w-5" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">
                                            {item.title}
                                        </h4>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Badge
                                                variant="outline"
                                                className="h-5 px-1.5 text-[10px]"
                                            >
                                                {item.type}
                                            </Badge>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(
                                                    new Date(item.date)
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span
                                        className={cn(
                                            "text-sm",
                                            daysColor
                                        )}
                                    >
                                        {daysText}
                                    </span>
                                    {item.priority >= 8 && (
                                        <div className="mt-1">
                                            <Badge
                                                variant="destructive"
                                                className="h-5 px-1.5 text-[10px]"
                                            >
                                                High Priority
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
});
