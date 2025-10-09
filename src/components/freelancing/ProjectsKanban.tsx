import { Progress } from "@/components/ui/progress";
import { DollarSign, Edit, CheckCircle2 } from "lucide-react";
import type { Project, ProjectStatus } from "@/types/freelancing";
import {
    calculateProjectProgress,
    getTasksForProject,
} from "@/hooks/useFreelancing";
import { KanbanBoard, KanbanCard } from "@/components/common";
import type { KanbanCardAction, KanbanCardBadge } from "@/components/common";

interface ProjectsKanbanProps {
    projects: Project[];
    onProjectClick: (projectId: string) => void;
    onProjectUpdate: (projectId: string, updates: Partial<Project>) => void;
    onProjectDone: (projectId: string) => void;
}

export const ProjectsKanban = ({
    projects,
    onProjectClick,
    onProjectUpdate,
    onProjectDone,
}: ProjectsKanbanProps) => {
    const todoProjects = projects.filter((p) => p.status === "todo");
    const inProgressProjects = projects.filter(
        (p) => p.status === "inProgress"
    );
    const doneProjects = projects.filter((p) => p.status === "done");

    const kanbanColumns = [
        {
            id: "todo",
            title: "To Do",
            items: todoProjects,
            color: "from-blue-500 to-cyan-500",
        },
        {
            id: "inProgress",
            title: "In Progress",
            items: inProgressProjects,
            color: "from-yellow-500 to-orange-500",
        },
        {
            id: "done",
            title: "Done",
            items: doneProjects,
            color: "from-green-500 to-emerald-500",
        },
    ];

    const getProjectBadges = (project: Project): KanbanCardBadge[] => {
        const tasks = getTasksForProject(project.id);
        const completedTasks = tasks.filter((t) => t.completed).length;

        const badges: KanbanCardBadge[] = [
            {
                label: `$${project.expectedProfit.toLocaleString()}`,
                variant: "outline",
                icon: <DollarSign className="h-3 w-3" />,
            },
        ];

        if (tasks.length > 0) {
            badges.push({
                label: `${completedTasks}/${tasks.length} tasks`,
                variant: "secondary",
            });
        }

        if (project.status === "done" && project.actualProfit !== undefined) {
            badges.push({
                label: `Profit: $${project.actualProfit.toLocaleString()}`,
                variant: "default",
                icon: <CheckCircle2 className="h-3 w-3" />,
            });
        }

        return badges;
    };

    const getProjectActions = (project: Project): KanbanCardAction[] => {
        const actions: KanbanCardAction[] = [
            {
                label: "View Details",
                icon: <Edit className="h-4 w-4" />,
                onClick: () => onProjectClick(project.id),
            },
        ];

        // Add status change actions
        if (project.status !== "todo") {
            actions.push({
                label: "Move to To Do",
                onClick: () => onProjectUpdate(project.id, { status: "todo" }),
            });
        }
        if (project.status !== "inProgress") {
            actions.push({
                label: "Move to In Progress",
                onClick: () =>
                    onProjectUpdate(project.id, { status: "inProgress" }),
            });
        }
        if (project.status !== "done") {
            actions.push({
                label: "Mark as Done",
                onClick: () => onProjectDone(project.id),
            });
        }

        return actions;
    };

    const handleDragEnd = (projectId: string, newColumnId: string) => {
        const newStatus = newColumnId as ProjectStatus;
        const project = projects.find((p) => p.id === projectId);

        if (!project || project.status === newStatus) return;

        if (newStatus === "done") {
            onProjectDone(projectId);
        } else {
            onProjectUpdate(projectId, { status: newStatus });
        }
    };

    return (
        <KanbanBoard
            columns={kanbanColumns}
            getItemId={(project) => project.id}
            onDragEnd={handleDragEnd}
            renderItem={(project) => {
                const tasks = getTasksForProject(project.id);
                const progress = calculateProjectProgress(project.id);

                return (
                    <div
                        onClick={() => onProjectClick(project.id)}
                        className="cursor-pointer">
                        <KanbanCard
                            id={project.id}
                            title={project.name}
                            description={project.description}
                            badges={getProjectBadges(project)}
                            actions={getProjectActions(project)}>
                            {tasks.length > 0 && (
                                <div className="mt-3">
                                    <Progress
                                        value={progress}
                                        className="h-2"
                                    />
                                </div>
                            )}
                        </KanbanCard>
                    </div>
                );
            }}
            dragOverlay={(project) => {
                const tasks = getTasksForProject(project.id);
                const progress = calculateProjectProgress(project.id);

                return (
                    <KanbanCard
                        id={project.id}
                        title={project.name}
                        description={project.description}
                        badges={getProjectBadges(project)}
                        actions={[]}>
                        {tasks.length > 0 && (
                            <div className="mt-3">
                                <Progress value={progress} className="h-2" />
                            </div>
                        )}
                    </KanbanCard>
                );
            }}
        />
    );
};
