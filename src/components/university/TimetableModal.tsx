import React, { useState, useEffect, type FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { FormInput } from "../ui/FormInput";
import { FormSelect } from "../ui/FormSelect";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Plus, Trash2 } from "lucide-react";
import { useApp } from "../../context/AppContext";
import type { Subject, ScheduleEntry } from "../../types";

interface TimetableModalProps {
    isOpen: boolean;
    onClose: () => void;
    subject?: Subject;
}

const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
] as const;

const generateTimeOptions = (): { value: string; label: string }[] => {
    const options: { value: string; label: string }[] = [];
    for (let hour = 8; hour <= 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const time24 = `${hour.toString().padStart(2, "0")}:${minute
                .toString()
                .padStart(2, "0")}`;
            const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
            const period = hour >= 12 ? "PM" : "AM";
            const time12 = `${hour12}:${minute
                .toString()
                .padStart(2, "0")} ${period}`;
            options.push({ value: time24, label: time12 });
        }
    }
    return options;
};

export const TimetableModal: React.FC<TimetableModalProps> = ({
    isOpen,
    onClose,
    subject,
}) => {
    const { data, updateData, showToast } = useApp();
    const [lectures, setLectures] = useState<ScheduleEntry[]>([]);
    const [sections, setSections] = useState<ScheduleEntry[]>([]);

    useEffect(() => {
        if (subject && isOpen) {
            setLectures(subject.lectures || []);
            setSections(subject.sections || []);
        } else if (!subject) {
            setLectures([]);
            setSections([]);
        }
    }, [subject, isOpen]);

    const handleAddLecture = () => {
        setLectures([
            ...lectures,
            {
                day: "Monday",
                startTime: "09:00",
                endTime: "10:30",
                location: "",
            },
        ]);
    };

    const handleAddSection = () => {
        setSections([
            ...sections,
            {
                day: "Monday",
                startTime: "14:00",
                endTime: "15:30",
                location: "",
            },
        ]);
    };

    const handleRemoveLecture = (index: number) => {
        setLectures(lectures.filter((_, i) => i !== index));
    };

    const handleRemoveSection = (index: number) => {
        setSections(sections.filter((_, i) => i !== index));
    };

    const handleLectureChange = (
        index: number,
        field: keyof ScheduleEntry,
        value: string
    ) => {
        const updated = [...lectures];
        updated[index] = { ...updated[index], [field]: value };
        setLectures(updated);
    };

    const handleSectionChange = (
        index: number,
        field: keyof ScheduleEntry,
        value: string
    ) => {
        const updated = [...sections];
        updated[index] = { ...updated[index], [field]: value };
        setSections(updated);
    };

    const validateSchedule = (): boolean => {
        // Check if start time is before end time
        const allEntries = [...lectures, ...sections];
        for (const entry of allEntries) {
            const [startHour, startMin] = entry.startTime
                .split(":")
                .map(Number);
            const [endHour, endMin] = entry.endTime.split(":").map(Number);
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;

            if (startMinutes >= endMinutes) {
                showToast("End time must be after start time", "error");
                return false;
            }
        }
        return true;
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!subject) {
            showToast("No subject selected", "error");
            return;
        }

        if (!validateSchedule()) {
            return;
        }

        // Update the subject with new schedule
        const updatedSubject: Subject = {
            ...subject,
            lectures: lectures.length > 0 ? lectures : undefined,
            sections: sections.length > 0 ? sections : undefined,
        };

        updateData({
            university: {
                ...data.university,
                subjects: data.university.subjects.map((s) =>
                    s.id === subject.id ? updatedSubject : s
                ),
            },
        });

        showToast("Schedule updated successfully!", "success");
        onClose();
    };

    const timeOptions = generateTimeOptions();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Edit Schedule - ${subject?.name || ""}`}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="default" onClick={handleSubmit}>
                        Save Schedule
                    </Button>
                </>
            }>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Lectures Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className="text-blue-500 border-blue-500">
                                Lectures
                            </Badge>
                        </h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddLecture}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Lecture
                        </Button>
                    </div>

                    {lectures.length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
                            No lectures scheduled. Click "Add Lecture" to add
                            one.
                        </div>
                    )}

                    {lectures.map((lecture, index) => (
                        <div
                            key={`lecture-${index}`}
                            className="p-4 border rounded-lg space-y-3 bg-blue-500/5">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                    Lecture {index + 1}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveLecture(index)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <FormSelect
                                    label="Day"
                                    name={`lecture-day-${index}`}
                                    value={lecture.day}
                                    onChange={(e) =>
                                        handleLectureChange(
                                            index,
                                            "day",
                                            e.target.value
                                        )
                                    }
                                    options={DAYS.map((day) => ({
                                        value: day,
                                        label: day,
                                    }))}
                                />

                                <FormInput
                                    label="Location"
                                    name={`lecture-location-${index}`}
                                    value={lecture.location}
                                    onChange={(e) =>
                                        handleLectureChange(
                                            index,
                                            "location",
                                            e.target.value
                                        )
                                    }
                                    placeholder="e.g., Room 101"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <FormSelect
                                    label="Start Time"
                                    name={`lecture-start-${index}`}
                                    value={lecture.startTime}
                                    onChange={(e) =>
                                        handleLectureChange(
                                            index,
                                            "startTime",
                                            e.target.value
                                        )
                                    }
                                    options={timeOptions}
                                />

                                <FormSelect
                                    label="End Time"
                                    name={`lecture-end-${index}`}
                                    value={lecture.endTime}
                                    onChange={(e) =>
                                        handleLectureChange(
                                            index,
                                            "endTime",
                                            e.target.value
                                        )
                                    }
                                    options={timeOptions}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sections Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className="text-green-500 border-green-500">
                                Sections
                            </Badge>
                        </h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddSection}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Section
                        </Button>
                    </div>

                    {sections.length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
                            No sections scheduled. Click "Add Section" to add
                            one.
                        </div>
                    )}

                    {sections.map((section, index) => (
                        <div
                            key={`section-${index}`}
                            className="p-4 border rounded-lg space-y-3 bg-green-500/5">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                    Section {index + 1}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveSection(index)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <FormSelect
                                    label="Day"
                                    name={`section-day-${index}`}
                                    value={section.day}
                                    onChange={(e) =>
                                        handleSectionChange(
                                            index,
                                            "day",
                                            e.target.value
                                        )
                                    }
                                    options={DAYS.map((day) => ({
                                        value: day,
                                        label: day,
                                    }))}
                                />

                                <FormInput
                                    label="Location"
                                    name={`section-location-${index}`}
                                    value={section.location}
                                    onChange={(e) =>
                                        handleSectionChange(
                                            index,
                                            "location",
                                            e.target.value
                                        )
                                    }
                                    placeholder="e.g., Lab 203"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <FormSelect
                                    label="Start Time"
                                    name={`section-start-${index}`}
                                    value={section.startTime}
                                    onChange={(e) =>
                                        handleSectionChange(
                                            index,
                                            "startTime",
                                            e.target.value
                                        )
                                    }
                                    options={timeOptions}
                                />

                                <FormSelect
                                    label="End Time"
                                    name={`section-end-${index}`}
                                    value={section.endTime}
                                    onChange={(e) =>
                                        handleSectionChange(
                                            index,
                                            "endTime",
                                            e.target.value
                                        )
                                    }
                                    options={timeOptions}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </form>
        </Modal>
    );
};
