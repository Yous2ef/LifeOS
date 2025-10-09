import React, {
    useState,
    useEffect,
    type ChangeEvent,
    type FormEvent,
} from "react";
import { Modal } from "../ui/Modal";
import { FormInput } from "../ui/FormInput";
import { TextArea } from "../ui/TextArea";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { X } from "lucide-react";
import { useApp } from "../../context/AppContext";
import type { Note } from "../../types";

interface NoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    note?: Note;
}

export const NoteModal: React.FC<NoteModalProps> = ({
    isOpen,
    onClose,
    note,
}) => {
    const { data, updateData, showToast } = useApp();
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        tags: [] as string[],
        newTag: "",
    });

    useEffect(() => {
        if (note) {
            setFormData({
                title: note.title,
                content: note.content,
                tags: note.tags,
                newTag: "",
            });
        } else {
            setFormData({
                title: "",
                content: "",
                tags: [],
                newTag: "",
            });
        }
    }, [note, isOpen]);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddTag = () => {
        if (
            formData.newTag.trim() &&
            !formData.tags.includes(formData.newTag.trim())
        ) {
            setFormData((prev) => ({
                ...prev,
                tags: [...prev.tags, prev.newTag.trim()],
                newTag: "",
            }));
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((tag) => tag !== tagToRemove),
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            showToast("Please enter a note title", "error");
            return;
        }

        const newNote: Note = {
            id: note?.id || `note-${Date.now()}`,
            title: formData.title.trim(),
            content: formData.content.trim(),
            tags: formData.tags,
            createdAt: note?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        if (note) {
            updateData({
                misc: {
                    ...data.misc,
                    notes: data.misc.notes.map((n) =>
                        n.id === note.id ? newNote : n
                    ),
                },
            });
            showToast("Note updated successfully!", "success");
        } else {
            updateData({
                misc: {
                    ...data.misc,
                    notes: [...data.misc.notes, newNote],
                },
            });
            showToast("Note added successfully!", "success");
        }

        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={note ? "Edit Note" : "Add Note"}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="default" onClick={handleSubmit}>
                        {note ? "Update" : "Add"} Note
                    </Button>
                </>
            }>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                    label="Note Title *"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Meeting notes"
                    required
                />

                <TextArea
                    label="Content"
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    placeholder="Write your note here..."
                    rows={6}
                />

                {/* Tags */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Tags</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            name="newTag"
                            value={formData.newTag}
                            onChange={handleChange}
                            placeholder="Add a tag..."
                            className="flex-1 px-3 py-2 border rounded-md"
                            onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddTag();
                                }
                            }}
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleAddTag}>
                            Add
                        </Button>
                    </div>
                    {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {formData.tags.map((tag) => (
                                <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="flex items-center gap-1">
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        className="ml-1 hover:text-destructive">
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            </form>
        </Modal>
    );
};
