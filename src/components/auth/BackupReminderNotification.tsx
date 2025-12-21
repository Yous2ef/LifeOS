import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { X, AlertCircle, Download } from "lucide-react";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { exportData } from "../../utils/storage";

const REMINDER_DISMISSED_KEY = "lifeos_backup_reminder_dismissed";
const REMINDER_LAST_SHOWN_KEY = "lifeos_backup_reminder_last_shown";
const REMINDER_NEVER_SHOW_KEY = "lifeos_backup_reminder_never_show";

// Show reminder every 7 days for guest users
const REMINDER_INTERVAL_DAYS = 7;

interface BackupReminderNotificationProps {
    className?: string;
}

export const BackupReminderNotification: React.FC<
    BackupReminderNotificationProps
> = ({ className = "" }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Don't show if user is authenticated or loading
        if (isAuthenticated || isLoading) {
            setIsVisible(false);
            return;
        }

        // Check if user set to never show
        const neverShow = localStorage.getItem(REMINDER_NEVER_SHOW_KEY);
        if (neverShow === "true") {
            setIsVisible(false);
            return;
        }

        // Check if dismissed in this session
        const dismissed = sessionStorage.getItem(REMINDER_DISMISSED_KEY);
        if (dismissed === "true") {
            setIsVisible(false);
            return;
        }

        // Check when last shown
        const lastShown = localStorage.getItem(REMINDER_LAST_SHOWN_KEY);
        const now = Date.now();

        if (lastShown) {
            const lastShownDate = parseInt(lastShown, 10);
            const daysSinceLastShown =
                (now - lastShownDate) / (1000 * 60 * 60 * 24);

            if (daysSinceLastShown < REMINDER_INTERVAL_DAYS) {
                setIsVisible(false);
                return;
            }
        }

        // Check if user has any data worth backing up
        const hasData = localStorage.getItem("lifeos");
        if (!hasData) {
            setIsVisible(false);
            return;
        }

        // Show the reminder
        setIsVisible(true);
        localStorage.setItem(REMINDER_LAST_SHOWN_KEY, String(now));
    }, [isAuthenticated, isLoading]);

    const handleDismiss = () => {
        sessionStorage.setItem(REMINDER_DISMISSED_KEY, "true");
        setIsVisible(false);
    };

    const handleNeverShow = () => {
        localStorage.setItem(REMINDER_NEVER_SHOW_KEY, "true");
        setIsVisible(false);
    };

    const handleExportBackup = () => {
        exportData();
        handleDismiss();
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div
            className={`fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-4 ${className}`}>
            <div className="bg-card border border-border rounded-xl shadow-lg p-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg shrink-0">
                        <AlertCircle className="text-amber-500" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-foreground">
                                Backup Reminder
                            </h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDismiss}
                                className="text-muted-foreground hover:text-foreground -mt-1 -mr-1 h-7 w-7 p-0">
                                <X size={16} />
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 mb-3">
                            Your data is only stored locally. Sign in to enable
                            cloud backup or export your data to keep it safe.
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            <GoogleLoginButton />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportBackup}>
                                <Download size={14} />
                                Export Backup
                            </Button>
                        </div>
                        <button
                            onClick={handleNeverShow}
                            className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors">
                            Don't remind me again
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
