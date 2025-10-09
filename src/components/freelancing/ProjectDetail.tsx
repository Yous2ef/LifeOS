import { useState } from "react";
import {
    ArrowLeft,
    Edit,
    Trash2,
    Calendar,
    DollarSign,
    AlertCircle,
    Grid3x3,
    List as ListIcon,
    Plus,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/progress";
import { ProjectTaskList } from "@/components/freelancing/ProjectTaskList";
import { ProjectTaskKanban } from "@/components/freelancing/ProjectTaskKanban";
import { ProjectTaskModal } from "@/components/freelancing/TaskModals";
import { ProjectModal } from "@/components/freelancing/ProjectModal";
import type { Project, TaskStatus } from "@/types/freelancing";
import {
    formatCurrency,
    getPriorityLabel,
    isOverdue,
    getDaysRemaining,
    calculateProjectProgress,
} from "@/hooks/useFreelancing";
import { useProjectTasks } from "@/hooks/useFreelancing";
import { cn } from "@/lib/utils";
import { getPriorityColor } from "@/utils/helpers";

interface ProjectDetailProps {
    project: Project;
    onBack: () => void;
    onUpdate: (updates: Partial<Project>) => void;
    onDelete: () => void;
}

export const ProjectDetail = ({
    project,
    onBack,
    onUpdate,
    onDelete,
}: ProjectDetailProps) => {
    const [showEditModal, setShowEditModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [taskView, setTaskView] = useState<"list" | "kanban">("kanban");

    const {
        tasks,
        addTask,
        deleteTask,
        toggleTaskComplete,
        updateTask,
        reloadTasks,
    } = useProjectTasks(project.id);

    const progress = calculateProjectProgress(project.id);
    const overdue = isOverdue(project.deadline);
    const daysLeft = getDaysRemaining(project.deadline);
    const completedTasks = tasks.filter((t) => t.completed).length;

    const getStatusBadge = () => {
        if (project.status === "todo")
            return <Badge variant="secondary">To Do</Badge>;
        if (project.status === "inProgress")
            return <Badge variant="default">In Progress</Badge>;
        return <Badge className="bg-green-500/10 text-green-500">Done</Badge>;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="default"
                        onClick={onBack}
                        className="gap-2 hover:bg-primary/10 hover:border-primary text-primary transition-all duration-200 font-medium shadow-sm">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Projects
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="default"
                        onClick={() => setShowEditModal(true)}
                        className="gap-2 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 transition-all duration-200 shadow-sm text-primary ">
                        <Edit className="h-4 w-4" />
                        Edit Project
                    </Button>
                    <Button
                        variant="outline"
                        size="default"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="gap-2 hover:bg-red-50 hover:border-red-500 hover:text-red-600 transition-all duration-200 shadow-sm text-primary ">
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="text-sm text-muted-foreground">
                Freelancing &gt; Projects &gt;{" "}
                <span className="text-foreground font-medium">
                    {project.name}
                </span>
            </div>

            {/* Project Info Card */}
            <Card className="p-6 border-border">
                <div className="space-y-6">
                    {/* Title and Status */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">
                                {project.name}
                            </h1>
                            <p className="text-lg text-muted-foreground">
                                {project.clientName}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {getStatusBadge()}
                            {project.priority && (
                                <Badge
                                    variant={getPriorityColor(
                                        project.priority
                                    )}>
                                    {getPriorityLabel(project.priority)}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {project.description && (
                        <div className="bg-muted/50 rounded-lg p-4">
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                                {project.description}
                            </p>
                        </div>
                    )}

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            {/* Dates */}
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-2">
                                    Timeline
                                </p>
                                <div className="space-y-2">
                                    {project.startDate && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-foreground">
                                                Started:{" "}
                                                {new Date(
                                                    project.startDate
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm">
                                        {overdue ? (
                                            <AlertCircle className="h-4 w-4 text-destructive" />
                                        ) : (
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span>Deadline: </span>
                                        <span
                                            dir="rtl"
                                            className={
                                                overdue
                                                    ? "text-destructive font-medium"
                                                    : "text-foreground"
                                            }>
                                            {new Date(project.deadline)
                                                .toLocaleDateString()
                                                .toString()}
                                        </span>
                                        <span>
                                            {" "}
                                            {overdue
                                                ? " (Overdue)"
                                                : ` (${daysLeft} days left)`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Profit */}
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-2">
                                    Financial
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-green-500" />
                                        <span className="text-sm text-muted-foreground">
                                            Expected:
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            {formatCurrency(
                                                project.expectedProfit,
                                                project.currency
                                            )}
                                        </span>
                                    </div>
                                    {project.actualProfit && (
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-green-600" />
                                            <span className="text-sm text-muted-foreground">
                                                Actual:
                                            </span>
                                            <span className="font-bold text-green-600">
                                                {formatCurrency(
                                                    project.actualProfit,
                                                    project.currency
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Tags */}
                            {project.tags.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-2">
                                        Tags
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {project.tags.map((tag, index) => (
                                            <Badge
                                                key={index}
                                                variant="outline">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Metadata */}
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-2">
                                    Metadata
                                </p>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                    <p>
                                        Created:{" "}
                                        <span dir="rtl">
                                            {new Date(
                                                project.createdAt
                                            ).toLocaleDateString()}
                                        </span>
                                    </p>
                                    <p>
                                        Last updated:{" "}
                                        <span dir="rtl">
                                            {new Date(
                                                project.updatedAt
                                            ).toLocaleDateString()}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-foreground">
                                Project Progress
                            </h3>
                            <div className="text-sm text-muted-foreground">
                                {completedTasks} of {tasks.length} tasks
                                completed
                            </div>
                        </div>
                        <Progress value={progress} className="h-2.5" />
                        <div className="text-right mt-2">
                            <span className="text-2xl font-bold text-primary">
                                {progress}%
                            </span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Tasks Section */}
            <Card className="p-6 border-border">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-foreground">
                        Tasks
                    </h2>
                    <div className="flex items-center gap-2">
                        {/* View Toggle using shadcn Button pattern */}
                        <Button
                            variant={
                                taskView === "kanban" ? "secondary" : "ghost"
                            }
                            size="sm"
                            onClick={() => setTaskView("kanban")}
                            aria-label="Kanban view"
                            className={cn(
                                "text-primary",
                                taskView === "kanban" &&
                                    "bg-primary/10 text-primary hover:bg-primary/20"
                            )}>
                            <Grid3x3 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={
                                taskView === "list" ? "secondary" : "ghost"
                            }
                            size="sm"
                            onClick={() => setTaskView("list")}
                            aria-label="List view"
                            className={cn(
                                "text-primary",
                                taskView === "list" &&
                                    "bg-primary/10 hover:bg-primary/20"
                            )}>
                            <ListIcon className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => setShowTaskModal(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Task
                        </Button>
                    </div>
                </div>

                {taskView === "kanban" ? (
                    <ProjectTaskKanban
                        tasks={tasks}
                        onToggleComplete={toggleTaskComplete}
                        onEdit={() => {
                            // Will implement edit functionality later
                        }}
                        onDelete={deleteTask}
                        onUpdateStatus={(
                            taskId: string,
                            newStatus: TaskStatus
                        ) => {
                            updateTask(taskId, { status: newStatus });
                        }}
                    />
                ) : (
                    <ProjectTaskList
                        tasks={tasks}
                        onToggleComplete={toggleTaskComplete}
                        onEdit={() => {
                            // Will implement edit functionality later
                        }}
                        onDelete={deleteTask}
                    />
                )}
            </Card>

            {/* Modals */}
            {showEditModal && (
                <ProjectModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onSave={(updates) => {
                        onUpdate(updates);
                        setShowEditModal(false);
                    }}
                    project={project}
                    mode="edit"
                />
            )}

            {showTaskModal && (
                <ProjectTaskModal
                    isOpen={showTaskModal}
                    onClose={() => setShowTaskModal(false)}
                    onSave={(taskData) => {
                        addTask(taskData);
                        setShowTaskModal(false);
                        reloadTasks();
                    }}
                    projectId={project.id}
                    mode="create"
                />
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Delete Project?
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Are you sure you want to delete "{project.name}"?
                            This will also delete all associated tasks. This
                            action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="secondary"
                                onClick={() => setShowDeleteConfirm(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    onDelete();
                                    setShowDeleteConfirm(false);
                                }}>
                                Delete Project
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
