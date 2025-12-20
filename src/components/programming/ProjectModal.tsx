import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormInput } from "@/components/ui/FormInput";
import { TextArea } from "@/components/ui/TextArea";
import { FormSelect } from "@/components/ui/FormSelect";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { X } from "lucide-react";
import type { CodingProject } from "@/types/modules/programming";

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (
        project: Omit<CodingProject, "id" | "createdAt" | "updatedAt">
    ) => void;
    onUpdate?: (id: string, updates: Partial<CodingProject>) => void;
    project?: CodingProject;
}

export const ProjectModal = ({
    isOpen,
    onClose,
    onSave,
    onUpdate,
    project,
}: ProjectModalProps) => {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "personal" as CodingProject["type"],
        status: "to-do" as CodingProject["status"],
        priority: 5,
        repositoryUrl: "",
        liveUrl: "",
        startDate: "",
        completedDate: "",
        dueDate: "",
        estimatedHours: 0,
        actualHours: 0,
        learnings: "",
        challenges: "",
    });
    const [technologyInput, setTechnologyInput] = useState("");
    const [technologies, setTechnologies] = useState<string[]>([]);
    const [featureInput, setFeatureInput] = useState("");
    const [features, setFeatures] = useState<string[]>([]);

    useEffect(() => {
        if (project) {
            setFormData({
                title: project.title,
                description: project.description || "",
                type: project.type,
                status: project.status,
                priority: project.priority,
                repositoryUrl: project.repositoryUrl || "",
                liveUrl: project.liveUrl || "",
                startDate: project.startDate || "",
                completedDate: project.completedDate || "",
                dueDate: project.dueDate || "",
                estimatedHours: project.estimatedHours || 0,
                actualHours: project.actualHours,
                learnings: project.learnings || "",
                challenges: project.challenges || "",
            });
            setTechnologies(project.technologies);
            setFeatures(project.features);
        } else {
            setFormData({
                title: "",
                description: "",
                type: "personal",
                status: "to-do",
                priority: 5,
                repositoryUrl: "",
                liveUrl: "",
                startDate: "",
                completedDate: "",
                dueDate: "",
                estimatedHours: 0,
                actualHours: 0,
                learnings: "",
                challenges: "",
            });
            setTechnologies([]);
            setFeatures([]);
        }
    }, [project, isOpen]);

    const handleChange = (
        e: ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: ["priority", "estimatedHours", "actualHours"].includes(name)
                ? Number(value)
                : value,
        }));
    };

    const handleAddTechnology = () => {
        if (
            technologyInput.trim() &&
            !technologies.includes(technologyInput.trim())
        ) {
            setTechnologies([...technologies, technologyInput.trim()]);
            setTechnologyInput("");
        }
    };

    const handleRemoveTechnology = (tech: string) => {
        setTechnologies(technologies.filter((t) => t !== tech));
    };

    const handleAddFeature = () => {
        if (featureInput.trim() && !features.includes(featureInput.trim())) {
            setFeatures([...features, featureInput.trim()]);
            setFeatureInput("");
        }
    };

    const handleRemoveFeature = (feature: string) => {
        setFeatures(features.filter((f) => f !== feature));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const projectData = {
            ...formData,
            technologies,
            features,
            tasks: project?.tasks || [],
            screenshots: project?.screenshots || [],
            description: formData.description || undefined,
            repositoryUrl: formData.repositoryUrl || undefined,
            liveUrl: formData.liveUrl || undefined,
            startDate: formData.startDate || undefined,
            completedDate: formData.completedDate || undefined,
            dueDate: formData.dueDate || undefined,
            estimatedHours: formData.estimatedHours || undefined,
            learnings: formData.learnings || undefined,
            challenges: formData.challenges || undefined,
        };

        if (project && onUpdate) {
            onUpdate(project.id, projectData);
        } else {
            onSave(projectData);
        }
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={project ? "Edit Project" : "New Project"}>
            <form
                onSubmit={handleSubmit}
                className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 ">
                <FormInput
                    label="Project Title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormSelect
                        label="Type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        options={[
                            { value: "personal", label: "Personal" },
                            { value: "practice", label: "Practice" },
                            { value: "portfolio", label: "Portfolio" },
                            { value: "client", label: "Client" },
                            { value: "open-source", label: "Open Source" },
                        ]}
                    />

                    <FormSelect
                        label="Status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        options={[
                            { value: "to-do", label: "To Do" },
                            { value: "in-progress", label: "In Progress" },
                            { value: "completed", label: "Completed" },
                        ]}
                    />
                </div>

                <TextArea
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
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

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Technologies
                    </label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={technologyInput}
                            onChange={(e) => setTechnologyInput(e.target.value)}
                            onKeyPress={(e) =>
                                e.key === "Enter" &&
                                (e.preventDefault(), handleAddTechnology())
                            }
                            placeholder="Add technology..."
                            className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm"
                        />
                        <Button
                            type="button"
                            onClick={handleAddTechnology}
                            variant="outline">
                            Add
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {technologies.map((tech) => (
                            <Badge
                                key={tech}
                                variant="secondary"
                                className="gap-1">
                                {tech}
                                <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => handleRemoveTechnology(tech)}
                                />
                            </Badge>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Key Features
                    </label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={featureInput}
                            onChange={(e) => setFeatureInput(e.target.value)}
                            onKeyPress={(e) =>
                                e.key === "Enter" &&
                                (e.preventDefault(), handleAddFeature())
                            }
                            placeholder="Add feature..."
                            className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm"
                        />
                        <Button
                            type="button"
                            onClick={handleAddFeature}
                            variant="outline">
                            Add
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {features.map((feature) => (
                            <Badge
                                key={feature}
                                variant="outline"
                                className="gap-1">
                                {feature}
                                <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => handleRemoveFeature(feature)}
                                />
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormInput
                        label="Repository URL"
                        name="repositoryUrl"
                        type="url"
                        value={formData.repositoryUrl}
                        onChange={handleChange}
                    />

                    <FormInput
                        label="Live URL"
                        name="liveUrl"
                        type="url"
                        value={formData.liveUrl}
                        onChange={handleChange}
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <FormInput
                        label="Start Date"
                        name="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={handleChange}
                    />

                    <FormInput
                        label="Due Date"
                        name="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={handleChange}
                    />

                    <FormInput
                        label="Completed Date"
                        name="completedDate"
                        type="date"
                        value={formData.completedDate}
                        onChange={handleChange}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormInput
                        label="Estimated Hours"
                        name="estimatedHours"
                        type="number"
                        value={formData.estimatedHours}
                        onChange={handleChange}
                    />

                    <FormInput
                        label="Actual Hours"
                        name="actualHours"
                        type="number"
                        value={formData.actualHours}
                        onChange={handleChange}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4  bottom-0">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        {project ? "Update" : "Create"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
