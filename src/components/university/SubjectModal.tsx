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
import { Badge } from "../ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Plus, Trash2, BookOpen, Calendar } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { generateId } from "../../utils/helpers";
import type { Subject, ScheduleEntry } from "../../types";

interface SubjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    subject?: Subject;
}

const COLORS = [
    "#8B5CF6", // purple
    "#3B82F6", // blue
    "#10B981", // green
    "#F59E0B", // yellow
    "#EF4444", // red
    "#EC4899", // pink
    "#14B8A6", // teal
    "#F97316", // orange
];

const DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
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

export const SubjectModal: React.FC<SubjectModalProps> = ({
    isOpen,
    onClose,
    subject,
}) => {
    const { data, updateData, showToast } = useApp();
    const [activeTab, setActiveTab] = useState("details");
    const [formData, setFormData] = useState<Omit<Subject, "id">>({
        name: "",
        professor: "",
        schedule: "",
        color: COLORS[0],
    });
    const [lectures, setLectures] = useState<ScheduleEntry[]>([]);
    const [sections, setSections] = useState<ScheduleEntry[]>([]);

    // Update form data when subject prop changes
    useEffect(() => {
        if (subject) {
            setFormData({
                name: subject.name,
                professor: subject.professor || "",
                schedule: subject.schedule || "",
                color: subject.color,
            });
            setLectures(subject.lectures || []);
            setSections(subject.sections || []);
        } else {
            setFormData({
                name: "",
                professor: "",
                schedule: "",
                color: COLORS[0],
            });
            setLectures([]);
            setSections([]);
        }
        setActiveTab("details");
    }, [subject, isOpen]);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Lecture handlers
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

    const handleRemoveLecture = (index: number) => {
        setLectures(lectures.filter((_, i) => i !== index));
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

    // Section handlers
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

    const handleRemoveSection = (index: number) => {
        setSections(sections.filter((_, i) => i !== index));
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

        if (!formData.name) {
            showToast("Please fill in required fields", "error");
            return;
        }

        if (!validateSchedule()) {
            return;
        }

        const subjectData: Subject = {
            ...formData,
            id: subject?.id || generateId(),
            lectures: lectures.length > 0 ? lectures : undefined,
            sections: sections.length > 0 ? sections : undefined,
        };

        if (subject) {
            // Update existing subject
            const updatedSubjects = data.university.subjects.map((s) =>
                s.id === subject.id ? subjectData : s
            );
            updateData({
                university: {
                    ...data.university,
                    subjects: updatedSubjects,
                },
            });
            showToast("Subject updated successfully!", "success");
        } else {
            // Create new subject
            updateData({
                university: {
                    ...data.university,
                    subjects: [...data.university.subjects, subjectData],
                },
            });
            showToast("Subject added successfully!", "success");
        }

        onClose();
    };

    const timeOptions = generateTimeOptions();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={subject ? "Edit Subject" : "Add New Subject"}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="default" onClick={handleSubmit}>
                        {subject ? "Update" : "Add"} Subject
                    </Button>
                </>
            }>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="details">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Details
                        </TabsTrigger>
                        <TabsTrigger value="schedules">
                            <Calendar className="w-4 h-4 mr-2" />
                            Schedules
                        </TabsTrigger>
                    </TabsList>

                    {/* Details Tab */}
                    <TabsContent value="details" className="space-y-4 mt-4">
                        <FormInput
                            label="Subject Name *"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., Programming Language (PL2)"
                            required
                        />

                        <FormInput
                            label="Professor"
                            name="professor"
                            value={formData.professor}
                            onChange={handleChange}
                            placeholder="e.g., محمد السعيد"
                        />

                    

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Color
                            </label>
                            <div className="grid grid-cols-8 gap-2">
                                {COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                color,
                                            }))
                                        }
                                        className={`w-8 h-8 rounded-lg transition-all duration-200 ${
                                            formData.color === color
                                                ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                                : ""
                                        }`}
                                        style={{ backgroundColor: color }}
                                        title={`Select ${color}`}
                                        aria-label={`Select color ${color}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Schedules Tab */}
                    <TabsContent value="schedules" className="space-y-6 mt-4">
                        {/* Lectures Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        style={{
                                            borderColor: formData.color,
                                            color: formData.color,
                                        }}>
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
                                    No lectures scheduled. Click "Add Lecture"
                                    to add one.
                                </div>
                            )}

                            {lectures.map((lecture, index) => (
                                <div
                                    key={`lecture-${index}`}
                                    className="p-4 border rounded-lg space-y-3"
                                    style={{
                                        backgroundColor: `${formData.color}10`,
                                        borderColor: `${formData.color}50`,
                                    }}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-primary">
                                            Lecture {index + 1}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                handleRemoveLecture(index)
                                            }>
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
                                        style={{
                                            borderColor: formData.color,
                                            color: formData.color,
                                            opacity: 0.8,
                                        }}>
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
                                    No sections scheduled. Click "Add Section"
                                    to add one.
                                </div>
                            )}

                            {sections.map((section, index) => (
                                <div
                                    key={`section-${index}`}
                                    className="p-4 border rounded-lg space-y-3"
                                    style={{
                                        backgroundColor: `${formData.color}08`,
                                        borderColor: `${formData.color}40`,
                                    }}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-primary">
                                            Section {index + 1}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                handleRemoveSection(index)
                                            }>
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
                    </TabsContent>
                </Tabs>
            </form>
        </Modal>
    );
};
