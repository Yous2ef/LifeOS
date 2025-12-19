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
import { generateId } from "../../utils/helpers";
import type { GradeEntry, GradeEntryType } from "../../types";

interface GradeEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (entry: GradeEntry) => void;
    subjectId: string;
    entry?: GradeEntry;
}

const GRADE_ENTRY_TYPES: { value: GradeEntryType; label: string }[] = [
    { value: "assignment", label: "📝 Assignment" },
    { value: "quiz", label: "📋 Quiz" },
    { value: "sheet", label: "📄 Sheet/Homework" },
    { value: "attendance", label: "✅ Attendance" },
    { value: "participation", label: "🙋 Participation" },
    { value: "bonus", label: "⭐ Bonus Points" },
    { value: "deduction", label: "➖ Deduction" },
    { value: "other", label: "📌 Other" },
];

export const GradeEntryModal: React.FC<GradeEntryModalProps> = ({
    isOpen,
    onClose,
    onSave,
    subjectId,
    entry,
}) => {
    const [formData, setFormData] = useState({
        type: "assignment" as GradeEntryType,
        title: "",
        description: "",
        pointsEarned: 0,
        maxPoints: 10,
        hasMaxPoints: true,
        date: new Date().toISOString().split("T")[0],
    });

    useEffect(() => {
        if (entry) {
            setFormData({
                type: entry.type,
                title: entry.title,
                description: entry.description || "",
                pointsEarned: entry.pointsEarned,
                maxPoints: entry.maxPoints || 10,
                hasMaxPoints: entry.maxPoints !== undefined,
                date: entry.date,
            });
        } else {
            setFormData({
                type: "assignment",
                title: "",
                description: "",
                pointsEarned: 0,
                maxPoints: 10,
                hasMaxPoints: true,
                date: new Date().toISOString().split("T")[0],
            });
        }
    }, [entry, isOpen]);

    const handleChange = (
        e: ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value, type } = e.target;

        if (type === "checkbox") {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData((prev) => ({ ...prev, [name]: checked }));
        } else if (name === "pointsEarned" || name === "maxPoints") {
            setFormData((prev) => ({
                ...prev,
                [name]: parseFloat(value) || 0,
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const type = e.target.value as GradeEntryType;
        setFormData((prev) => ({
            ...prev,
            type,
            // For bonus/deduction, default to no max points
            hasMaxPoints: type !== "bonus" && type !== "deduction",
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            return;
        }

        const gradeEntry: GradeEntry = {
            id: entry?.id || generateId(),
            subjectId,
            type: formData.type,
            title: formData.title.trim(),
            description: formData.description.trim() || undefined,
            pointsEarned: formData.pointsEarned,
            maxPoints: formData.hasMaxPoints ? formData.maxPoints : undefined,
            date: formData.date,
            createdAt: entry?.createdAt || new Date().toISOString(),
        };

        onSave(gradeEntry);
        onClose();
    };

    const isDeductionOrBonus =
        formData.type === "bonus" || formData.type === "deduction";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={entry ? "Edit Grade Entry" : "Add Grade Entry"}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="default" onClick={handleSubmit}>
                        {entry ? "Update" : "Add"} Entry
                    </Button>
                </>
            }>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormSelect
                    label="Type"
                    name="type"
                    value={formData.type}
                    onChange={handleTypeChange}
                    options={GRADE_ENTRY_TYPES.map((t) => ({
                        value: t.value,
                        label: t.label,
                    }))}
                />

                <FormInput
                    label="Title *"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder={
                        formData.type === "sheet"
                            ? "e.g., Sheet 3 Submission"
                            : formData.type === "quiz"
                            ? "e.g., Pop Quiz Week 5"
                            : formData.type === "bonus"
                            ? "e.g., Extra Credit Assignment"
                            : formData.type === "deduction"
                            ? "e.g., Late Submission Penalty"
                            : "e.g., Homework Assignment 1"
                    }
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormInput
                        label={
                            isDeductionOrBonus
                                ? formData.type === "deduction"
                                    ? "Points Deducted"
                                    : "Bonus Points"
                                : "Points Earned"
                        }
                        name="pointsEarned"
                        type="number"
                        step="0.5"
                        value={formData.pointsEarned}
                        onChange={handleChange}
                        min={formData.type === "deduction" ? undefined : 0}
                    />

                    {!isDeductionOrBonus && (
                        <FormInput
                            label="Max Points"
                            name="maxPoints"
                            type="number"
                            step="0.5"
                            min="0"
                            value={formData.maxPoints}
                            onChange={handleChange}
                        />
                    )}
                </div>

                <FormInput
                    label="Date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                />

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Description (Optional)
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Add any notes or details..."
                        className="w-full min-h-[80px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                </div>
            </form>
        </Modal>
    );
};
