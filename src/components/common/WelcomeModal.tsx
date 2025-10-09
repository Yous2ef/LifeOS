import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface WelcomeModalProps {
    isOpen: boolean;
    onComplete: (name: string) => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
    isOpen,
    onComplete,
}) => {
    const [name, setName] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedName = name.trim();

        if (!trimmedName) {
            setError("Please enter your name");
            return;
        }

        if (trimmedName.length < 2) {
            setError("Name must be at least 2 characters long");
            return;
        }

        onComplete(trimmedName);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {}} // Prevent closing
            title="Welcome to LifeOS!"
            size="md">
            <div className="space-y-4">
                <p className="text-muted-foreground">
                    Hi there! 👋 Welcome to your personal Life Operating System.
                    Before we get started, we'd love to know your name to
                    personalize your experience.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="userName"
                            className="block text-sm font-medium mb-2">
                            What's your name?
                        </label>
                        <Input
                            id="userName"
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError("");
                            }}
                            placeholder="Enter your name"
                            className="w-full"
                            autoFocus
                        />
                        {error && (
                            <p className="text-sm text-red-500 mt-1">{error}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="submit" className="w-full sm:w-auto">
                            Get Started
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};
