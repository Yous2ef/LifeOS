import { useState } from "react";
import {
    ListView,
    ListCard,
    type ListCardBadge,
    type ListCardAction,
} from "@/components/common";
import { Checkbox } from "@/components/ui/Checkbox";
import { Edit, Trash2, Calendar, CheckSquare, Square } from "lucide-react";
import type { ProjectTask } from "@/types/freelancing";
import { getPriorityLabel, isOverdue } from "@/hooks/useFreelancing";
import { getPriorityColor } from "@/utils/helpers";

interface ProjectTaskListProps {
    tasks: ProjectTask[];
    onToggleComplete: (taskId: string) => void;
    onEdit: (task: ProjectTask) => void;
    onDelete: (taskId: string) => void;
}

export const ProjectTaskList = ({
    tasks,
    onToggleComplete,
    onEdit,
    onDelete,
}: ProjectTaskListProps) => {
    const [showCompleted, setShowCompleted] = useState(true);

    const activeTasks = tasks.filter((t) => !t.completed);
    const completedTasks = tasks.filter((t) => t.completed);

    const getTaskBadges = (task: ProjectTask): ListCardBadge[] => {
        const badges: ListCardBadge[] = [];

        // Priority badge
        badges.push({
            label: getPriorityLabel(task.priority),
            variant: getPriorityColor(task.priority),
        });

        // Due date badge
        if (task.dueDate) {
            const taskOverdue = isOverdue(task.dueDate);
            badges.push({
                label: `Due: ${new Date(task.dueDate).toLocaleDateString()}${
                    taskOverdue && !task.completed ? " (Overdue)" : ""
                }`,
                variant:
                    taskOverdue && !task.completed ? "destructive" : "outline",
                icon: <Calendar className="h-3 w-3" />,
            });
        }

        // Time estimate badge
        if (task.timeEstimate) {
            badges.push({
                label: `${task.timeEstimate}h estimated`,
                variant: "outline",
            });
        }

        return badges;
    };

    const getTaskActions = (task: ProjectTask): ListCardAction[] => {
        return [
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
            },
            {
                label: "Delete",
                icon: <Trash2 className="h-4 w-4" />,
                onClick: () => onDelete(task.id),
                variant: "destructive",
            },
        ];
    };

    if (tasks.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">
                    No tasks yet. Click "Add Task" to get started.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Active Tasks */}
            {activeTasks.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Active Tasks ({activeTasks.length})
                    </h3>
                    <ListView
                        items={activeTasks}
                        getItemId={(task) => task.id}
                        emptyMessage=""
                        renderItem={(task) => (
                            <div className="flex items-start gap-4">
                                <Checkbox
                                    checked={task.completed}
                                    onCheckedChange={() =>
                                        onToggleComplete(task.id)
                                    }
                                    className="mt-4"
                                />
                                <div className="flex-1">
                                    <ListCard
                                        title={task.title}
                                        description={task.description}
                                        badges={getTaskBadges(task)}
                                        actions={getTaskActions(task)}
                                        className={
                                            task.completed ? "opacity-60" : ""
                                        }
                                    />
                                </div>
                            </div>
                        )}
                    />
                </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
                <div className="space-y-2">
                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="text-sm font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors">
                        Completed Tasks ({completedTasks.length})
                        <span className="ml-2">
                            {showCompleted ? "▼" : "▶"}
                        </span>
                    </button>
                    {showCompleted && (
                        <ListView
                            items={completedTasks}
                            getItemId={(task) => task.id}
                            emptyMessage=""
                            renderItem={(task) => (
                                <div className="flex items-start gap-4">
                                    <Checkbox
                                        checked={task.completed}
                                        onCheckedChange={() =>
                                            onToggleComplete(task.id)
                                        }
                                        className="mt-4"
                                    />
                                    <div className="flex-1">
                                        <ListCard
                                            title={task.title}
                                            description={task.description}
                                            badges={getTaskBadges(task)}
                                            actions={getTaskActions(task)}
                                            className="opacity-60"
                                        />
                                    </div>
                                </div>
                            )}
                        />
                    )}
                </div>
            )}
        </div>
    );
};
