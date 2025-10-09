import { useState } from "react";
import {
    ArrowLeft,
    Edit,
    Trash2,
    Calendar,
    AlertCircle,
    Plus,
    Github,
    ExternalLink,
    Clock,
    CheckCircle2,
    Grid3x3,
    List as ListIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/progress";
import { ProjectModal } from "@/components/programming/ProjectModal";
import { ProjectTaskModal } from "@/components/programming/ProjectTaskModal";
import { TimeTrackingModal } from "@/components/programming/TimeTrackingModal";
import { ProjectTaskKanban } from "@/components/programming/ProjectTaskKanban";
import type {
    CodingProject,
    ProjectTask,
    TimeEntry,
} from "@/types/programming";
import { formatDate, getPriorityColor } from "@/utils/helpers";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface ProjectDetailViewProps {
    project: CodingProject;
    tasks: ProjectTask[];
    onBack: () => void;
    onUpdate: (updates: Partial<CodingProject>) => void;
    onDelete: () => void;
    onAddTask: (task: Omit<ProjectTask, "id" | "createdAt">) => void;
    onUpdateTask: (taskId: string, updates: Partial<ProjectTask>) => void;
    onDeleteTask: (taskId: string) => void;
    onToggleTask: (taskId: string) => void;
}

export const ProjectDetailView = ({
    project,
    tasks,
    onBack,
    onUpdate,
    onDelete,
    onAddTask,
    onUpdateTask,
    onDeleteTask,
    onToggleTask,
}: ProjectDetailViewProps) => {
    const [showEditModal, setShowEditModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState<ProjectTask | undefined>();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [taskView, setTaskView] = useState<"list" | "kanban">("kanban");
    const [showTimeTracking, setShowTimeTracking] = useState(false);
    const [timeTrackingTask, setTimeTrackingTask] = useState<
        ProjectTask | undefined
    >();

    const completedTasks = tasks.filter((t) => t.completed).length;
    const progress =
        tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
    const totalEstimatedMinutes = tasks.reduce(
        (sum, task) => sum + (task.estimatedMinutes || 0),
        0
    );
    const totalActualMinutes = tasks.reduce(
        (sum, task) => sum + task.actualMinutes,
        0
    );

    const totalEstimatedHours = Math.floor(totalEstimatedMinutes / 60);
    const totalEstimatedMins = totalEstimatedMinutes % 60;
    const totalActualHours = Math.floor(totalActualMinutes / 60);
    const totalActualMins = totalActualMinutes % 60;

    const getStatusBadge = () => {
        if (project.status === "to-do")
            return <Badge variant="secondary">To Do</Badge>;
        if (project.status === "in-progress")
            return <Badge variant="default">In Progress</Badge>;
        return (
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                Completed
            </Badge>
        );
    };

    const handleEditTask = (task: ProjectTask) => {
        setEditingTask(task);
        setShowTaskModal(true);
    };

    const handleTaskModalClose = () => {
        setShowTaskModal(false);
        setEditingTask(undefined);
    };

    const handleTrackTime = (task: ProjectTask) => {
        setTimeTrackingTask(task);
        setShowTimeTracking(true);
    };

    const handleAddTimeEntry = (
        taskId: string,
        minutes: number,
        note?: string
    ) => {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        const newEntry: TimeEntry = {
            id: `time-${Date.now()}`,
            minutes,
            note,
            date: new Date().toISOString(),
        };

        const updatedTimeEntries = [...task.timeEntries, newEntry];
        const updatedActualMinutes = task.actualMinutes + minutes;

        onUpdateTask(taskId, {
            timeEntries: updatedTimeEntries,
            actualMinutes: updatedActualMinutes,
        });
    };

    const handleDeleteTimeEntry = (taskId: string, entryId: string) => {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        const entryToDelete = task.timeEntries.find((e) => e.id === entryId);
        if (!entryToDelete) return;

        const updatedTimeEntries = task.timeEntries.filter(
            (e) => e.id !== entryId
        );
        const updatedActualMinutes = task.actualMinutes - entryToDelete.minutes;

        onUpdateTask(taskId, {
            timeEntries: updatedTimeEntries,
            actualMinutes: Math.max(0, updatedActualMinutes),
        });

        toast.success("Time entry deleted");
    };

    return (
        <div className="space-y-6 animate-fadeIn">
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
                        className="gap-2 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 transition-all duration-200 shadow-sm text-primary">
                        <Edit className="h-4 w-4" />
                        Edit Project
                    </Button>
                    <Button
                        variant="outline"
                        size="default"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="gap-2 hover:bg-red-50 hover:border-red-500 hover:text-red-600 transition-all duration-200 shadow-sm text-primary">
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="text-sm text-muted-foreground">
                Programming &gt; Projects &gt;{" "}
                <span className="text-foreground font-medium">
                    {project.title}
                </span>
            </div>

            {/* Project Info Card */}
            <Card className="p-6 border-border">
                <div className="space-y-6">
                    {/* Title and Status */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">
                                {project.title}
                            </h1>
                            <p className="text-lg text-muted-foreground">
                                {project.type.charAt(0).toUpperCase() +
                                    project.type.slice(1)}{" "}
                                Project
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {getStatusBadge()}
                            <Badge variant={getPriorityColor(project.priority)}>
                                Priority {project.priority}
                            </Badge>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Technologies */}
                        {project.technologies.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Technologies
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {project.technologies.map((tech) => (
                                        <Badge key={tech} variant="outline">
                                            {tech}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Dates */}
                        {project.startDate && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Start Date
                                </p>
                                <p className="text-sm text-foreground">
                                    {formatDate(project.startDate)}
                                </p>
                            </div>
                        )}

                        {project.completedDate && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Completed Date
                                </p>
                                <p className="text-sm text-foreground">
                                    {formatDate(project.completedDate)}
                                </p>
                            </div>
                        )}

                        {project.dueDate && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Due Date
                                </p>
                                <p className="text-sm text-foreground">
                                    {formatDate(project.dueDate)}
                                </p>
                            </div>
                        )}

                        {/* Time Tracking */}
                        {(totalEstimatedHours > 0 ||
                            project.actualHours > 0) && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Time Spent
                                </p>
                                <p className="text-sm text-foreground">
                                    {project.actualHours}h
                                    {project.estimatedHours &&
                                        ` / ${project.estimatedHours}h estimated`}
                                </p>
                            </div>
                        )}

                        {/* Links */}
                        {project.repositoryUrl && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Github className="h-4 w-4" />
                                    Repository
                                </p>
                                <a
                                    href={project.repositoryUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex items-center gap-1">
                                    View on GitHub
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        )}

                        {project.liveUrl && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <ExternalLink className="h-4 w-4" />
                                    Live Demo
                                </p>
                                <a
                                    href={project.liveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex items-center gap-1">
                                    View Live Site
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Features */}
                    {project.features && project.features.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                                Key Features
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                                {project.features.map((feature, index) => (
                                    <li
                                        key={index}
                                        className="text-sm text-foreground">
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </Card>

            {/* Tasks Section */}
            <Card className="p-6 border-border">
                <div className="space-y-6">
                    {/* Task Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">
                                Project Tasks
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                {completedTasks} of {tasks.length} tasks
                                completed
                                {totalActualMinutes > 0 &&
                                    ` • ${totalActualHours}h ${totalActualMins}m spent`}
                                {totalEstimatedMinutes > 0 &&
                                    ` / ${totalEstimatedHours}h ${totalEstimatedMins}m estimated`}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* View Toggle */}
                            <div className="flex items-center gap-1 border rounded-md p-1">
                                <Button
                                    variant={
                                        taskView === "kanban"
                                            ? "default"
                                            : "ghost"
                                    }
                                    size="sm"
                                    onClick={() => setTaskView("kanban")}
                                    className="h-7 px-2">
                                    <Grid3x3 className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant={
                                        taskView === "list"
                                            ? "default"
                                            : "ghost"
                                    }
                                    size="sm"
                                    onClick={() => setTaskView("list")}
                                    className="h-7 px-2">
                                    <ListIcon className="h-3 w-3" />
                                </Button>
                            </div>
                            <Button
                                onClick={() => setShowTaskModal(true)}
                                className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Task
                            </Button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {tasks.length > 0 && (
                        <div className="space-y-2">
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground text-right">
                                {progress.toFixed(0)}% complete
                            </p>
                        </div>
                    )}

                    {/* Task Views */}
                    {tasks.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground mb-4">
                                No tasks yet
                            </p>
                            <Button
                                onClick={() => setShowTaskModal(true)}
                                variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Task
                            </Button>
                        </div>
                    ) : taskView === "kanban" ? (
                        <ProjectTaskKanban
                            tasks={tasks}
                            onEditTask={handleEditTask}
                            onDeleteTask={onDeleteTask}
                            onUpdateTask={onUpdateTask}
                            onTrackTime={handleTrackTime}
                        />
                    ) : (
                        <div className="space-y-3">
                            {tasks.map((task) => {
                                const taskHours = Math.floor(
                                    task.actualMinutes / 60
                                );
                                const taskMins = task.actualMinutes % 60;
                                const estHours = Math.floor(
                                    (task.estimatedMinutes || 0) / 60
                                );
                                const estMins =
                                    (task.estimatedMinutes || 0) % 60;

                                return (
                                    <Card
                                        key={task.id}
                                        className={cn(
                                            "p-4 border-border hover:border-primary/50 transition-colors",
                                            task.completed && "opacity-60"
                                        )}>
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={() =>
                                                    onToggleTask(task.id)
                                                }
                                                className="w-5 h-5 mt-0.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                                                title="Mark as complete"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <h3
                                                            className={cn(
                                                                "font-medium text-foreground",
                                                                task.completed &&
                                                                    "line-through text-muted-foreground"
                                                            )}>
                                                            {task.title}
                                                        </h3>
                                                        {task.description && (
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {
                                                                    task.description
                                                                }
                                                            </p>
                                                        )}
                                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                                            <Badge
                                                                variant={getPriorityColor(
                                                                    task.priority
                                                                )}
                                                                className="text-xs">
                                                                P{task.priority}
                                                            </Badge>
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs">
                                                                {task.status ===
                                                                    "todo" &&
                                                                    "To Do"}
                                                                {task.status ===
                                                                    "in-progress" &&
                                                                    "In Progress"}
                                                                {task.status ===
                                                                    "done" &&
                                                                    "Done"}
                                                            </Badge>
                                                            {task.estimatedMinutes && (
                                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    Est:{" "}
                                                                    {estHours}h{" "}
                                                                    {estMins}m
                                                                </span>
                                                            )}
                                                            {task.actualMinutes >
                                                                0 && (
                                                                <span className="text-xs text-primary font-medium flex items-center gap-1">
                                                                    Spent:{" "}
                                                                    {taskHours}h{" "}
                                                                    {taskMins}m
                                                                </span>
                                                            )}
                                                            {task.timeEntries
                                                                .length > 0 && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    (
                                                                    {
                                                                        task
                                                                            .timeEntries
                                                                            .length
                                                                    }{" "}
                                                                    sessions)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleTrackTime(
                                                                    task
                                                                )
                                                            }
                                                            className="h-8 px-2"
                                                            title="Track time">
                                                            <Clock className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleEditTask(
                                                                    task
                                                                )
                                                            }
                                                            className="h-8 px-2">
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                onDeleteTask(
                                                                    task.id
                                                                )
                                                            }
                                                            className="h-8 px-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Card>

            {/* Modals */}
            <ProjectModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSave={() => {}}
                onUpdate={(_id, updates) => {
                    onUpdate(updates);
                    setShowEditModal(false);
                }}
                project={project}
            />

            <ProjectTaskModal
                isOpen={showTaskModal}
                onClose={handleTaskModalClose}
                onSave={(task) => {
                    onAddTask(task);
                    handleTaskModalClose();
                }}
                onUpdate={(taskId, updates) => {
                    onUpdateTask(taskId, updates);
                    handleTaskModalClose();
                }}
                task={editingTask}
            />

            {/* Time Tracking Modal */}
            {timeTrackingTask && (
                <TimeTrackingModal
                    isOpen={showTimeTracking}
                    onClose={() => {
                        setShowTimeTracking(false);
                        setTimeTrackingTask(undefined);
                    }}
                    taskTitle={timeTrackingTask.title}
                    timeEntries={timeTrackingTask.timeEntries}
                    onAddTimeEntry={(minutes, note) => {
                        handleAddTimeEntry(timeTrackingTask.id, minutes, note);
                    }}
                    onDeleteTimeEntry={(entryId) => {
                        handleDeleteTimeEntry(timeTrackingTask.id, entryId);
                    }}
                />
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="p-6 max-w-md">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Delete Project?
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Are you sure you want to delete this project? This
                            action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
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
