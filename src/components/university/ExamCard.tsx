import React from "react";
import {
    Calendar,
    Clock,
    MapPin,
    CheckCircle2,
    AlertTriangle,
    Timer,
    Award,
    MoreVertical,
    Edit,
    Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDate, getDaysUntil } from "@/utils/helpers";
import type { Exam } from "@/types";

export type ExamStatus = "upcoming" | "today" | "missed" | "taken" | "graded";

interface ExamCardProps {
    exam: Exam;
    subjectName?: string;
    subjectColor?: string;
    onMarkAsTaken: (exam: Exam) => void;
    onAddGrade: (exam: Exam) => void;
    onEdit: (exam: Exam) => void;
    onDelete: (exam: Exam) => void;
}

export const getExamStatus = (exam: Exam): ExamStatus => {
    const daysUntil = getDaysUntil(exam.date);
    const today = new Date();
    const examDate = new Date(exam.date);
    const isToday = examDate.toDateString() === today.toDateString();

    if (exam.taken && exam.grade !== undefined && exam.grade !== null) {
        return "graded";
    }
    if (exam.taken) {
        return "taken";
    }
    if (isToday) {
        return "today";
    }
    if (daysUntil < 0) {
        return "missed";
    }
    return "upcoming";
};

export const getStatusBadge = (status: ExamStatus) => {
    switch (status) {
        case "graded":
            return {
                label: "Graded",
                variant: "default" as const,
                className: "bg-green-500 hover:bg-green-600",
                icon: <Award className="w-3 h-3" />,
            };
        case "taken":
            return {
                label: "Awaiting Grade",
                variant: "secondary" as const,
                className: "bg-blue-500 hover:bg-blue-600 text-white",
                icon: <Timer className="w-3 h-3" />,
            };
        case "today":
            return {
                label: "Today!",
                variant: "destructive" as const,
                className: "bg-orange-500 hover:bg-orange-600 animate-pulse",
                icon: <AlertTriangle className="w-3 h-3" />,
            };
        case "missed":
            return {
                label: "Missed",
                variant: "destructive" as const,
                className: "bg-red-500 hover:bg-red-600",
                icon: <AlertTriangle className="w-3 h-3" />,
            };
        case "upcoming":
        default:
            return {
                label: "Upcoming",
                variant: "outline" as const,
                className: "",
                icon: <Calendar className="w-3 h-3" />,
            };
    }
};

export const ExamCard: React.FC<ExamCardProps> = ({
    exam,
    subjectName,
    subjectColor,
    onMarkAsTaken,
    onAddGrade,
    onEdit,
    onDelete,
}) => {
    const status = getExamStatus(exam);
    const statusBadge = getStatusBadge(status);
    const daysUntil = getDaysUntil(exam.date);

    const getGradePercentage = () => {
        if (exam.grade === undefined || exam.grade === null || !exam.maxGrade)
            return null;
        return ((exam.grade / exam.maxGrade) * 100).toFixed(1);
    };

    const gradePercentage = getGradePercentage();

    return (
        <Card
            className={cn(
                "transition-all hover:shadow-md",
                status === "today" && "ring-2 ring-orange-500",
                status === "missed" && !exam.taken && "opacity-75"
            )}
            style={{
                borderLeftWidth: "4px",
                borderLeftColor: subjectColor || "var(--primary)",
            }}>
            <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                        {/* Title and Status */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg">
                                {exam.title}
                            </h3>
                            <Badge className={statusBadge.className}>
                                {statusBadge.icon}
                                <span className="ml-1">
                                    {statusBadge.label}
                                </span>
                            </Badge>
                        </div>

                        {/* Subject Name */}
                        {subjectName && (
                            <p className="text-sm text-muted-foreground">
                                {subjectName}
                            </p>
                        )}

                        {/* Date and Time Info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(exam.date)}</span>
                                {status === "upcoming" && daysUntil > 0 && (
                                    <span
                                        className={cn(
                                            "ml-1 font-medium",
                                            daysUntil <= 3
                                                ? "text-red-500"
                                                : daysUntil <= 7
                                                ? "text-orange-500"
                                                : "text-muted-foreground"
                                        )}>
                                        ({daysUntil} days left)
                                    </span>
                                )}
                            </div>
                            {exam.duration > 0 && (
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{exam.duration} min</span>
                                </div>
                            )}
                            {exam.location && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{exam.location}</span>
                                </div>
                            )}
                        </div>

                        {/* Grade Display */}
                        {status === "graded" && exam.grade !== undefined && (
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-700/85 rounded-lg">
                                    <Award className="w-4 h-4 text-green-600 dark:text-white" />
                                    <span className="font-bold text-green-700 dark:text-white">
                                        {exam.grade} / {exam.maxGrade}
                                    </span>
                                    {gradePercentage && (
                                        <span className="text-sm text-green-600 dark:text-white">
                                            ({gradePercentage}%)
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-3">
                            {status === "upcoming" || status === "today" ? (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onMarkAsTaken(exam)}>
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    Mark as Taken
                                </Button>
                            ) : status === "missed" ? (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onMarkAsTaken(exam)}>
                                    <CheckCircle2 className="w-4 h-4 mr-1" />I
                                    took this exam
                                </Button>
                            ) : status === "taken" ? (
                                <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => onAddGrade(exam)}>
                                    <Award className="w-4 h-4 mr-1" />
                                    Add Grade
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onAddGrade(exam)}>
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit Grade
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Actions Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(exam)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Exam
                            </DropdownMenuItem>
                            {!exam.taken && (
                                <DropdownMenuItem
                                    onClick={() => onMarkAsTaken(exam)}>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Mark as Taken
                                </DropdownMenuItem>
                            )}
                            {exam.taken && (
                                <DropdownMenuItem
                                    onClick={() => onAddGrade(exam)}>
                                    <Award className="w-4 h-4 mr-2" />
                                    {exam.grade !== undefined
                                        ? "Edit Grade"
                                        : "Add Grade"}
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(exam)}
                                className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
        </Card>
    );
};
