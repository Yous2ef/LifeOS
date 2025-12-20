import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormInput } from "@/components/ui/FormInput";
import { TextArea } from "@/components/ui/TextArea";
import { FormSelect } from "@/components/ui/FormSelect";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { X } from "lucide-react";
import type { LearningItem } from "@/types/modules/programming";

interface LearningItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (
        item: Omit<LearningItem, "id" | "createdAt" | "updatedAt">
    ) => void;
    onUpdate?: (id: string, updates: Partial<LearningItem>) => void;
    item?: LearningItem;
}

export const LearningItemModal = ({
    isOpen,
    onClose,
    onSave,
    onUpdate,
    item,
}: LearningItemModalProps) => {
    const [formData, setFormData] = useState({
        title: "",
        type: "course" as LearningItem["type"],
        platform: "",
        url: "",
        author: "",
        description: "",
        status: "to-start" as LearningItem["status"],
        priority: 5,
        progress: 0,
        totalDuration: 0,
        timeSpent: 0,
        startDate: "",
        completedDate: "",
        dueDate: "",
        notes: "",
    });
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);

    useEffect(() => {
        if (item) {
            setFormData({
                title: item.title,
                type: item.type,
                platform: item.platform || "",
                url: item.url || "",
                author: item.author || "",
                description: item.description || "",
                status: item.status,
                priority: item.priority,
                progress: item.progress,
                totalDuration: item.totalDuration || 0,
                timeSpent: item.timeSpent,
                startDate: item.startDate || "",
                completedDate: item.completedDate || "",
                dueDate: item.dueDate || "",
                notes: item.notes || "",
            });
            setTags(item.tags);
        } else {
            setFormData({
                title: "",
                type: "course",
                platform: "",
                url: "",
                author: "",
                description: "",
                status: "to-start",
                priority: 5,
                progress: 0,
                totalDuration: 0,
                timeSpent: 0,
                startDate: "",
                completedDate: "",
                dueDate: "",
                notes: "",
            });
            setTags([]);
        }
    }, [item, isOpen]);

    const handleChange = (
        e: ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: [
                "priority",
                "progress",
                "totalDuration",
                "timeSpent",
            ].includes(name)
                ? Number(value)
                : value,
        }));
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const itemData = {
            ...formData,
            tags,
            platform: formData.platform || undefined,
            url: formData.url || undefined,
            author: formData.author || undefined,
            description: formData.description || undefined,
            totalDuration: formData.totalDuration || undefined,
            startDate: formData.startDate || undefined,
            completedDate: formData.completedDate || undefined,
            dueDate: formData.dueDate || undefined,
            notes: formData.notes || undefined,
        };

        if (item && onUpdate) {
            onUpdate(item.id, itemData);
        } else {
            onSave(itemData);
        }
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={item ? "Edit Learning Item" : "Add Learning Item"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                    label="Title"
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
                            { value: "course", label: "Course" },
                            { value: "video", label: "Video" },
                            { value: "book", label: "Book" },
                            { value: "tutorial", label: "Tutorial" },
                            { value: "article", label: "Article" },
                            { value: "documentation", label: "Documentation" },
                        ]}
                    />

                    <FormSelect
                        label="Status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        options={[
                            { value: "to-start", label: "To Start" },
                            { value: "in-progress", label: "In Progress" },
                            { value: "completed", label: "Completed" },
                            { value: "on-hold", label: "On Hold" },
                        ]}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormInput
                        label="Platform"
                        name="platform"
                        value={formData.platform}
                        onChange={handleChange}
                        placeholder="e.g., Udemy, YouTube"
                    />

                    <FormInput
                        label="Author/Instructor"
                        name="author"
                        value={formData.author}
                        onChange={handleChange}
                    />
                </div>

                <FormInput
                    label="URL"
                    name="url"
                    type="url"
                    value={formData.url}
                    onChange={handleChange}
                />

                <TextArea
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                />

                <div className="grid grid-cols-2 gap-4">
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
                        />
                        <div className="text-center text-sm text-muted-foreground mt-1">
                            {formData.priority}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Progress (%)
                        </label>
                        <input
                            type="range"
                            name="progress"
                            min="0"
                            max="100"
                            value={formData.progress}
                            onChange={handleChange}
                            className="w-full"
                        />
                        <div className="text-center text-sm text-muted-foreground mt-1">
                            {formData.progress}%
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormInput
                        label="Total Duration (minutes)"
                        name="totalDuration"
                        type="number"
                        value={formData.totalDuration}
                        onChange={handleChange}
                    />

                    <FormInput
                        label="Time Spent (minutes)"
                        name="timeSpent"
                        type="number"
                        value={formData.timeSpent}
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

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Tags
                    </label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) =>
                                e.key === "Enter" &&
                                (e.preventDefault(), handleAddTag())
                            }
                            placeholder="Add tag..."
                            className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm"
                        />
                        <Button
                            type="button"
                            onClick={handleAddTag}
                            variant="outline">
                            Add
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <Badge
                                key={tag}
                                variant="secondary"
                                className="gap-1">
                                {tag}
                                <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => handleRemoveTag(tag)}
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
                    rows={3}
                />

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit">{item ? "Update" : "Create"}</Button>
                </div>
            </form>
        </Modal>
    );
};
