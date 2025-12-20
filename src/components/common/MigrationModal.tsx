import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import {
    Zap,
    HardDrive,
    Shield,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ArrowRight,
} from "lucide-react";

export type MigrationStatus = "pending" | "in-progress" | "complete" | "failed";

interface MigrationModalProps {
    isOpen: boolean;
    onMigrate: () => Promise<void>;
    onSkip: () => void;
    status: MigrationStatus;
    error?: string;
}

export const MigrationModal: React.FC<MigrationModalProps> = ({
    isOpen,
    onMigrate,
    onSkip,
    status,
    error,
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleMigrate = async () => {
        setIsLoading(true);
        try {
            await onMigrate();
        } finally {
            setIsLoading(false);
        }
    };

    // Render based on status
    if (status === "complete") {
        return (
            <Modal
                isOpen={isOpen}
                onClose={onSkip}
                title="Upgrade Complete!"
                size="md">
                <div className="text-center space-y-4 py-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-500">
                        <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                        Your data has been upgraded!
                    </h3>
                    <p className="text-muted-foreground">
                        LifeOS is now using the new faster storage system. Your
                        previous data has been backed up safely.
                    </p>
                    <div className="pt-4">
                        <Button onClick={onSkip} className="w-full sm:w-auto">
                            Get Started
                        </Button>
                    </div>
                </div>
            </Modal>
        );
    }

    if (status === "failed") {
        return (
            <Modal
                isOpen={isOpen}
                onClose={onSkip}
                title="Upgrade Failed"
                size="md">
                <div className="text-center space-y-4 py-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 text-red-500">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                        Something went wrong
                    </h3>
                    <p className="text-muted-foreground">
                        {error ||
                            "The upgrade could not be completed. Your original data is safe."}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        You can try again later from Settings → Storage.
                    </p>
                    <div className="pt-4 flex gap-3 justify-center">
                        <Button variant="outline" onClick={onSkip}>
                            Continue Anyway
                        </Button>
                        <Button onClick={handleMigrate} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Retrying...
                                </>
                            ) : (
                                "Try Again"
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>
        );
    }

    // Default: pending or in-progress
    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {}} // Prevent closing during migration
            title="🔄 Database Upgrade Available"
            size="md">
            <div className="space-y-6">
                {/* Benefits */}
                <div className="space-y-4">
                    <p className="text-muted-foreground">
                        LifeOS has a new, faster storage system. This one-time
                        upgrade will improve your experience:
                    </p>

                    <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
                            <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                <Zap size={20} />
                            </div>
                            <div>
                                <h4 className="font-medium text-foreground">
                                    6x Faster Loading
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    App loads in ~100ms instead of ~600ms
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500">
                                <HardDrive size={20} />
                            </div>
                            <div>
                                <h4 className="font-medium text-foreground">
                                    18% Less Storage
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    More efficient data structure uses less
                                    space
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
                            <div className="p-2 bg-green-500/20 rounded-lg text-green-500">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h4 className="font-medium text-foreground">
                                    Better Reliability
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Single file sync means fewer errors
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Backup notice */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                        <strong>Your data is safe.</strong> A backup will be
                        created before the upgrade. You can rollback anytime
                        from Settings.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                        variant="outline"
                        onClick={onSkip}
                        disabled={status === "in-progress"}
                        className="flex-1">
                        Skip for Now
                    </Button>
                    <Button
                        onClick={handleMigrate}
                        disabled={status === "in-progress"}
                        className="flex-1">
                        {status === "in-progress" ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Upgrading...
                            </>
                        ) : (
                            <>
                                Upgrade Now
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
