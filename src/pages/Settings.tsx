import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import {
    Settings as SettingsIcon,
    Bell,
    Trash2,
    RotateCcw,
    Database,
    HardDrive,
    Download,
    Upload,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Code,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import {
    detectStorageVersion,
    exportData,
    importData,
    V2_STORAGE_KEY,
} from "../utils/storage";
import { hasV1Backup, restoreV1FromBackup } from "../utils/legacyStorage";
import {
    getFeatureFlags,
    setFeatureFlag,
    resetFeatureFlags,
    type FeatureFlags,
} from "../utils/featureFlags";

export const Settings: React.FC = () => {
    const {
        dismissedNotifications,
        neverShowAgain,
        resetDismissedNotifications,
        refreshData,
    } = useApp();
    const [showConfirm, setShowConfirm] = useState(false);
    const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);
    const [isRollingBack, setIsRollingBack] = useState(false);
    const [rollbackError, setRollbackError] = useState<string | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    // Storage info state
    const [storageVersion, setStorageVersion] = useState<string | null>(null);
    const [storageSize, setStorageSize] = useState<number>(0);
    const [hasBackup, setHasBackup] = useState(false);

    // Developer options state
    const [showDevOptions, setShowDevOptions] = useState(false);
    const [featureFlags, setFeatureFlagsState] =
        useState<FeatureFlags>(getFeatureFlags);

    // Load storage info on mount
    useEffect(() => {
        const version = detectStorageVersion();
        setStorageVersion(version);
        setHasBackup(hasV1Backup());

        // Calculate storage size
        const v2Data = localStorage.getItem(V2_STORAGE_KEY);
        if (v2Data) {
            setStorageSize(new Blob([v2Data]).size);
        }
    }, []);

    const handleFeatureFlagChange = <K extends keyof FeatureFlags>(
        flag: K,
        value: FeatureFlags[K]
    ) => {
        setFeatureFlag(flag, value);
        setFeatureFlagsState(getFeatureFlags());
    };

    const handleResetFlags = () => {
        resetFeatureFlags();
        setFeatureFlagsState(getFeatureFlags());
    };

    const handleRollback = async () => {
        setIsRollingBack(true);
        setRollbackError(null);

        try {
            const success = restoreV1FromBackup();
            if (success) {
                // Remove V2 storage
                localStorage.removeItem(V2_STORAGE_KEY);
                // Reload the page to apply changes
                window.location.reload();
            } else {
                setRollbackError("No backup found to restore.");
            }
        } catch (error) {
            setRollbackError(
                error instanceof Error ? error.message : "Rollback failed"
            );
        } finally {
            setIsRollingBack(false);
        }
    };

    const handleExport = () => {
        exportData();
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportError(null);

        try {
            await importData(file);
            refreshData();
            // Reset the input
            event.target.value = "";
        } catch (error) {
            setImportError(
                error instanceof Error ? error.message : "Import failed"
            );
        } finally {
            setIsImporting(false);
        }
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

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
                <div className="flex items-center gap-2 mb-4">
                    <Database className="text-primary" size={24} />
                    <h2 className="text-2xl font-bold text-foreground">
                        Storage & Data
                    </h2>
                </div>

                <div className="space-y-6">
                    {/* Storage Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                            <div className="text-sm text-muted-foreground mb-1">
                                Storage Format
                            </div>
                            <div className="text-xl font-bold text-primary flex items-center gap-2">
                                {storageVersion === "2.0.0" ? (
                                    <>
                                        <CheckCircle2 size={18} />
                                        V2 (Unified)
                                    </>
                                ) : storageVersion === "1.0.0" ? (
                                    <>
                                        <AlertTriangle size={18} />
                                        V1 (Legacy)
                                    </>
                                ) : (
                                    "Fresh Install"
                                )}
                            </div>
                        </div>
                        <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                            <div className="text-sm text-muted-foreground mb-1">
                                Storage Size
                            </div>
                            <div className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                <HardDrive size={18} />
                                {formatBytes(storageSize)}
                            </div>
                        </div>
                        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                            <div className="text-sm text-muted-foreground mb-1">
                                Backup Available
                            </div>
                            <div className="text-xl font-bold text-green-600 dark:text-green-400">
                                {hasBackup ? "Yes (V1)" : "No"}
                            </div>
                        </div>
                    </div>

                    {/* Export/Import */}
                    <div className="border border-border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-3 text-foreground">
                            Export & Import Data
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Export your data as a JSON file for backup or
                            transfer to another device.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Button variant="outline" onClick={handleExport}>
                                <Download size={16} />
                                Export Data
                            </Button>
                            <label>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImport}
                                    className="hidden"
                                    disabled={isImporting}
                                />
                                <Button
                                    variant="outline"
                                    asChild
                                    disabled={isImporting}>
                                    <span>
                                        {isImporting ? (
                                            <>
                                                <Loader2
                                                    className="animate-spin"
                                                    size={16}
                                                />
                                                Importing...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={16} />
                                                Import Data
                                            </>
                                        )}
                                    </span>
                                </Button>
                            </label>
                        </div>
                        {importError && (
                            <p className="text-sm text-destructive mt-2">
                                {importError}
                            </p>
                        )}
                    </div>

                    {/* Rollback Section */}
                    {hasBackup && (
                        <div className="border border-amber-500/30 bg-amber-500/5 rounded-lg p-4">
                            <h3 className="font-semibold text-lg mb-2 text-foreground flex items-center gap-2">
                                <AlertTriangle
                                    className="text-amber-500"
                                    size={20}
                                />
                                Rollback to V1
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                If you're experiencing issues with the new
                                storage system, you can rollback to the previous
                                V1 format. Your V1 backup from the migration
                                will be restored.
                            </p>

                            {!showRollbackConfirm ? (
                                <Button
                                    variant="outline"
                                    onClick={() => setShowRollbackConfirm(true)}
                                    className="border-amber-500/50 hover:bg-amber-500/10">
                                    <RotateCcw size={16} />
                                    Rollback to V1
                                </Button>
                            ) : (
                                <div className="space-y-3 bg-amber-500/10 border border-amber-500/30 rounded p-4">
                                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                        Are you sure you want to rollback? This
                                        will:
                                    </p>
                                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                        <li>
                                            Restore your V1 data from backup
                                        </li>
                                        <li>Remove the V2 unified storage</li>
                                        <li>Reload the application</li>
                                    </ul>
                                    {rollbackError && (
                                        <p className="text-sm text-destructive">
                                            {rollbackError}
                                        </p>
                                    )}
                                    <div className="flex gap-2">
                                        <Button
                                            variant="destructive"
                                            onClick={handleRollback}
                                            disabled={isRollingBack}>
                                            {isRollingBack ? (
                                                <>
                                                    <Loader2
                                                        className="animate-spin"
                                                        size={16}
                                                    />
                                                    Rolling back...
                                                </>
                                            ) : (
                                                "Yes, Rollback"
                                            )}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() =>
                                                setShowRollbackConfirm(false)
                                            }
                                            disabled={isRollingBack}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>

            {/* Developer Options (Collapsible) */}
            <Card className="p-6">
                <button
                    onClick={() => setShowDevOptions(!showDevOptions)}
                    className="flex items-center justify-between w-full text-left">
                    <div className="flex items-center gap-2">
                        <Code className="text-muted-foreground" size={24} />
                        <h2 className="text-2xl font-bold text-foreground">
                            Developer Options
                        </h2>
                    </div>
                    {showDevOptions ? (
                        <ChevronUp
                            className="text-muted-foreground"
                            size={20}
                        />
                    ) : (
                        <ChevronDown
                            className="text-muted-foreground"
                            size={20}
                        />
                    )}
                </button>

                {showDevOptions && (
                    <div className="space-y-6 mt-6 pt-6 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                            These options are for advanced users and developers.
                            Changes may require a page refresh to take effect.
                        </p>

                        {/* Feature Flags */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg text-foreground">
                                Feature Flags
                            </h3>

                            <div className="space-y-3">
                                <label className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border cursor-pointer">
                                    <div>
                                        <div className="font-medium text-foreground">
                                            Use Unified Storage (V2)
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Single localStorage key with all
                                            data
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={featureFlags.useUnifiedStorage}
                                        onChange={(e) =>
                                            handleFeatureFlagChange(
                                                "useUnifiedStorage",
                                                e.target.checked
                                            )
                                        }
                                        className="w-5 h-5 accent-primary"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border cursor-pointer">
                                    <div>
                                        <div className="font-medium text-foreground">
                                            Debug Mode
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Show extra logging in browser
                                            console
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={featureFlags.debugMode}
                                        onChange={(e) =>
                                            handleFeatureFlagChange(
                                                "debugMode",
                                                e.target.checked
                                            )
                                        }
                                        className="w-5 h-5 accent-primary"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border cursor-pointer">
                                    <div>
                                        <div className="font-medium text-foreground">
                                            Experimental Features
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Enable features that are still in
                                            development
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={
                                            featureFlags.experimentalFeatures
                                        }
                                        onChange={(e) =>
                                            handleFeatureFlagChange(
                                                "experimentalFeatures",
                                                e.target.checked
                                            )
                                        }
                                        className="w-5 h-5 accent-primary"
                                    />
                                </label>
                            </div>

                            <Button
                                variant="outline"
                                onClick={handleResetFlags}>
                                <RotateCcw size={16} />
                                Reset to Defaults
                            </Button>
                        </div>

                        {/* Debug Info */}
                        {featureFlags.debugMode && (
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg text-foreground">
                                    Debug Information
                                </h3>
                                <pre className="p-4 bg-muted/50 rounded-lg border border-border text-xs overflow-x-auto">
                                    {JSON.stringify(
                                        {
                                            storageVersion,
                                            storageSize: `${storageSize} bytes`,
                                            hasV1Backup: hasBackup,
                                            featureFlags,
                                            userAgent: navigator.userAgent,
                                            timestamp: new Date().toISOString(),
                                        },
                                        null,
                                        2
                                    )}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
};
