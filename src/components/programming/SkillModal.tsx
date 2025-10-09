import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormInput } from "@/components/ui/FormInput";
import { TextArea } from "@/components/ui/TextArea";
import { FormSelect } from "@/components/ui/FormSelect";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/progress";
import type { Skill } from "@/types/programming";

interface SkillModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (skill: Omit<Skill, "id" | "createdAt" | "updatedAt">) => void;
    onUpdate?: (id: string, updates: Partial<Skill>) => void;
    skill?: Skill;
}

export const SkillModal = ({
    isOpen,
    onClose,
    onSave,
    onUpdate,
    skill,
}: SkillModalProps) => {
    const [formData, setFormData] = useState({
        name: "",
        category: "frontend" as Skill["category"],
        currentLevel: 0,
        targetLevel: 100,
        priority: 5,
        notes: "",
    });

    useEffect(() => {
        if (skill) {
            setFormData({
                name: skill.name,
                category: skill.category,
                currentLevel: skill.currentLevel,
                targetLevel: skill.targetLevel,
                priority: skill.priority,
                notes: skill.notes || "",
            });
        } else {
            setFormData({
                name: "",
                category: "frontend",
                currentLevel: 0,
                targetLevel: 100,
                priority: 5,
                notes: "",
            });
        }
    }, [skill, isOpen]);

    const handleChange = (
        e: ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: ["currentLevel", "targetLevel", "priority"].includes(name)
                ? Number(value)
                : value,
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const skillData = {
            ...formData,
            relatedItems: skill?.relatedItems || [],
            lastPracticed: skill?.lastPracticed,
            notes: formData.notes || undefined,
        };

        if (skill && onUpdate) {
            onUpdate(skill.id, skillData);
        } else {
            onSave(skillData);
        }
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={skill ? "Edit Skill" : "Add Skill"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                    label="Skill Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., React, TypeScript, Docker"
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
                            { value: "soft-skills", label: "Soft Skills" },
                            { value: "other", label: "Other" },
                        ]}
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

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Current Level: {formData.currentLevel}%
                    </label>
                    <input
                        type="range"
                        name="currentLevel"
                        min="0"
                        max="100"
                        value={formData.currentLevel}
                        onChange={handleChange}
                        className="w-full mb-2"
                        title="Current Level"
                    />
                    <Progress value={formData.currentLevel} className="h-3" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Target Level: {formData.targetLevel}%
                    </label>
                    <input
                        type="range"
                        name="targetLevel"
                        min="0"
                        max="100"
                        value={formData.targetLevel}
                        onChange={handleChange}
                        className="w-full mb-2"
                        title="Target Level"
                    />
                    <Progress value={formData.targetLevel} className="h-3" />
                </div>

                <TextArea
                    label="Notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Study plan, resources, practice projects..."
                />

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit">{skill ? "Update" : "Create"}</Button>
                </div>
            </form>
        </Modal>
    );
};
