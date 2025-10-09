import React, {
    useState,
    useEffect,
    type ChangeEvent,
    type FormEvent,
} from "react";
import { Modal } from "../ui/Modal";
import { TextArea } from "../ui/TextArea";
import { FormSelect } from "../ui/FormSelect";
import { Button } from "../ui/Button";
import { useApp } from "../../context/AppContext";
import type { QuickCapture } from "../../types";

interface QuickCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    capture?: QuickCapture;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
    isOpen,
    onClose,
    capture,
}) => {
    const { data, updateData, showToast } = useApp();
    const [formData, setFormData] = useState({
        content: "",
        module: "" as QuickCapture["module"] | "",
        processed: false,
    });

    useEffect(() => {
        if (capture) {
            setFormData({
                content: capture.content,
                module: capture.module || "",
                processed: capture.processed,
            });
        } else {
            setFormData({
                content: "",
                module: "",
                processed: false,
            });
        }
    }, [capture, isOpen]);

    const handleChange = (
        e: ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!formData.content.trim()) {
            showToast("Please enter content", "error");
            return;
        }

        const newCapture: QuickCapture = {
            id: capture?.id || `capture-${Date.now()}`,
            content: formData.content.trim(),
            module: formData.module || undefined,
            processed: formData.processed,
            createdAt: capture?.createdAt || new Date().toISOString(),
        };

        if (capture) {
            updateData({
                misc: {
                    ...data.misc,
                    quickCaptures: data.misc.quickCaptures.map((c) =>
                        c.id === capture.id ? newCapture : c
                    ),
                },
            });
            showToast("Capture updated successfully!", "success");
        } else {
            updateData({
                misc: {
                    ...data.misc,
                    quickCaptures: [...data.misc.quickCaptures, newCapture],
                },
            });
            showToast("Capture added successfully!", "success");
        }

        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={capture ? "Edit Quick Capture" : "Quick Capture"}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="default" onClick={handleSubmit}>
                        {capture ? "Update" : "Capture"}
                    </Button>
                </>
            }>
            <form onSubmit={handleSubmit} className="space-y-4">
                <TextArea
                    label="Content *"
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    placeholder="Quickly capture your thought or idea..."
                    rows={4}
                    required
                />

                <FormSelect
                    label="Related Module (Optional)"
                    name="module"
                    value={formData.module}
                    onChange={handleChange}
                    options={[
                        { value: "", label: "None" },
                        { value: "university", label: "University" },
                        { value: "freelancing", label: "Freelancing" },
                        { value: "programming", label: "Programming" },
                        { value: "home", label: "Home" },
                        { value: "misc", label: "Miscellaneous" },
                    ]}
                />
            </form>
        </Modal>
    );
};
