import React, {
    useState,
    useEffect,
    type ChangeEvent,
    type FormEvent,
} from "react";
import { Modal } from "../ui/Modal";
import { FormInput } from "../ui/FormInput";
import { FormSelect } from "../ui/FormSelect";
import { Button } from "../ui/Button";
import { Checkbox } from "../ui/Checkbox";
import { useApp } from "../../context/AppContext";
import type { HouseTask } from "../../types";

interface HouseTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    task?: HouseTask;
}

export const HouseTaskModal: React.FC<HouseTaskModalProps> = ({
    isOpen,
    onClose,
    task,
}) => {
    const { data, updateData, showToast } = useApp();
    const [formData, setFormData] = useState({
        title: "",
        category: "chore" as HouseTask["category"],
        priority: "medium" as HouseTask["priority"],
        dueDate: "",
        status: "todo" as HouseTask["status"],
        recurring: false,
        recurringPeriod: "weekly" as "daily" | "weekly" | "monthly",
    });

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title,
                category: task.category,
                priority: task.priority,
                dueDate: task.dueDate || "",
                status: task.status,
                recurring: task.recurring || false,
                recurringPeriod: task.recurringPeriod || "weekly",
            });
        } else {
            setFormData({
                title: "",
                category: "chore",
                priority: "medium",
                dueDate: "",
                status: "todo",
                recurring: false,
                recurringPeriod: "weekly",
            });
        }
    }, [task, isOpen]);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            showToast("Please enter a task title", "error");
            return;
        }

        const newTask: HouseTask = {
            id: task?.id || `task-${Date.now()}`,
            title: formData.title.trim(),
            category: formData.category,
            priority: formData.priority,
            dueDate: formData.dueDate || undefined,
            status: formData.status,
            recurring: formData.recurring,
            recurringPeriod: formData.recurring
                ? formData.recurringPeriod
                : undefined,
            createdAt: task?.createdAt || new Date().toISOString(),
        };

        if (task) {
            updateData({
                home: {
                    ...data.home,
                    tasks: data.home.tasks.map((t) =>
                        t.id === task.id ? newTask : t
                    ),
                },
            });
            showToast("Task updated successfully!", "success");
        } else {
            updateData({
                home: {
                    ...data.home,
                    tasks: [...data.home.tasks, newTask],
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
            title={task ? "Edit House Task" : "Add House Task"}
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
                <FormInput
                    label="Task Title *"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Clean the kitchen"
                    required
                />

                <FormSelect
                    label="Category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    options={[
                        { value: "chore", label: "🧹 Chore" },
                        { value: "maintenance", label: "🔧 Maintenance" },
                        { value: "shopping", label: "🛒 Shopping" },
                        { value: "bills", label: "💰 Bills" },
                    ]}
                />

                <FormSelect
                    label="Priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    options={[
                        { value: "low", label: "Low" },
                        { value: "medium", label: "Medium" },
                        { value: "high", label: "High" },
                    ]}
                />

                <FormInput
                    label="Due Date"
                    name="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={handleChange}
                />

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="recurring"
                        checked={formData.recurring}
                        onCheckedChange={(checked) =>
                            setFormData({
                                ...formData,
                                recurring: checked as boolean,
                            })
                        }
                    />
                    <label
                        htmlFor="recurring"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        Recurring task
                    </label>
                </div>

                {formData.recurring && (
                    <FormSelect
                        label="Recurring Period"
                        name="recurringPeriod"
                        value={formData.recurringPeriod}
                        onChange={handleChange}
                        options={[
                            { value: "daily", label: "Daily" },
                            { value: "weekly", label: "Weekly" },
                            { value: "monthly", label: "Monthly" },
                        ]}
                    />
                )}

                <FormSelect
                    label="Status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    options={[
                        { value: "todo", label: "To Do" },
                        { value: "done", label: "Done" },
                    ]}
                />
            </form>
        </Modal>
    );
};
