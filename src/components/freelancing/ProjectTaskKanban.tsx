import {
    KanbanBoard,
    KanbanCard,
    type KanbanCardBadge,
    type KanbanCardAction,
} from "@/components/common";
import { Calendar, Edit, Trash2, CheckSquare, Square } from "lucide-react";
import type { ProjectTask, TaskStatus } from "@/types/freelancing";
import { getPriorityLabel, isOverdue } from "@/hooks/useFreelancing";
import { getPriorityColor } from "@/utils/helpers";

interface ProjectTaskKanbanProps {
    tasks: ProjectTask[];
    onToggleComplete: (taskId: string) => void;
    onEdit: (task: ProjectTask) => void;
    onDelete: (taskId: string) => void;
    onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
}

export const ProjectTaskKanban = ({
    tasks,
    onToggleComplete,
    onEdit,
    onDelete,
    onUpdateStatus,
}: ProjectTaskKanbanProps) => {
    const getTaskBadges = (task: ProjectTask): KanbanCardBadge[] => {
        const badges: KanbanCardBadge[] = [];

        // Priority badge
        if (task.priority) {
            badges.push({
                label: getPriorityLabel(task.priority),
                variant: getPriorityColor(task.priority),
            });
        }

        // Due date badge
        if (task.dueDate) {
            const overdue = isOverdue(task.dueDate);
            badges.push({
                label: new Date(task.dueDate).toLocaleDateString(),
                variant: overdue ? "destructive" : "outline",
                icon: <Calendar className="h-3 w-3" />,
            });
        }

        return badges;
    };

    const getTaskActions = (task: ProjectTask): KanbanCardAction[] => {
        const actions: KanbanCardAction[] = [
            {
                label: task.completed ? "Mark Incomplete" : "Mark Complete",
                icon: task.completed ? (
                    <Square className="h-4 w-4" />
                ) : (
                    <CheckSquare className="h-4 w-4" />
                ),
                onClick: () => onToggleComplete(task.id),
            },
            {
                label: "Edit",
                icon: <Edit className="h-4 w-4" />,
                onClick: () => onEdit(task),
                separator: true,
            },
            {
                label: "Delete",
                icon: <Trash2 className="h-4 w-4" />,
                onClick: () => onDelete(task.id),
                variant: "destructive",
            },
        ];

        // Add status change actions if not completed
        if (!task.completed) {
            const currentStatus = task.status || "todo";
            const statusActions: KanbanCardAction[] = [];

            if (currentStatus !== "inProgress") {
                statusActions.push({
                    label: "Move to In Progress",
                    onClick: () => onUpdateStatus(task.id, "inProgress"),
                    separator: statusActions.length === 0,
                });
            }
            if (currentStatus !== "todo") {
                statusActions.push({
                    label: "Move to To Do",
                    onClick: () => onUpdateStatus(task.id, "todo"),
                    separator: statusActions.length === 0,
                });
            }

            // Insert status actions before Edit
            actions.splice(1, 0, ...statusActions);
        }

        return actions;
    };

    const handleDragEnd = (taskId: string, newColumnId: string) => {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        const newStatus = newColumnId as TaskStatus;

        // Handle completed column
        if (newStatus === "completed") {
            if (!task.completed) {
                onToggleComplete(taskId);
            }
        } else {
            // If task is completed and moved to todo or inProgress, uncomplete it
            if (task.completed) {
                onToggleComplete(taskId);
            }
            onUpdateStatus(taskId, newStatus);
        }
    };

    // Prepare columns data
    const todoTasks = tasks.filter(
        (t) => !t.completed && (!t.status || t.status === "todo")
    );
    const inProgressTasks = tasks.filter(
        (t) => !t.completed && t.status === "inProgress"
    );
    const completedTasks = tasks.filter((t) => t.completed);

    const columns = [
        {
            id: "todo",
            title: "📋 To Do",
            items: todoTasks,
            color: "from-blue-500 to-cyan-500",
        },
        {
            id: "inProgress",
            title: "🔶 In Progress",
            items: inProgressTasks,
            color: "from-yellow-500 to-orange-500",
        },
        {
            id: "completed",
            title: "✅ Completed",
            items: completedTasks,
            color: "from-green-500 to-emerald-500",
        },
    ];

    return (
        <KanbanBoard
            columns={columns}
            getItemId={(task) => task.id}
            onDragEnd={handleDragEnd}
            renderItem={(task) => (
                <KanbanCard
                    id={task.id}
                    title={task.title}
                    description={task.description}
                    badges={getTaskBadges(task)}
                    actions={getTaskActions(task)}
                    className={task.completed ? "opacity-60" : ""}
                />
            )}
            dragOverlay={(task) => (
                <KanbanCard
                    id={task.id}
                    title={task.title}
                    description={task.description}
                    badges={getTaskBadges(task)}
                    actions={[]}
                    className={task.completed ? "opacity-60" : ""}
                />
            )}
        />
    );
};
