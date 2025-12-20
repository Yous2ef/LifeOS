import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormInput } from "@/components/ui/FormInput";
import { TextArea } from "@/components/ui/TextArea";
import { FormSelect } from "@/components/ui/FormSelect";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { X } from "lucide-react";
import type { Tool } from "@/types/modules/programming";

interface ToolModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (tool: Omit<Tool, "id" | "createdAt" | "updatedAt">) => void;
    onUpdate?: (id: string, updates: Partial<Tool>) => void;
    tool?: Tool;
}

export const ToolModal = ({
    isOpen,
    onClose,
    onSave,
    onUpdate,
    tool,
}: ToolModalProps) => {
    const [formData, setFormData] = useState({
        name: "",
        category: "frontend" as Tool["category"],
        status: "to-learn" as Tool["status"],
        priority: 5,
        version: "",
        documentation: "",
        notes: "",
    });
    const [resourceInput, setResourceInput] = useState("");
    const [learningResources, setLearningResources] = useState<string[]>([]);

    useEffect(() => {
        if (tool) {
            setFormData({
                name: tool.name,
                category: tool.category,
                status: tool.status,
                priority: tool.priority,
                version: tool.version || "",
                documentation: tool.documentation || "",
                notes: tool.notes || "",
            });
            setLearningResources(tool.learningResources);
        } else {
            setFormData({
                name: "",
                category: "frontend",
                status: "to-learn",
                priority: 5,
                version: "",
                documentation: "",
                notes: "",
            });
            setLearningResources([]);
        }
    }, [tool, isOpen]);

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

    const handleAddResource = () => {
        if (
            resourceInput.trim() &&
            !learningResources.includes(resourceInput.trim())
        ) {
            setLearningResources([...learningResources, resourceInput.trim()]);
            setResourceInput("");
        }
    };

    const handleRemoveResource = (resource: string) => {
        setLearningResources(learningResources.filter((r) => r !== resource));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const toolData = {
            ...formData,
            learningResources,
            projects: tool?.projects || [],
            version: formData.version || undefined,
            documentation: formData.documentation || undefined,
            notes: formData.notes || undefined,
            startDate: tool?.startDate,
            masteredDate: tool?.masteredDate,
        };

        if (tool && onUpdate) {
            onUpdate(tool.id, toolData);
        } else {
            onSave(toolData);
        }
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={tool ? "Edit Tool" : "Add Tool"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                    label="Tool/Technology Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., React, Docker, PostgreSQL"
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormSelect
                        label="Category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        options={[
                            { value: "frontend", label: "Frontend" },
                            { value: "backend", label: "Backend" },
                            { value: "database", label: "Database" },
                            { value: "devops", label: "DevOps" },
                            { value: "design", label: "Design" },
                            { value: "testing", label: "Testing" },
                            { value: "other", label: "Other" },
                        ]}
                    />

                    <FormSelect
                        label="Status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        options={[
                            { value: "to-learn", label: "To Learn" },
                            { value: "learning", label: "Learning" },
                            { value: "comfortable", label: "Comfortable" },
                            { value: "proficient", label: "Proficient" },
                            { value: "mastered", label: "Mastered" },
                        ]}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormInput
                        label="Version"
                        name="version"
                        value={formData.version}
                        onChange={handleChange}
                        placeholder="e.g., v18.2, 5.0"
                    />

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Priority (1-10)
                        </label>
                        <input
                            type="range"
                            name="priority"
                            min="1"
                            max="10"
                            value={formData.priority}
                            onChange={handleChange}
                            className="w-full"
                            title="Priority"
                        />
                        <div className="text-center text-sm text-muted-foreground mt-1">
                            {formData.priority}
                        </div>
                    </div>
                </div>

                <FormInput
                    label="Documentation URL"
                    name="documentation"
                    type="url"
                    value={formData.documentation}
                    onChange={handleChange}
                    placeholder="https://..."
                />

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Learning Resources
                    </label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="url"
                            value={resourceInput}
                            onChange={(e) => setResourceInput(e.target.value)}
                            onKeyPress={(e) =>
                                e.key === "Enter" &&
                                (e.preventDefault(), handleAddResource())
                            }
                            placeholder="Add resource URL..."
                            className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm"
                        />
                        <Button
                            type="button"
                            onClick={handleAddResource}
                            variant="outline">
                            Add
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {learningResources.map((resource) => (
                            <Badge
                                key={resource}
                                variant="secondary"
                                className="gap-1 max-w-full">
                                <span className="truncate">{resource}</span>
                                <X
                                    className="h-3 w-3 cursor-pointer flex-shrink-0"
                                    onClick={() =>
                                        handleRemoveResource(resource)
                                    }
                                />
                            </Badge>
                        ))}
                    </div>
                </div>

                <TextArea
                    label="Notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Study plan, use cases, best practices..."
                />

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit">{tool ? "Update" : "Create"}</Button>
                </div>
            </form>
        </Modal>
    );
};
