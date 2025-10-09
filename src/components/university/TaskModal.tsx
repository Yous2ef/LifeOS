import React, {
    useState,
    useEffect,
    type ChangeEvent,
    type FormEvent,
} from "react";
import { Modal } from "../ui/Modal";
import { FormInput } from "../ui/FormInput";
import { TextArea } from "../ui/TextArea";
import { FormSelect } from "../ui/FormSelect";
import { Button } from "../ui/Button";
import { useApp } from "../../context/AppContext";
import { generateId } from "../../utils/helpers";
import type { UniversityTask } from "../../types";

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    task?: UniversityTask;
}

export const TaskModal: React.FC<TaskModalProps> = ({
    isOpen,
    onClose,
    task,
}) => {
    const { data, updateData, showToast } = useApp();
    const [formData, setFormData] = useState({
        subjectId: "",
        title: "",
        description: "",
        type: "assignment" as "study" | "assignment" | "exam" | "notes",
        dueDate: "" as string | undefined,
        priority: 5,
        status: "todo" as "todo" | "in-progress" | "done",
    });

    // Update form data when task prop changes
    useEffect(() => {
        if (task) {
            setFormData({
                subjectId: task.subjectId,
                title: task.title,
                description: task.description || "",
                type: task.type,
                dueDate: task.dueDate || "",
                priority: task.priority,
                status: task.status,
            });
        } else {
            setFormData({
                subjectId: "",
                title: "",
                description: "",
                type: "assignment",
                dueDate: "",
                priority: 5,
                status: "todo",
            });
        }
    }, [task, isOpen]);

    const handleChange = (
        e: ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "priority" ? Number(value) : value,
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.subjectId) {
            showToast("Please fill in required fields", "error");
            return;
        }

        if (task) {
            // Update existing task
            const updatedTasks = data.university.tasks.map((t) =>
                t.id === task.id
                    ? {
                          ...task,
                          ...formData,
                          dueDate: formData.dueDate || undefined,
                      }
                    : t
            );
            updateData({
                university: {
                    ...data.university,
                    tasks: updatedTasks,
                },
            });
            showToast("Task updated successfully!", "success");
        } else {
            // Create new task
            const newTask: UniversityTask = {
                ...formData,
                dueDate: formData.dueDate || undefined,
                id: generateId(),
                timeSpent: 0,
                createdAt: new Date().toISOString(),
            };
            updateData({
                university: {
                    ...data.university,
                    tasks: [...data.university.tasks, newTask],
                },
            });
            showToast("Task added successfully!", "success");
        }

        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={task ? "Edit Task" : "Add New Task"}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="default" onClick={handleSubmit}>
                        {task ? "Update" : "Add"} Task
                    </Button>
                </>
            }>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormSelect
                    label="Subject *"
                    name="subjectId"
                    value={formData.subjectId}
                    onChange={handleChange}
                    options={[
                        { value: "", label: "Select a subject" },
                        ...data.university.subjects.map((s) => ({
                            value: s.id,
                            label: s.name,
                        })),
                    ]}
                    required
                />

                <FormInput
                    label="Task Title *"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Complete Assignment 3"
                    required
                />

                <TextArea
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Add details about this task..."
                    rows={3}
                />

                <FormSelect
                    label="Type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    options={[
                        { value: "study", label: "Study Session" },
                        { value: "assignment", label: "Assignment" },
                        { value: "exam", label: "Exam Prep" },
                        { value: "notes", label: "Notes" },
                    ]}
                />

                <FormInput
                    label="Due Date (Optional)"
                    name="dueDate"
                    type="date"
                    value={formData.dueDate || ""}
                    onChange={handleChange}
                />

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Priority (1-10)
                        </label>
                        <input
                            type="range"
                            name="priority"
                            min="1"
                            max="10"
                            value={formData.priority}
                            onChange={handleChange}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Low (1)</span>
                            <span className="text-primary font-semibold text-base">
                                {formData.priority}
                            </span>
                            <span>High (10)</span>
                        </div>
                    </div>

                    <FormSelect
                        label="Status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        options={[
                            { value: "todo", label: "To Do" },
                            { value: "in-progress", label: "In Progress" },
                            { value: "done", label: "Done" },
                        ]}
                    />
                </div>
            </form>
        </Modal>
    );
};
