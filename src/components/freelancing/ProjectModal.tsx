import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { FormSelect } from "@/components/ui/FormSelect";
import { TextArea } from "@/components/ui/TextArea";
import type { Project, Currency } from "@/types/modules/freelancing";

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => void;
    project?: Project;
    mode: "create" | "edit";
}

const currencyOptions: { value: Currency; label: string }[] = [
    { value: "USD", label: "USD ($)" },
    { value: "EUR", label: "EUR (€)" },
    { value: "GBP", label: "GBP (£)" },
    { value: "CAD", label: "CAD (C$)" },
    { value: "AUD", label: "AUD (A$)" },
    { value: "JPY", label: "JPY (¥)" },
    { value: "CNY", label: "CNY (¥)" },
];

export const ProjectModal = ({
    isOpen,
    onClose,
    onSave,
    project,
    mode,
}: ProjectModalProps) => {
    const [formData, setFormData] = useState({
        name: project?.name || "",
        clientName: project?.clientName || "",
        description: project?.description || "",
        startDate: project?.startDate || "",
        deadline: project?.deadline || "",
        expectedProfit: project?.expectedProfit || 0,
        currency: project?.currency || ("USD" as Currency),
        priority: project?.priority || 5,
        tags: project?.tags?.join(", ") || "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = "Project name is required";
        }
        if (!formData.clientName.trim()) {
            newErrors.clientName = "Client name is required";
        }
        if (!formData.deadline) {
            newErrors.deadline = "Deadline is required";
        }
        if (formData.expectedProfit <= 0) {
            newErrors.expectedProfit = "Expected profit must be greater than 0";
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
            name: formData.name,
            clientName: formData.clientName,
            description: formData.description,
            startDate: formData.startDate || undefined,
            deadline: formData.deadline,
            status: project?.status || "todo",
            expectedProfit: formData.expectedProfit,
            actualProfit: project?.actualProfit,
            currency: formData.currency,
            priority: formData.priority,
            tags: tagsArray,
        });

        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === "create" ? "Create New Project" : "Edit Project"}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="default" onClick={handleSubmit}>
                        {mode === "create" ? "Create Project" : "Save Changes"}
                    </Button>
                </>
            }>
            <div className="space-y-4">
                <FormInput
                    label="Project Name *"
                    value={formData.name}
                    onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Website Redesign"
                    error={errors.name}
                />

                <FormInput
                    label="Client Name *"
                    value={formData.clientName}
                    onChange={(e) =>
                        setFormData({ ...formData, clientName: e.target.value })
                    }
                    placeholder="Acme Corporation"
                    error={errors.clientName}
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
                    placeholder="Project details and requirements..."
                    rows={3}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormInput
                        label="Start Date"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                startDate: e.target.value,
                            })
                        }
                    />

                    <FormInput
                        label="Deadline *"
                        type="date"
                        value={formData.deadline}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                deadline: e.target.value,
                            })
                        }
                        error={errors.deadline}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormInput
                        label="Expected Profit *"
                        type="number"
                        value={formData.expectedProfit}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                expectedProfit: parseFloat(e.target.value) || 0,
                            })
                        }
                        placeholder="5000"
                        error={errors.expectedProfit}
                    />

                    <FormSelect
                        label="Currency"
                        value={formData.currency}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                currency: e.target.value as Currency,
                            })
                        }
                        options={currencyOptions}
                    />
                </div>

                <div>
                    <label
                        htmlFor="priority-slider"
                        className="block text-sm font-medium text-foreground mb-2">
                        Priority: {formData.priority}/10
                    </label>
                    <input
                        id="priority-slider"
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
                        placeholder="Web Development, Design, E-commerce"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Separate tags with commas
                    </p>
                </div>
            </div>
        </Modal>
    );
};
