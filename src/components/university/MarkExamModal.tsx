import React, {
    useState,
    useEffect,
    type ChangeEvent,
    type FormEvent,
} from "react";
import { Modal } from "../ui/Modal";
import { FormInput } from "../ui/FormInput";
import { Button } from "../ui/Button";
import { CheckCircle2, Award, Calendar } from "lucide-react";
import { formatDate } from "../../utils/helpers";
import type { Exam } from "../../types";

interface MarkExamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (examId: string, updates: Partial<Exam>) => void;
    exam: Exam | null;
    mode: "mark" | "grade"; // "mark" for marking as taken, "grade" for adding/editing grade
}

export const MarkExamModal: React.FC<MarkExamModalProps> = ({
    isOpen,
    onClose,
    onSave,
    exam,
    mode,
}) => {
    const [formData, setFormData] = useState({
        grade: "",
        addGradeNow: false,
    });

    useEffect(() => {
        if (exam) {
            setFormData({
                grade: exam.grade !== undefined ? exam.grade.toString() : "",
                addGradeNow: mode === "grade" || exam.grade !== undefined,
            });
        } else {
            setFormData({
                grade: "",
                addGradeNow: false,
            });
        }
    }, [exam, mode, isOpen]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!exam) return;

        const updates: Partial<Exam> = {
            taken: true,
            takenAt: exam.takenAt || new Date().toISOString(),
        };

        if (formData.addGradeNow && formData.grade !== "") {
            const gradeValue = parseFloat(formData.grade);
            if (!isNaN(gradeValue)) {
                updates.grade = gradeValue;
                updates.gradeEnteredAt = new Date().toISOString();
            }
        }

        onSave(exam.id, updates);
        onClose();
    };

    if (!exam) return null;

    const isGradeMode = mode === "grade";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                isGradeMode
                    ? exam.grade !== undefined
                        ? "Edit Exam Grade"
                        : "Add Exam Grade"
                    : "Mark Exam as Taken"
            }
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="default" onClick={handleSubmit}>
                        {isGradeMode ? (
                            <>
                                <Award className="w-4 h-4 mr-2" />
                                {exam.grade !== undefined
                                    ? "Update Grade"
                                    : "Save Grade"}
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Mark as Taken
                            </>
                        )}
                    </Button>
                </>
            }>
            <div className="space-y-4">
                {/* Exam Info */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <h3 className="font-semibold text-lg">{exam.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(exam.date)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Max Grade:{" "}
                        <span className="font-medium">{exam.maxGrade}</span>{" "}
                        points
                    </div>
                </div>

                {!isGradeMode && (
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <input
                            type="checkbox"
                            id="addGradeNow"
                            name="addGradeNow"
                            checked={formData.addGradeNow}
                            onChange={handleChange}
                            className="w-4 h-4 rounded border-gray-300"
                        />
                        <label
                            htmlFor="addGradeNow"
                            className="text-sm cursor-pointer">
                            I know my grade, add it now
                        </label>
                    </div>
                )}

                {(isGradeMode || formData.addGradeNow) && (
                    <div className="space-y-2">
                        <FormInput
                            label={`Grade (out of ${exam.maxGrade})`}
                            name="grade"
                            type="number"
                            step="0.5"
                            min="0"
                            max={exam.maxGrade}
                            value={formData.grade}
                            onChange={handleChange}
                            placeholder={`Enter grade (max: ${exam.maxGrade})`}
                        />
                        {formData.grade !== "" && (
                            <div className="text-sm text-muted-foreground">
                                Percentage:{" "}
                                <span className="font-medium">
                                    {(
                                        (parseFloat(formData.grade) /
                                            exam.maxGrade) *
                                        100
                                    ).toFixed(1)}
                                    %
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {!isGradeMode && !formData.addGradeNow && (
                    <p className="text-sm text-muted-foreground">
                        💡 You can add your grade later when the results are
                        available. We'll remind you periodically.
                    </p>
                )}
            </div>
        </Modal>
    );
};
