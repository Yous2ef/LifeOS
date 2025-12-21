import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useStorageContext } from "../../context/StorageContext";
import { formatDistanceToNow } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from "../ui/dropdown-menu";
import { Button } from "../ui/Button";
import {
    User,
    LogOut,
    Cloud,
    CloudOff,
    Settings,
    RefreshCw,
    Loader2,
    ChevronDown,
    Check,
} from "lucide-react";

interface UserMenuProps {
    className?: string;
    variant?: "avatar" | "full";
}

export const UserMenu: React.FC<UserMenuProps> = ({
    className = "",
    variant = "avatar",
}) => {
    const { user, logout, isAuthenticated, accessToken } = useAuth();
    const { syncNow, isSyncing, lastSyncTime } = useStorageContext();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [justSynced, setJustSynced] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleSyncNow = async () => {
        try {
            await syncNow();
            setJustSynced(true);
            // Reset the "just synced" state after 3 seconds
            setTimeout(() => setJustSynced(false), 3000);
        } catch (error) {
            console.error("Sync failed:", error);
        }
    };

    // Format last sync time
    const getLastSyncText = () => {
        if (!lastSyncTime) return "Never synced";
        return `Last synced ${formatDistanceToNow(lastSyncTime, {
            addSuffix: true,
        })}`;
    };

    if (!isAuthenticated || !user) {
        return null;
    }

    // Avatar-only trigger (compact)
    const AvatarTrigger = (
        <Button
            variant="ghost"
            className={`relative h-9 w-9 rounded-full p-0 ${className}`}>
            {user.picture ? (
                <img
                    src={user.picture}
                    alt={user.name}
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/20 hover:ring-primary/40 transition-all"
                    referrerPolicy="no-referrer"
                />
            ) : (
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                </div>
            )}
        </Button>
    );

    // Full user card trigger (for sidebar)
    const FullTrigger = (
        <Button
            variant="ghost"
            className={`flex items-center gap-3 p-2 h-auto rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 ${className}`}>
            {user.picture ? (
                <img
                    src={user.picture}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20"
                    referrerPolicy="no-referrer"
                />
            ) : (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-medium text-primary">
                        {user.givenName?.charAt(0) ||
                            user.name?.charAt(0) ||
                            "U"}
                    </span>
                </div>
            )}
            <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate text-sidebar-foreground">
                    {user.givenName || user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                </p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </Button>
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {variant === "full" ? FullTrigger : AvatarTrigger}
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                side="top"
                sideOffset={8}
                className="w-64 z-[100]"
                // Ensure dropdown stays within viewport on mobile
                collisionPadding={16}>
                {/* User Info */}
                <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-3">
                        {user.picture ? (
                            <img
                                src={user.picture}
                                alt={user.name}
                                className="h-10 w-10 rounded-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-6 w-6 text-primary" />
                            </div>
                        )}
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">
                                {user.name}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                            </p>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Sync Status */}
                <DropdownMenuItem
                    className="cursor-default flex-col items-start"
                    disabled>
                    <div className="flex items-center gap-2 text-sm w-full">
                        {accessToken ? (
                            <>
                                <Cloud className="h-4 w-4 text-green-500" />
                                <span className="text-green-600 dark:text-green-400">
                                    Connected to Google Drive
                                </span>
                            </>
                        ) : (
                            <>
                                <CloudOff className="h-4 w-4 text-yellow-500" />
                                <span className="text-yellow-600 dark:text-yellow-400">
                                    Drive not connected
                                </span>
                            </>
                        )}
                    </div>
                    {accessToken && (
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                            {getLastSyncText()}
                        </p>
                    )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                {/* Actions */}
                <DropdownMenuItem
                    onClick={handleSyncNow}
                    disabled={isSyncing || !accessToken}
                    className="cursor-pointer">
                    {isSyncing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span>Syncing...</span>
                        </>
                    ) : justSynced ? (
                        <>
                            <Check className="mr-2 h-4 w-4 text-green-500" />
                            <span className="text-green-600 dark:text-green-400">
                                Synced!
                            </span>
                        </>
                    ) : (
                        <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            <span>Sync Now</span>
                        </>
                    )}
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => {
                        // TODO: Navigate to settings
                        window.location.hash = "#/settings";
                    }}
                    className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Account Settings</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Logout */}
                <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                    {isLoggingOut ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span>Signing out...</span>
                        </>
                    ) : (
                        <>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sign out</span>
                        </>
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default UserMenu;
