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
import { useApp } from "../../context/AppContext";
import type { Habit } from "../../types";

interface HabitModalProps {
    isOpen: boolean;
    onClose: () => void;
    habit?: Habit;
}

export const HabitModal: React.FC<HabitModalProps> = ({
    isOpen,
    onClose,
    habit,
}) => {
    const { data, updateData, showToast } = useApp();
    const [formData, setFormData] = useState({
        name: "",
        icon: "⭐",
        frequency: "daily" as Habit["frequency"],
    });

    useEffect(() => {
        if (habit) {
            setFormData({
                name: habit.name,
                icon: habit.icon,
                frequency: habit.frequency,
            });
        } else {
            setFormData({
                name: "",
                icon: "⭐",
                frequency: "daily",
            });
        }
    }, [habit, isOpen]);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showToast("Please enter a habit name", "error");
            return;
        }

        const newHabit: Habit = {
            id: habit?.id || `habit-${Date.now()}`,
            name: formData.name.trim(),
            icon: formData.icon,
            frequency: formData.frequency,
            streak: habit?.streak || 0,
            bestStreak: habit?.bestStreak || 0,
            completedDates: habit?.completedDates || [],
            createdAt: habit?.createdAt || new Date().toISOString(),
        };

        if (habit) {
            updateData({
                home: {
                    ...data.home,
                    habits: data.home.habits.map((h) =>
                        h.id === habit.id ? newHabit : h
                    ),
                },
            });
            showToast("Habit updated successfully!", "success");
        } else {
            updateData({
                home: {
                    ...data.home,
                    habits: [...data.home.habits, newHabit],
                },
            });
            showToast("Habit added successfully!", "success");
        }

        onClose();
    };

    const commonIcons = [
        "⭐",
        "🔥",
        "💪",
        "📚",
        "🏃",
        "🧘",
        "💧",
        "🎯",
        "✅",
        "🌟",
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={habit ? "Edit Habit" : "Add Habit"}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="default" onClick={handleSubmit}>
                        {habit ? "Update" : "Add"} Habit
                    </Button>
                </>
            }>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                    label="Habit Name *"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Morning meditation"
                    required
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium">Icon</label>
                    <div className="grid grid-cols-5 gap-2">
                        {commonIcons.map((emoji) => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() =>
                                    setFormData({ ...formData, icon: emoji })
                                }
                                className={`p-3 text-2xl border rounded-md hover:bg-accent transition-colors ${
                                    formData.icon === emoji
                                        ? "bg-primary text-primary-foreground"
                                        : ""
                                }`}>
                                {emoji}
                            </button>
                        ))}
                    </div>
                    <FormInput
                        label="Custom Icon (emoji)"
                        name="icon"
                        value={formData.icon}
                        onChange={handleChange}
                        placeholder="Paste any emoji"
                    />
                </div>

                <FormSelect
                    label="Frequency"
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleChange}
                    options={[
                        { value: "daily", label: "Daily" },
                        { value: "weekly", label: "Weekly" },
                    ]}
                />
            </form>
        </Modal>
    );
};
