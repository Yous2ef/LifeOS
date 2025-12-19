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
import { generateId } from "../../utils/helpers";
import type { Exam } from "../../types";

interface ExamModalProps {
    isOpen: boolean;
    onClose: () => void;
    exam?: Exam;
}

export const ExamModal: React.FC<ExamModalProps> = ({
    isOpen,
    onClose,
    exam,
}) => {
    const { data, updateData, showToast } = useApp();
    const [formData, setFormData] = useState({
        subjectId: "",
        title: "",
        date: new Date().toISOString().split("T")[0],
        duration: 120,
        location: "",
        maxGrade: 100,
    });

    // Update form data when exam prop changes
    useEffect(() => {
        if (exam) {
            setFormData({
                subjectId: exam.subjectId,
                title: exam.title,
                date: exam.date,
                duration: exam.duration,
                location: exam.location || "",
                maxGrade: exam.maxGrade || 100,
            });
        } else {
            setFormData({
                subjectId: "",
                title: "",
                date: new Date().toISOString().split("T")[0],
                duration: 120,
                location: "",
                maxGrade: 100,
            });
        }
    }, [exam, isOpen]);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]:
                name === "duration" || name === "maxGrade"
                    ? Number(value)
                    : value,
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.subjectId || !formData.date) {
            showToast("Please fill in required fields", "error");
            return;
        }

        if (exam) {
            // Update existing exam - preserve taken/grade fields
            const updatedExams = data.university.exams.map((ex) =>
                ex.id === exam.id
                    ? {
                          ...ex,
                          subjectId: formData.subjectId,
                          title: formData.title,
                          date: formData.date,
                          duration: formData.duration,
                          location: formData.location,
                          maxGrade: formData.maxGrade,
                      }
                    : ex
            );
            updateData({
                university: {
                    ...data.university,
                    exams: updatedExams,
                },
            });
            showToast("Exam updated successfully!", "success");
        } else {
            // Create new exam
            const newExam: Exam = {
                id: generateId(),
                subjectId: formData.subjectId,
                title: formData.title,
                date: formData.date,
                duration: formData.duration,
                location: formData.location,
                maxGrade: formData.maxGrade,
                taken: false,
            };
            updateData({
                university: {
                    ...data.university,
                    exams: [...data.university.exams, newExam],
                },
            });
            showToast("Exam added successfully!", "success");
        }

        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={exam ? "Edit Exam" : "Add New Exam"}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="default" onClick={handleSubmit}>
                        {exam ? "Update" : "Add"} Exam
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
                    label="Exam Title *"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Midterm Exam"
                    required
                />

                <FormInput
                    label="Date *"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormInput
                        label="Duration (minutes)"
                        name="duration"
                        type="number"
                        min="30"
                        max="300"
                        value={formData.duration}
                        onChange={handleChange}
                    />

                    <FormInput
                        label="Max Grade *"
                        name="maxGrade"
                        type="number"
                        min="1"
                        max="1000"
                        value={formData.maxGrade}
                        onChange={handleChange}
                        placeholder="e.g., 100"
                        required
                    />
                </div>

                <FormInput
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Room 301, Building A"
                />
            </form>
        </Modal>
    );
};
