import React from "react";
import { Modal } from "../ui/Modal";
import { Cloud, HardDrive, GitMerge, Clock, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export type ConflictResolution = "cloud" | "local" | "merge";

export interface ConflictData {
    localLastModified: Date;
    cloudLastModified: Date;
    localDataSize: number;
    cloudDataSize: number;
}

interface SyncConflictModalProps {
    isOpen: boolean;
    onResolve: (resolution: ConflictResolution) => void;
    conflictData: ConflictData;
    isResolving?: boolean;
}

export const SyncConflictModal: React.FC<SyncConflictModalProps> = ({
    isOpen,
    onResolve,
    conflictData,
    isResolving = false,
}) => {
    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const localAge = formatDistanceToNow(conflictData.localLastModified, {
        addSuffix: true,
    });
    const cloudAge = formatDistanceToNow(conflictData.cloudLastModified, {
        addSuffix: true,
    });

    const isLocalNewer =
        conflictData.localLastModified > conflictData.cloudLastModified;

    return (
        <Modal isOpen={isOpen} onClose={() => {}} title="" size="lg">
            <div className="space-y-6 py-2">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-500/20 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">
                            Sync Conflict Detected
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Your local and cloud data have diverged. Choose how
                            to proceed.
                        </p>
                    </div>
                </div>

                {/* Comparison */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Local Data Card */}
                    <div
                        className={`p-4 rounded-lg border-2 ${
                            isLocalNewer
                                ? "border-green-500/50 bg-green-500/5"
                                : "border-border bg-accent/30"
                        }`}>
                        <div className="flex items-center gap-2 mb-3">
                            <HardDrive className="w-5 h-5 text-blue-500" />
                            <span className="font-medium">Local Data</span>
                            {isLocalNewer && (
                                <span className="ml-auto text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-500">
                                    Newer
                                </span>
                            )}
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>Modified {localAge}</span>
                            </div>
                            <div className="text-muted-foreground">
                                Size: {formatSize(conflictData.localDataSize)}
                            </div>
                        </div>
                    </div>

                    {/* Cloud Data Card */}
                    <div
                        className={`p-4 rounded-lg border-2 ${
                            !isLocalNewer
                                ? "border-green-500/50 bg-green-500/5"
                                : "border-border bg-accent/30"
                        }`}>
                        <div className="flex items-center gap-2 mb-3">
                            <Cloud className="w-5 h-5 text-purple-500" />
                            <span className="font-medium">Cloud Data</span>
                            {!isLocalNewer && (
                                <span className="ml-auto text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-500">
                                    Newer
                                </span>
                            )}
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>Modified {cloudAge}</span>
                            </div>
                            <div className="text-muted-foreground">
                                Size: {formatSize(conflictData.cloudDataSize)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resolution Options */}
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">
                        Choose an action:
                    </h4>

                    <button
                        onClick={() => onResolve("cloud")}
                        disabled={isResolving}
                        className="w-full p-4 rounded-lg border border-border hover:border-purple-500/50 hover:bg-purple-500/5 transition-colors text-left group disabled:opacity-50 disabled:cursor-not-allowed">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-500 group-hover:bg-purple-500/30">
                                <Cloud className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-medium text-foreground">
                                    Use Cloud Data
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Replace local data with cloud version. Local
                                    changes will be lost.
                                </div>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => onResolve("local")}
                        disabled={isResolving}
                        className="w-full p-4 rounded-lg border border-border hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors text-left group disabled:opacity-50 disabled:cursor-not-allowed">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-500 group-hover:bg-blue-500/30">
                                <HardDrive className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-medium text-foreground">
                                    Use Local Data
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Keep local data and upload to cloud. Cloud
                                    version will be overwritten.
                                </div>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => onResolve("merge")}
                        disabled={isResolving}
                        className="w-full p-4 rounded-lg border border-border hover:border-green-500/50 hover:bg-green-500/5 transition-colors text-left group disabled:opacity-50 disabled:cursor-not-allowed">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/20 text-green-500 group-hover:bg-green-500/30">
                                <GitMerge className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-medium text-foreground">
                                    Smart Merge
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Combine both versions, keeping the newest
                                    data from each section.
                                </div>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Recommended action */}
                <div className="p-3 rounded-lg bg-accent/50 border border-border">
                    <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">
                            Recommended:
                        </strong>{" "}
                        {isLocalNewer
                            ? "Your local data is newer. Consider using 'Use Local Data' to preserve your recent changes."
                            : "Your cloud data is newer. Consider using 'Use Cloud Data' to get the latest version."}
                    </p>
                </div>
            </div>
        </Modal>
    );
};
