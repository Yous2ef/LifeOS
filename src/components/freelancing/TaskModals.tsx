import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { TextArea } from "@/components/ui/TextArea";
import type { ProjectTask, StandaloneTask } from "@/types/freelancing";

interface ProjectTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Omit<ProjectTask, "id" | "createdAt" | "completed">) => void;
    task?: ProjectTask;
    projectId: string;
    mode: "create" | "edit";
}

export const ProjectTaskModal = ({
    isOpen,
    onClose,
    onSave,
    task,
    projectId,
    mode,
}: ProjectTaskModalProps) => {
    const [formData, setFormData] = useState({
        title: task?.title || "",
        description: task?.description || "",
        dueDate: task?.dueDate || "",
        priority: task?.priority || 5,
        timeEstimate: task?.timeEstimate || 0,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = "Task title is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateForm()) return;

        onSave({
            projectId,
            title: formData.title,
            description: formData.description || undefined,
            dueDate: formData.dueDate || undefined,
            priority: formData.priority,
            status: task?.status || "todo", // Default to "todo" for new tasks
            timeEstimate: formData.timeEstimate || undefined,
            completedAt: task?.completedAt,
        });

        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === "create" ? "Add New Task" : "Edit Task"}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="default" onClick={handleSubmit}>
                        {mode === "create" ? "Add Task" : "Save Changes"}
                    </Button>
                </>
            }>
            <div className="space-y-4">
                <FormInput
                    label="Task Title *"
                    value={formData.title}
                    onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Design homepage mockup"
                    error={errors.title}
                />

                <TextArea
                    label="Description"
                    value={formData.description}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            description: e.target.value,
                        })
                    }
                    placeholder="Task details and notes..."
                    rows={3}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormInput
                        label="Due Date"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                dueDate: e.target.value,
                            })
                        }
                    />

                    <FormInput
                        label="Time Estimate (hours)"
                        type="number"
                        value={formData.timeEstimate}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                timeEstimate: parseFloat(e.target.value) || 0,
                            })
                        }
                        placeholder="2.5"
                    />
                </div>

                <div>
                    <label
                        htmlFor="task-priority-slider"
                        className="block text-sm font-medium text-foreground mb-2">
                        Priority: {formData.priority}/10
                    </label>
                    <input
                        id="task-priority-slider"
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
            </div>
        </Modal>
    );
};

// ==================== Standalone Task Modal ====================

interface StandaloneTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Omit<StandaloneTask, "id" | "createdAt">) => void;
    task?: StandaloneTask;
    mode: "create" | "edit";
}

export const StandaloneTaskModal = ({
    isOpen,
    onClose,
    onSave,
    task,
    mode,
}: StandaloneTaskModalProps) => {
    const [formData, setFormData] = useState({
        title: task?.title || "",
        description: task?.description || "",
        dueDate: task?.dueDate || "",
        priority: task?.priority || 5,
        timeEstimate: task?.timeEstimate || 0,
        tags: task?.tags?.join(", ") || "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = "Task title is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateForm()) return;

        const tagsArray = formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0);

        onSave({
            title: formData.title,
            description: formData.description || undefined,
            dueDate: formData.dueDate || undefined,
            priority: formData.priority,
            status: task?.status || "todo",
            tags: tagsArray,
            timeEstimate: formData.timeEstimate || undefined,
            completedAt: task?.completedAt,
        });

        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === "create" ? "Add New Task" : "Edit Task"}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="default" onClick={handleSubmit}>
                        {mode === "create" ? "Add Task" : "Save Changes"}
                    </Button>
                </>
            }>
            <div className="space-y-4">
                <FormInput
                    label="Task Title *"
                    value={formData.title}
                    onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Update portfolio website"
                    error={errors.title}
                />

                <TextArea
                    label="Description"
                    value={formData.description}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            description: e.target.value,
                        })
                    }
                    placeholder="Task details and notes..."
                    rows={3}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormInput
                        label="Due Date"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                dueDate: e.target.value,
                            })
                        }
                    />

                    <FormInput
                        label="Time Estimate (hours)"
                        type="number"
                        value={formData.timeEstimate}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                timeEstimate: parseFloat(e.target.value) || 0,
                            })
                        }
                        placeholder="2.5"
                    />
                </div>

                <div>
                    <label
                        htmlFor="standalone-task-priority-slider"
                        className="block text-sm font-medium text-foreground mb-2">
                        Priority: {formData.priority}/10
                    </label>
                    <input
                        id="standalone-task-priority-slider"
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

                <div>
                    <FormInput
                        label="Tags"
                        value={formData.tags}
                        onChange={(e) =>
                            setFormData({ ...formData, tags: e.target.value })
                        }
                        placeholder="Admin, Marketing, Learning"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Separate tags with commas
                    </p>
                </div>
            </div>
        </Modal>
    );
};
