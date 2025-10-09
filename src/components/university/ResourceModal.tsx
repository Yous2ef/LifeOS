import { useState, useEffect } from "react";
import { X, Link as LinkIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Resource } from "../../types";

interface ResourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (resource: Omit<Resource, "id">) => void;
    resource?: Resource;
}

export const ResourceModal = ({
    isOpen,
    onClose,
    onSave,
    resource,
}: ResourceModalProps) => {
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [description, setDescription] = useState("");
    const [errors, setErrors] = useState<{
        title?: string;
        url?: string;
    }>({});

    useEffect(() => {
        if (resource) {
            setTitle(resource.title);
            setUrl(resource.url);
            setDescription(resource.description || "");
        } else {
            setTitle("");
            setUrl("");
            setDescription("");
        }
        setErrors({});
    }, [resource, isOpen]);

    const validateUrl = (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const handleSave = () => {
        const newErrors: { title?: string; url?: string } = {};

        if (!title.trim()) {
            newErrors.title = "Title is required";
        }
        if (!url.trim()) {
            newErrors.url = "URL is required";
        } else if (!validateUrl(url)) {
            newErrors.url =
                "Please enter a valid URL (e.g., https://example.com)";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSave({
            title: title.trim(),
            url: url.trim(),
            description: description.trim() || undefined,
        });

        // Reset form
        setTitle("");
        setUrl("");
        setDescription("");
        setErrors({});
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-background rounded-lg shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <LinkIcon className="w-5 h-5" />
                        {resource ? "Edit Resource" : "Add Resource"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            className={cn(
                                "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary",
                                errors.title && "border-red-500"
                            )}
                            placeholder="e.g., Course Textbook, Lecture Slides, etc."
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                if (errors.title) {
                                    setErrors({ ...errors, title: undefined });
                                }
                            }}
                        />
                        {errors.title && (
                            <p className="text-sm text-red-500 mt-1">
                                {errors.title}
                            </p>
                        )}
                    </div>

                    {/* URL */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            URL <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="url"
                            className={cn(
                                "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary",
                                errors.url && "border-red-500"
                            )}
                            placeholder="https://example.com"
                            value={url}
                            onChange={(e) => {
                                setUrl(e.target.value);
                                if (errors.url) {
                                    setErrors({ ...errors, url: undefined });
                                }
                            }}
                        />
                        {errors.url && (
                            <p className="text-sm text-red-500 mt-1">
                                {errors.url}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                            <FileText className="w-4 h-4" />
                            Description (Optional)
                        </label>
                        <textarea
                            className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 resize-none"
                            placeholder="Add a brief description about this resource..."
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        {resource ? "Save Changes" : "Add Resource"}
                    </Button>
                </div>
            </div>
        </div>
    );
};
