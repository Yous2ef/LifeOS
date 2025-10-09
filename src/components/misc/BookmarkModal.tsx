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
import { X } from "lucide-react";
import { useApp } from "../../context/AppContext";
import type { Bookmark } from "../../types";

interface BookmarkModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookmark?: Bookmark;
}

export const BookmarkModal: React.FC<BookmarkModalProps> = ({
    isOpen,
    onClose,
    bookmark,
}) => {
    const { data, updateData, showToast } = useApp();
    const [formData, setFormData] = useState({
        title: "",
        url: "",
        category: "personal",
        tags: [] as string[],
        newTag: "",
    });

    useEffect(() => {
        if (bookmark) {
            setFormData({
                title: bookmark.title,
                url: bookmark.url,
                category: bookmark.category,
                tags: bookmark.tags,
                newTag: "",
            });
        } else {
            setFormData({
                title: "",
                url: "",
                category: "personal",
                tags: [],
                newTag: "",
            });
        }
    }, [bookmark, isOpen]);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
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

        if (!formData.title.trim() || !formData.url.trim()) {
            showToast("Please enter title and URL", "error");
            return;
        }

        const newBookmark: Bookmark = {
            id: bookmark?.id || `bookmark-${Date.now()}`,
            title: formData.title.trim(),
            url: formData.url.trim(),
            category: formData.category,
            tags: formData.tags,
            createdAt: bookmark?.createdAt || new Date().toISOString(),
        };

        if (bookmark) {
            updateData({
                misc: {
                    ...data.misc,
                    bookmarks: data.misc.bookmarks.map((b) =>
                        b.id === bookmark.id ? newBookmark : b
                    ),
                },
            });
            showToast("Bookmark updated successfully!", "success");
        } else {
            updateData({
                misc: {
                    ...data.misc,
                    bookmarks: [...data.misc.bookmarks, newBookmark],
                },
            });
            showToast("Bookmark added successfully!", "success");
        }

        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={bookmark ? "Edit Bookmark" : "Add Bookmark"}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="default" onClick={handleSubmit}>
                        {bookmark ? "Update" : "Add"} Bookmark
                    </Button>
                </>
            }>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                    label="Bookmark Title *"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., React Documentation"
                    required
                />

                <FormInput
                    label="URL *"
                    name="url"
                    type="url"
                    value={formData.url}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    required
                />

                <FormSelect
                    label="Category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    options={[
                        { value: "work", label: "Work" },
                        { value: "personal", label: "Personal" },
                        { value: "learning", label: "Learning" },
                        { value: "reference", label: "Reference" },
                        { value: "inspiration", label: "Inspiration" },
                        { value: "tools", label: "Tools" },
                    ]}
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
