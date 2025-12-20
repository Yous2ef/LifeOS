import { ListView, ListCard, type ListCardBadge } from "@/components/common";
import { Progress } from "@/components/ui/progress";
import { Calendar, DollarSign, AlertCircle } from "lucide-react";
import type { Project } from "@/types/modules/freelancing";
import {
    formatCurrency,
    getPriorityLabel,
    isOverdue,
    getDaysRemaining,
    calculateProjectProgress,
    getTasksForProject,
} from "@/hooks/useFreelancing";
import { getPriorityColor } from "@/utils/helpers";

interface ProjectsListProps {
    projects: Project[];
    onProjectClick: (projectId: string) => void;
}

export const ProjectsList = ({
    projects,
    onProjectClick,
}: ProjectsListProps) => {
    const getStatusVariant = (status: Project["status"]) => {
        if (status === "todo") return "secondary" as const;
        if (status === "inProgress") return "default" as const;
        return "outline" as const; // For done status (will be green via className)
    };

    const getStatusLabel = (status: Project["status"]) => {
        if (status === "todo") return "To Do";
        if (status === "inProgress") return "In Progress";
        return "Done";
    };

    const getProjectBadges = (project: Project): ListCardBadge[] => {
        const badges: ListCardBadge[] = [
            {
                label: getStatusLabel(project.status),
                variant: getStatusVariant(project.status),
                className:
                    project.status === "done"
                        ? "bg-green-500/10 text-green-500"
                        : undefined,
            },
        ];

        if (project.priority) {
            badges.push({
                label: getPriorityLabel(project.priority),
                variant: getPriorityColor(project.priority),
            });
        }

        // Financial badge
        const amount =
            project.status === "done" && project.actualProfit
                ? project.actualProfit
                : project.expectedProfit;

        badges.push({
            label: formatCurrency(amount, project.currency),
            variant: "outline",
            icon: <DollarSign className="h-3 w-3 text-green-500" />,
        });

        // Tags
        project.tags.slice(0, 2).forEach((tag) => {
            badges.push({
                label: tag,
                variant: "outline",
            });
        });

        if (project.tags.length > 2) {
            badges.push({
                label: `+${project.tags.length - 2}`,
                variant: "outline",
            });
        }

        // Deadline badge
        const overdue = isOverdue(project.deadline);
        const daysLeft = getDaysRemaining(project.deadline);

        const deadlineLabel = overdue
            ? "Overdue"
            : daysLeft > 0
            ? `${daysLeft} days left`
            : daysLeft === 0
            ? "Due today"
            : "Overdue";

        badges.push({
            label: deadlineLabel,
            variant: overdue ? "destructive" : "outline",
            icon: overdue ? (
                <AlertCircle className="h-3 w-3" />
            ) : (
                <Calendar className="h-3 w-3" />
            ),
        });

        return badges;
    };

    return (
        <ListView
            items={projects}
            getItemId={(project) => project.id}
            emptyMessage="No projects yet. Create your first project!"
            renderItem={(project) => {
                const tasks = getTasksForProject(project.id);
                const progress = calculateProjectProgress(project.id);
                const completedTasks = tasks.filter((t) => t.completed).length;

                return (
                    <ListCard
                        title={project.name}
                        description={project.clientName}
                        badges={getProjectBadges(project)}
                        onClick={() => onProjectClick(project.id)}>
                        {tasks.length > 0 && (
                            <div className="space-y-1 mt-3">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>
                                        {completedTasks}/{tasks.length} tasks
                                    </span>
                                    <span>{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-1.5" />
                            </div>
                        )}
                    </ListCard>
                );
            }}
        />
    );
};
