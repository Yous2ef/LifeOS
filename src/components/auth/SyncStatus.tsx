/**
 * SyncStatus Component
 *
 * Shows the current sync status with Google Drive.
 * Displays different icons and colors based on the sync state.
 */

import React from "react";
import { Cloud, CloudOff, Loader2, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "../../context/AuthContext";
import { useDrive } from "../../hooks/useDrive";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface SyncStatusProps {
    className?: string;
    showLabel?: boolean;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({
    className = "",
    showLabel = false,
}) => {
    const { isAuthenticated, accessToken } = useAuth();
    const { syncStatus } = useDrive();

    // Not authenticated - show offline status
    if (!isAuthenticated || !accessToken) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={cn(
                                "flex items-center gap-2 text-muted-foreground",
                                className
                            )}>
                            <CloudOff className="h-4 w-4" />
                            {showLabel && (
                                <span className="text-xs">Local only</span>
                            )}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Sign in to sync with Google Drive</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Get status icon and styling
    const getStatusDisplay = () => {
        switch (syncStatus) {
            case "syncing":
                return {
                    icon: <Loader2 className="h-4 w-4 animate-spin" />,
                    label: "Syncing...",
                    color: "text-blue-500",
                    tooltip: "Syncing with Google Drive...",
                };
            case "success":
                return {
                    icon: <Check className="h-4 w-4" />,
                    label: "Synced",
                    color: "text-green-500",
                    tooltip: "Successfully synced with Google Drive",
                };
            case "error":
                return {
                    icon: <AlertCircle className="h-4 w-4" />,
                    label: "Sync failed",
                    color: "text-destructive",
                    tooltip: "Failed to sync with Google Drive. Will retry.",
                };
            case "idle":
            default:
                return {
                    icon: <Cloud className="h-4 w-4" />,
                    label: "Connected",
                    color: "text-green-500",
                    tooltip: "Connected to Google Drive",
                };
        }
    };

    const status = getStatusDisplay();

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            "flex items-center gap-2",
                            status.color,
                            className
                        )}>
                        {status.icon}
                        {showLabel && (
                            <span className="text-xs">{status.label}</span>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{status.tooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default SyncStatus;
