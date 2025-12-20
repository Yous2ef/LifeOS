import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { TextArea } from "@/components/ui/TextArea";
import type { ProjectTask } from "@/types/modules/programming";
import toast from "react-hot-toast";

interface ProjectTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Omit<ProjectTask, "id" | "createdAt">) => void;
    onUpdate?: (taskId: string, updates: Partial<ProjectTask>) => void;
    task?: ProjectTask;
}

export const ProjectTaskModal = ({
    isOpen,
    onClose,
    onSave,
    onUpdate,
    task,
}: ProjectTaskModalProps) => {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        status: "todo" as "todo" | "in-progress" | "done",
        priority: 5,
        estimatedMinutes: "",
        completed: false,
    });

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title,
                description: task.description || "",
                status: task.status,
                priority: task.priority,
                estimatedMinutes: task.estimatedMinutes?.toString() || "",
                completed: task.completed,
            });
        } else {
            setFormData({
                title: "",
                description: "",
                status: "todo",
                priority: 5,
                estimatedMinutes: "",
                completed: false,
            });
        }
    }, [task, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error("Please enter a task title");
            return;
        }

        const taskData = {
            title: formData.title.trim(),
            description: formData.description.trim() || undefined,
            status: formData.status,
            priority: formData.priority,
            estimatedMinutes: formData.estimatedMinutes
                ? parseInt(formData.estimatedMinutes)
                : undefined,
            actualMinutes: task?.actualMinutes || 0,
            timeEntries: task?.timeEntries || [],
            completed: formData.completed,
            completedAt: formData.completed
                ? new Date().toISOString()
                : undefined,
        };

        if (task && onUpdate) {
            onUpdate(task.id, taskData);
        } else {
            onSave(taskData);
        }

        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={task ? "Edit Task" : "Add New Task"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <FormInput
                    label="Task Title"
                    value={formData.title}
                    onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Implement user authentication"
                    required
                />

                {/* Description */}
                <TextArea
                    label="Description"
                    value={formData.description}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            description: e.target.value,
                        })
                    }
                    placeholder="Describe the task in detail..."
                    rows={4}
                />

                {/* Priority */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Priority: {formData.priority}
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.priority}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                priority: parseInt(e.target.value),
                            })
                        }
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Low</span>
                        <span>Medium</span>
                        <span>High</span>
                    </div>
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Status
                    </label>
                    <select
                        value={formData.status}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                status: e.target.value as
                                    | "todo"
                                    | "in-progress"
                                    | "done",
                            })
                        }
                        className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Done</option>
                    </select>
                </div>

                {/* Time Estimate */}
                <FormInput
                    label="Estimated Time (minutes)"
                    type="number"
                    min="0"
                    step="15"
                    value={formData.estimatedMinutes}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            estimatedMinutes: e.target.value,
                        })
                    }
                    placeholder="e.g., 120 (2 hours)"
                />

                {task && task.actualMinutes > 0 && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                            Time spent: {Math.floor(task.actualMinutes / 60)}h{" "}
                            {task.actualMinutes % 60}m
                            {task.timeEntries.length > 0 &&
                                ` (${task.timeEntries.length} sessions)`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Use the "Track Time" button in the task list to add
                            work sessions
                        </p>
                    </div>
                )}

                {/* Completed Checkbox */}
                {task && (
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="completed"
                            checked={formData.completed}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    completed: e.target.checked,
                                })
                            }
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <label
                            htmlFor="completed"
                            className="text-sm font-medium text-foreground cursor-pointer">
                            Mark as completed
                        </label>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        {task ? "Update Task" : "Add Task"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
