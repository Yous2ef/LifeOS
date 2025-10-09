import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormInput } from "@/components/ui/FormInput";
import { Badge } from "@/components/ui/Badge";
import {
    Plus,
    Edit2,
    Trash2,
    Calendar,
    List,
    LayoutGrid,
    Clock,
    Edit,
} from "lucide-react";
import type { StandaloneTask, TaskStatus } from "@/types/freelancing";
import { isOverdue } from "@/hooks/useFreelancing";
import {
    KanbanBoard,
    KanbanCard,
    ListView,
    ListCard,
} from "@/components/common";
import type {
    KanbanCardAction,
    KanbanCardBadge,
    ListCardAction,
    ListCardBadge,
} from "@/components/common";
import { format } from "date-fns";
import {
    getPriorityColor,
    formatDateRelative,
    isDateToday,
} from "@/utils/helpers";

interface StandaloneTasksProps {
    tasks: StandaloneTask[];
    onAddTask: () => void;
    onEditTask: (task: StandaloneTask) => void;
    onDeleteTask: (taskId: string) => void;
    onToggleStatus: (taskId: string, completed: boolean) => void;
    onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
}

type ViewMode = "list" | "kanban";
type FilterOption = "all" | "high-priority" | "overdue";

export const StandaloneTasks = ({
    tasks,
    onAddTask,
    onEditTask,
    onDeleteTask,
    onToggleStatus,
    onUpdateTaskStatus,
}: StandaloneTasksProps) => {
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [filter, setFilter] = useState<FilterOption>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Filter and search tasks
    const filteredTasks = tasks.filter((task) => {
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (
                !task.title.toLowerCase().includes(query) &&
                !task.description?.toLowerCase().includes(query)
            ) {
                return false;
            }
        }

        // Status filters
        if (filter === "high-priority" && task.priority < 7) return false;
        if (filter === "overdue" && (!task.dueDate || !isOverdue(task.dueDate)))
            return false;

        return true;
    });

    // Helper to create Kanban card badges
    const getKanbanBadges = (task: StandaloneTask): KanbanCardBadge[] => {
        const badges: KanbanCardBadge[] = [];
        badges.push({
            label: `Priority ${task.priority}`,
            variant: getPriorityColor(task.priority),
        });

        if (task.timeEstimate) {
            badges.push({
                label: `${task.timeEstimate}h`,
                variant: "outline",
                icon: <Clock className="h-3 w-3" />,
            });
        }

        if (task.dueDate) {
            const taskOverdue = isOverdue(task.dueDate);
            badges.push({
                label: format(new Date(task.dueDate), "MMM dd, yyyy"),
                variant: taskOverdue
                    ? "destructive"
                    : isDateToday(task.dueDate)
                    ? "destructive"
                    : "outline",
                icon: <Clock className="h-3 w-3" />,
            });
        }

        task.tags.forEach((tag) => {
            badges.push({ label: tag, variant: "outline" });
        });

        return badges;
    };

    // Helper to create Kanban card actions
    const getKanbanActions = (task: StandaloneTask): KanbanCardAction[] => {
        const actions: KanbanCardAction[] = [
            {
                label: "Edit",
                icon: <Edit className="h-4 w-4" />,
                onClick: () => onEditTask(task),
            },
        ];

        // Add status change actions
        if (task.status !== "todo") {
            actions.push({
                label: "Move to To Do",
                onClick: () => onUpdateTaskStatus(task.id, "todo"),
            });
        }
        if (task.status !== "inProgress") {
            actions.push({
                label: "Move to In Progress",
                onClick: () => onUpdateTaskStatus(task.id, "inProgress"),
            });
        }
        if (task.status !== "completed") {
            actions.push({
                label: "Move to Done",
                onClick: () => onUpdateTaskStatus(task.id, "completed"),
            });
        }

        actions.push({
            label: "Delete",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: () => onDeleteTask(task.id),
            variant: "destructive",
            separator: true,
        });

        return actions;
    };

    // Helper to create List card badges
    const getListBadges = (task: StandaloneTask): ListCardBadge[] => {
        const taskOverdue = task.dueDate && isOverdue(task.dueDate);
        const isCompleted = task.status === "completed";
        const badges: ListCardBadge[] = [];
        badges.push({
            label: `Priority ${task.priority}`,
            variant: getPriorityColor(task.priority),
        });

        if (task.dueDate) {
            badges.push({
                label: format(new Date(task.dueDate), "MMM dd, yyyy"),
                icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
                variant: "outline",
            });
        }

        badges.push({
            label:
                task.status === "inProgress"
                    ? "In Progress"
                    : task.status === "completed"
                    ? "Completed"
                    : "To Do",
            variant: "outline",
        });

        task.tags.forEach((tag) => {
            badges.push({ label: tag, variant: "secondary" });
        });

        return badges;
    };

    // Helper to create List card actions
    const getListActions = (task: StandaloneTask): ListCardAction[] => [
        {
            icon: <Edit className="h-4 w-4" />,
            onClick: () => onEditTask(task),
            label: "Edit",
        },
        {
            icon: <Trash2 className="h-4 w-4" />,
            onClick: () => onDeleteTask(task.id),
            variant: "destructive",
            label: "Delete",
        },
    ];

    // Kanban columns
    const kanbanColumns = [
        {
            id: "todo",
            title: "To Do",
            items: filteredTasks.filter((t) => t.status === "todo"),
            color: "from-blue-500 to-cyan-500",
        },
        {
            id: "inProgress",
            title: "In Progress",
            items: filteredTasks.filter((t) => t.status === "inProgress"),
            color: "from-yellow-500 to-orange-500",
        },
        {
            id: "completed",
            title: "Completed",
            items: filteredTasks.filter((t) => t.status === "completed"),
            color: "from-green-500 to-emerald-500",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">
                    Standalone Tasks
                </h2>
                <Button onClick={onAddTask} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Task
                </Button>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
                <FormInput
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    className="flex-1"
                />

                <div className="flex gap-2">
                    <select
                        value={filter}
                        onChange={(e) =>
                            setFilter(e.target.value as FilterOption)
                        }
                        aria-label="Filter tasks"
                        className="px-4 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="all">All Tasks</option>
                        <option value="high-priority">High Priority</option>
                        <option value="overdue">Overdue</option>
                    </select>

                    <div className="flex border border-input rounded-md text-primary">
                        <Button
                            variant={viewMode === "list" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("list")}
                            className="gap-2 rounded-r-none h-full">
                            <List className="h-4 w-4" />
                            List
                        </Button>
                        <Button
                            variant={
                                viewMode === "kanban" ? "default" : "ghost"
                            }
                            size="sm"
                            onClick={() => setViewMode("kanban")}
                            className="gap-2 rounded-l-none h-full ">
                            <LayoutGrid className="h-4 w-4" />
                            Kanban
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tasks Display */}
            {viewMode === "list" ? (
                <ListView
                    items={filteredTasks}
                    getItemId={(task) => task.id}
                    emptyMessage={
                        searchQuery || filter !== "all"
                            ? "No tasks match your filters"
                            : "No tasks yet. Click 'Add Task' to get started."
                    }
                    renderItem={(task) => {
                        const isCompleted = task.status === "completed";
                        return (
                            <ListCard
                                title={task.title}
                                description={task.description}
                                badges={getListBadges(task)}
                                actions={getListActions(task)}
                                className={isCompleted ? "opacity-60" : ""}>
                                {/* <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={isCompleted}
                                        onCheckedChange={(checked) =>
                                            onToggleStatus(
                                                task.id,
                                                checked as boolean
                                            )
                                        }
                                    />
                                
                                </div> */}
                            </ListCard>
                        );
                    }}
                />
            ) : (
                <KanbanBoard
                    columns={kanbanColumns}
                    getItemId={(task) => task.id}
                    onDragEnd={(itemId, newColumnId) => {
                        onUpdateTaskStatus(itemId, newColumnId as TaskStatus);
                    }}
                    renderItem={(task) => (
                        <KanbanCard
                            id={task.id}
                            title={task.title}
                            description={task.description}
                            badges={getKanbanBadges(task)}
                            actions={getKanbanActions(task)}
                        />
                    )}
                    dragOverlay={(task) => (
                        <KanbanCard
                            id={task.id}
                            title={task.title}
                            description={task.description}
                            badges={getKanbanBadges(task)}
                            actions={[]}
                        />
                    )}
                />
            )}
        </div>
    );
};
