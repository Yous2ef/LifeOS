import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import {
    Settings as SettingsIcon,
    Bell,
    Trash2,
    RotateCcw,
} from "lucide-react";

export const Settings: React.FC = () => {
    const {
        dismissedNotifications,
        neverShowAgain,
        resetDismissedNotifications,
    } = useApp();
    const [showConfirm, setShowConfirm] = useState(false);

    const handleResetNotifications = () => {
        resetDismissedNotifications();
        setShowConfirm(false);
    };

    const activelyDismissedCount = dismissedNotifications.filter((n) => {
        if (!n.dismissUntil) return true; // Session-based dismissal
        return new Date(n.dismissUntil) > new Date(); // Still within time period
    }).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <SettingsIcon className="text-primary" size={32} />
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            </div>

            {/* Notification Settings */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Bell className="text-primary" size={24} />
                    <h2 className="text-2xl font-bold text-foreground">
                        Notification Settings
                    </h2>
                </div>

                <div className="space-y-6">
                    {/* Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                            <div className="text-3xl font-bold text-primary">
                                {activelyDismissedCount}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Currently Dismissed
                            </div>
                        </div>
                        <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/20">
                            <div className="text-3xl font-bold text-destructive">
                                {neverShowAgain.length}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Never Show Again
                            </div>
                        </div>
                        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                {dismissedNotifications.length +
                                    neverShowAgain.length}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Total Dismissed
                            </div>
                        </div>
                    </div>

                    {/* Information */}
                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                        <h3 className="font-semibold text-lg mb-3 text-foreground">
                            How Notification Dismissal Works
                        </h3>
                        <ul className="space-y-2 text-sm text-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>
                                    <strong>Session Only:</strong> Notification
                                    is hidden until you close and reopen the app
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 dark:text-green-400 mt-1">
                                    •
                                </span>
                                <span>
                                    <strong>For 1 Day:</strong> Notification
                                    will reappear after 24 hours
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-yellow-600 dark:text-yellow-400 mt-1">
                                    •
                                </span>
                                <span>
                                    <strong>For 1 Week:</strong> Notification
                                    will reappear after 7 days
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-destructive mt-1">•</span>
                                <span>
                                    <strong>Never Show Again:</strong>{" "}
                                    Notification is permanently hidden
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Dismissed Notifications List */}
                    {dismissedNotifications.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-lg mb-3 text-foreground">
                                Dismissed Notifications
                            </h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {dismissedNotifications.map((notification) => {
                                    const isPastDue =
                                        notification.dismissUntil &&
                                        new Date(notification.dismissUntil) <
                                            new Date();
                                    const dismissType =
                                        !notification.dismissUntil
                                            ? "Until next session"
                                            : isPastDue
                                            ? "Expired (will show again)"
                                            : `Until ${new Date(
                                                  notification.dismissUntil
                                              ).toLocaleDateString()}`;

                                    return (
                                        <div
                                            key={notification.id}
                                            className="bg-muted/50 rounded p-3 border border-border flex justify-between items-center">
                                            <div className="flex-1">
                                                <div className="font-mono text-xs text-muted-foreground">
                                                    {notification.id}
                                                </div>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    {dismissType}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Never Show Again List */}
                    {neverShowAgain.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-lg mb-3 text-foreground">
                                Never Show Again
                            </h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {neverShowAgain.map((id) => (
                                    <div
                                        key={id}
                                        className="bg-destructive/10 rounded p-3 border border-destructive/20 flex justify-between items-center">
                                        <div className="font-mono text-xs text-muted-foreground">
                                            {id}
                                        </div>
                                        <span className="text-xs text-destructive">
                                            Permanently Hidden
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reset Button */}
                    <div className="pt-4 border-t border-border">
                        {!showConfirm ? (
                            <Button
                                variant="destructive"
                                onClick={() => setShowConfirm(true)}
                                disabled={
                                    dismissedNotifications.length === 0 &&
                                    neverShowAgain.length === 0
                                }>
                                <RotateCcw size={16} />
                                Reset All Dismissed Notifications
                            </Button>
                        ) : (
                            <div className="space-y-3">
                                <div className="bg-destructive/10 border border-destructive/20 rounded p-4">
                                    <div className="flex items-start gap-2 mb-3">
                                        <Trash2
                                            className="text-destructive mt-1"
                                            size={20}
                                        />
                                        <div>
                                            <p className="font-semibold text-destructive">
                                                Are you sure?
                                            </p>
                                            <p className="text-sm text-foreground mt-1">
                                                This will show all dismissed
                                                notifications again, including
                                                those marked as "Never Show
                                                Again".
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="destructive"
                                            onClick={handleResetNotifications}>
                                            Yes, Reset All
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() =>
                                                setShowConfirm(false)
                                            }>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Other Settings Sections (Placeholder for future) */}
            <Card className="p-6">
                <h2 className="text-xl font-bold mb-2 text-foreground">
                    More Settings Coming Soon
                </h2>
                <p className="text-muted-foreground">
                    Additional settings like theme customization, data
                    export/import, and more will be added here.
                </p>
            </Card>
        </div>
    );
};
