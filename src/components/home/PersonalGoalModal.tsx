import React, {
    useState,
    useEffect,
    type ChangeEvent,
    type FormEvent,
} from "react";
import { Modal } from "../ui/Modal";
import { FormInput } from "../ui/FormInput";
import { FormSelect } from "../ui/FormSelect";
import { TextArea } from "../ui/TextArea";
import { Button } from "../ui/Button";
import { useApp } from "../../context/AppContext";
import type { PersonalGoal } from "../../types";

interface PersonalGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    goal?: PersonalGoal;
}

export const PersonalGoalModal: React.FC<PersonalGoalModalProps> = ({
    isOpen,
    onClose,
    goal,
}) => {
    const { data, updateData, showToast } = useApp();
    const [formData, setFormData] = useState({
        title: "",
        category: "personal" as PersonalGoal["category"],
        description: "",
        targetDate: "",
        progress: 0,
        milestones: [] as string[],
        newMilestone: "",
    });

    useEffect(() => {
        if (goal) {
            setFormData({
                title: goal.title,
                category: goal.category,
                description: goal.description,
                targetDate: goal.targetDate || "",
                progress: goal.progress,
                milestones: goal.milestones,
                newMilestone: "",
            });
        } else {
            setFormData({
                title: "",
                category: "personal",
                description: "",
                targetDate: "",
                progress: 0,
                milestones: [],
                newMilestone: "",
            });
        }
    }, [goal, isOpen]);

    const handleChange = (
        e: ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "progress" ? Number(value) : value,
        }));
    };

    const handleAddMilestone = () => {
        if (formData.newMilestone.trim()) {
            setFormData((prev) => ({
                ...prev,
                milestones: [...prev.milestones, prev.newMilestone.trim()],
                newMilestone: "",
            }));
        }
    };

    const handleRemoveMilestone = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            milestones: prev.milestones.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            showToast("Please enter a goal title", "error");
            return;
        }

        const newGoal: PersonalGoal = {
            id: goal?.id || `goal-${Date.now()}`,
            title: formData.title.trim(),
            category: formData.category,
            description: formData.description.trim(),
            targetDate: formData.targetDate || undefined,
            progress: formData.progress,
            milestones: formData.milestones,
            createdAt: goal?.createdAt || new Date().toISOString(),
        };

        if (goal) {
            updateData({
                home: {
                    ...data.home,
                    goals: data.home.goals.map((g) =>
                        g.id === goal.id ? newGoal : g
                    ),
                },
            });
            showToast("Goal updated successfully!", "success");
        } else {
            updateData({
                home: {
                    ...data.home,
                    goals: [...data.home.goals, newGoal],
                },
            });
            showToast("Goal added successfully!", "success");
        }

        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={goal ? "Edit Personal Goal" : "Add Personal Goal"}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="default" onClick={handleSubmit}>
                        {goal ? "Update" : "Add"} Goal
                    </Button>
                </>
            }>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                    label="Goal Title *"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Run a marathon"
                    required
                />

                <FormSelect
                    label="Category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    options={[
                        { value: "health", label: "Health" },
                        { value: "fitness", label: "Fitness" },
                        { value: "hobby", label: "Hobby" },
                        { value: "personal", label: "Personal" },
                    ]}
                />

                <TextArea
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your goal..."
                    rows={3}
                />

                <FormInput
                    label="Target Date"
                    name="targetDate"
                    type="date"
                    value={formData.targetDate}
                    onChange={handleChange}
                />

                <FormInput
                    label="Progress (%)"
                    name="progress"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress.toString()}
                    onChange={handleChange}
                />

                {/* Milestones */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Milestones</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={formData.newMilestone}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    newMilestone: e.target.value,
                                })
                            }
                            placeholder="Add a milestone..."
                            className="flex-1 px-3 py-2 border rounded-md"
                            onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddMilestone();
                                }
                            }}
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleAddMilestone}>
                            Add
                        </Button>
                    </div>
                    {formData.milestones.length > 0 && (
                        <ul className="space-y-1 mt-2">
                            {formData.milestones.map((milestone, index) => (
                                <li
                                    key={index}
                                    className="flex items-center justify-between p-2 bg-secondary rounded">
                                    <span className="text-sm">{milestone}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            handleRemoveMilestone(index)
                                        }>
                                        Remove
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </form>
        </Modal>
    );
};
